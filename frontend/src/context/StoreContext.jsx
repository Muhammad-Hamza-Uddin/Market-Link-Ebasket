import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, clearSession, getStoredUser, getToken, saveSession } from "../api/client";
import { backendStatus, entityId, normalizeFarmer, normalizeMarket, normalizeOrder, normalizeProduct, normalizeReview } from "../api/normalize";

const StoreContext = createContext(null);
const CART_KEY = "marketlink_cart";
const FAVORITES_KEY = "marketlink_favorites";
const FAVORITE_FARMERS_KEY = "marketlink_favorite_farmers";

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export function StoreProvider({ children }) {
  const initialLoadStarted = useRef(false);
  const [productsList, setProductsList] = useState([]);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [marketsList, setMarketsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [platformStats, setPlatformStats] = useState({ activeFarmers: 0, weeklyOrders: 0 });
  const [cart, setCart] = useState(() => readStorage(CART_KEY, []));
  const [favorites, setFavorites] = useState(() => readStorage(FAVORITES_KEY, []));
  const [favoriteFarmers, setFavoriteFarmers] = useState(() => readStorage(FAVORITE_FARMERS_KEY, []));
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [toast, setToast] = useState(null);
  const [currentUserState, setCurrentUserState] = useState(() => getStoredUser() || { name: "Guest", email: "", role: "customer" });
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = currentUserState;

  const notify = useCallback((title, subtitle = "", kind) => {
    const inferredKind = kind || (/failed|could not|unable|error|invalid|unavailable|cannot|suspend/i.test(String(title)) ? "error" : "success");
    setToast({ title, subtitle, kind: inferredKind, timestamp: Date.now() });
    if (window.__marketlinkToastTimer) clearTimeout(window.__marketlinkToastTimer);
    window.__marketlinkToastTimer = setTimeout(() => setToast(null), 3000);
  }, []);

  const setCurrentUser = useCallback((value) => {
    setCurrentUserState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;
      if (next) localStorage.setItem("marketlink_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const fetchCatalog = useCallback(async (user = currentUserState) => {
    setIsLoading(true);
    try {
      const [productsResponse, marketsResponse, farmersResponse, categoriesResponse] = await Promise.all([
        api.get("/products?inStock=true"),
        api.get("/markets"),
        api.get("/farmers"),
        api.get("/categories"),
      ]);
      setProductsList((productsResponse.data?.products || []).map(normalizeProduct));
      setMarketsList((marketsResponse.data?.markets || []).map(normalizeMarket));
      setFarmersList((farmersResponse.data?.farmers || []).map(normalizeFarmer));
      setCategoriesList((categoriesResponse.data?.categories || []).map((category) => ({ ...category, id: category._id || category.id })));
      setPlatformStats({
        activeFarmers: Number(farmersResponse.data?.stats?.activeFarmers ?? farmersResponse.data?.farmers?.length ?? 0),
        weeklyOrders: Number(farmersResponse.data?.stats?.weeklyOrders ?? 0),
      });

    } catch (error) {
      notify("API unavailable", error.message || "Start the backend server to load live MarketLink data");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserState, notify]);

  const fetchFarmerProducts = useCallback(async (user = currentUserState) => {
    if (!getToken() || user?.role !== "farmer") {
      setFarmerProducts([]);
      return [];
    }
    const response = await api.get("/products/mine");
    const loaded = (response.data?.products || []).map(normalizeProduct);
    setFarmerProducts(loaded);
    return loaded;
  }, [currentUserState]);

  const fetchFavorites = useCallback(async (user = currentUserState) => {
    if (!getToken() || user?.role !== "customer") return;
    try {
      const response = await api.get("/favorites");
      setFavorites((response.data?.favorites?.products || []).map(normalizeProduct));
      setFavoriteFarmers((response.data?.favorites?.farmers || []).map(normalizeFarmer));
    } catch (error) {
      notify("Could not load favorites", error.message);
    }
  }, [currentUserState, notify]);

  const fetchOrders = useCallback(async (user = currentUserState) => {
    if (!getToken() || !user || !["customer", "farmer", "admin"].includes(user.role)) {
      setOrders([]);
      return;
    }
    try {
      const endpoint = user.role === "farmer" ? "/orders/farmer" : user.role === "admin" ? "/admin/orders" : "/orders/my-orders";
      const response = await api.get(endpoint);
      setOrders((response.data?.orders || []).map(normalizeOrder));
    } catch (error) {
      notify("Could not load orders", error.message);
    }
  }, [currentUserState, notify]);

  const fetchNotifications = useCallback(async () => {
    if (!getToken()) return;
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
      setUnreadNotifications(response.data?.unreadCount || 0);
    } catch (error) { notify("Could not load notifications", error.message); }
  }, [notify]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await api.get("/announcements");
      setAnnouncements(response.data?.announcements || []);
    } catch { setAnnouncements([]); }
  }, []);

  const hydrateSession = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await api.get("/auth/me");
      saveSession(token, response.data.user);
      setCurrentUserState(response.data.user);
      await Promise.all([
        fetchCatalog(response.data.user),
        fetchFarmerProducts(response.data.user),
        fetchOrders(response.data.user),
        fetchFavorites(response.data.user),
        fetchNotifications(),
        fetchAnnouncements(),
      ]);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession();
        setCurrentUserState({ name: "Guest", email: "", role: "customer" });
      }
    }
  }, [fetchCatalog, fetchFarmerProducts, fetchOrders, fetchFavorites, fetchNotifications, fetchAnnouncements]);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    if (getToken()) hydrateSession();
    else {
      fetchCatalog(currentUserState);
      fetchOrders(currentUserState);
      fetchAnnouncements();
    }
  }, []); // Restore the server session once when the app starts.

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(FAVORITE_FARMERS_KEY, JSON.stringify(favoriteFarmers)); }, [favoriteFarmers]);

  const authenticate = useCallback((token, user) => {
    saveSession(token, user);
    setCurrentUserState(user);
    fetchCatalog(user);
    fetchFarmerProducts(user).catch(() => {});
    fetchOrders(user);
    fetchFavorites(user);
    fetchNotifications();
    fetchAnnouncements();
  }, [fetchCatalog, fetchFarmerProducts, fetchOrders, fetchFavorites, fetchNotifications, fetchAnnouncements]);

  const login = useCallback(async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    authenticate(response.token, response.data.user);
    return response.data.user;
  }, [authenticate]);

  const register = useCallback(async (role, profile) => {
    const endpoint = role === "farmer" ? "/auth/register/farmer" : "/auth/register";
    const response = await api.post(endpoint, profile);
    authenticate(response.token, response.data.user);
    return response.data.user;
  }, [authenticate]);

  const logout = useCallback(async () => {
    try { if (getToken()) await api.post("/auth/logout", {}); } catch { /* local logout still clears the session */ }
    clearSession();
    setCurrentUserState({ name: "Guest", email: "", role: "customer" });
    setOrders([]);
    setFavorites([]);
    setFavoriteFarmers([]);
    setNotifications([]);
    setUnreadNotifications(0);
    setFarmerProducts([]);
  }, []);

  const addToCart = (product, quantity = 1) => {
    const productId = entityId(product);
    const maxStock = Number(product.stock ?? product.quantity ?? 0);
    setCart((current) => {
      const existing = current.find((item) => entityId(item) === productId);
      if (existing) {
        return current.map((item) => entityId(item) === productId ? { ...item, quantity: Math.min(maxStock || 99, existing.quantity + quantity) } : item);
      }
      return [...current, { ...product, id: productId, quantity: Math.min(maxStock || 99, quantity) }];
    });
    notify(`${product.name} added to your basket!`, `Quantity: ${quantity} ${product.unit || "unit"}`);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCart((current) => current.map((item) => entityId(item) === id ? { ...item, quantity: Math.min(Number(item.stock ?? 99), quantity) } : item));
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => entityId(item) !== id));
  };

  const clearCart = () => setCart([]);
  const reorder = (order) => {
    const items = (order.items || []).map((item) => {
      const product = productsList.find((candidate) => entityId(candidate) === entityId(item));
      if (!product || product.stock <= 0) return null;
      return { ...product, quantity: Math.min(Number(item.quantity || 1), product.stock) };
    }).filter(Boolean);
    if (!items.length) {
      notify("Reorder unavailable", "None of these products are currently in stock", "error");
      return false;
    }
    setCart(items);
    notify("Order added to basket", "Current prices and availability will be verified at checkout");
    return true;
  };

  const toggleFavorite = async (product) => {
    if (!getToken() || currentUser.role !== "customer") return notify("Sign in to save favorites");
    const id = entityId(product);
    const exists = favorites.some((item) => entityId(item) === id);
    try {
      if (exists) {
        await api.delete(`/favorites/product/${id}`);
        setFavorites((current) => current.filter((item) => entityId(item) !== id));
      } else {
        await api.post("/favorites", { targetType: "product", target: id });
        setFavorites((current) => [...current, product]);
      }
    } catch (error) { notify("Could not update favorite", error.message); }
  };

  const toggleFavoriteFarmer = async (farmer) => {
    if (!getToken() || currentUser.role !== "customer") return notify("Sign in to save favorites");
    const id = entityId(farmer);
    const exists = favoriteFarmers.some((item) => entityId(item) === id);
    try {
      if (exists) {
        await api.delete(`/favorites/farmer/${id}`);
        setFavoriteFarmers((current) => current.filter((item) => entityId(item) !== id));
      } else {
        await api.post("/favorites", { targetType: "farmer", target: id });
        setFavoriteFarmers((current) => [...current, farmer]);
      }
    } catch (error) { notify("Could not update favorite farmer", error.message); }
  };

  const placeOrder = async ({ orders: pickupPlans = [], notes = "" }) => {
    if (!getToken() || currentUser.role !== "customer") throw new Error("Please sign in as a customer before checkout.");
    const groups = cart.reduce((result, item) => {
      const key = `${item.farmerId || entityId(item.farmer)}:${item.marketId || entityId(item.market)}`;
      if (!result.has(key)) result.set(key, []);
      result.get(key).push(item);
      return result;
    }, new Map());
    const planMap = new Map(pickupPlans.map((plan) => [plan.key, plan]));
    const placedOrders = [];

    for (const [key, items] of groups) {
      const plan = planMap.get(key);
      if (!plan?.pickupDate || !plan?.pickupSlot) throw new Error(`Choose a pickup date and time for ${items[0]?.farmer || "each farmer"}.`);
      try {
        const response = await api.post("/orders", {
          items: items.map((item) => ({ product: entityId(item), quantity: item.quantity })),
          pickupDate: plan.pickupDate,
          pickupSlot: plan.pickupSlot,
          notes,
        });
        placedOrders.push(normalizeOrder(response.data.order));
        const placedIds = new Set(items.map(entityId));
        setCart((current) => current.filter((item) => !placedIds.has(entityId(item))));
      } catch (error) {
        await Promise.all([fetchCatalog(currentUser), fetchOrders(currentUser)]);
        const prefix = placedOrders.length ? `${placedOrders.length} order${placedOrders.length === 1 ? " was" : "s were"} placed. ` : "";
        throw new Error(`${prefix}${error.message} Unplaced items remain in your basket.`);
      }
    }

    await Promise.all([fetchCatalog(currentUser), fetchOrders(currentUser)]);
    notify(`${placedOrders.length} pre-order${placedOrders.length === 1 ? "" : "s"} placed successfully!`, "Each farmer received their own pickup order");
    return placedOrders;
  };

  const updateOrderStatus = async (orderId, label) => {
    if (!getToken() || currentUser.role !== "farmer") return;
    try {
      await api.patch(`/orders/${orderId}/status`, { status: backendStatus(label) });
      await fetchOrders(currentUser);
      notify("Order status updated", label);
    } catch (error) { notify("Could not update order", error.message); }
  };

  const cancelOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`, {});
      await fetchOrders(currentUser);
      notify("Order cancelled", "Reserved stock was returned to the catalogue");
    } catch (error) {
      notify("Could not cancel order", error.message);
    }
  };

  const addProduct = async (productData) => {
    const nextAvailableDate = () => {
      const days = (currentUser.operatingDays || []).map((day) => day.toLowerCase());
      const date = new Date();
      date.setDate(date.getDate() + 1);
      for (let index = 0; index < 14; index += 1) {
        if (!days.length || days.includes(date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase())) return date.toISOString();
        date.setDate(date.getDate() + 1);
      }
      return date.toISOString();
    };
    const marketId = productData.market || productData.marketId || marketsList[0]?._id || marketsList[0]?.id;
    if (!marketId) throw new Error("Choose an active market before publishing a product.");
    const response = await api.post("/products", {
      market: marketId,
      name: productData.name,
      description: productData.description,
      category: String(productData.category || "vegetables").toLowerCase(),
      unit: productData.unit,
      price: Number(productData.price),
      quantity: Number(productData.stock ?? productData.quantity),
      availableDate: productData.availableDate || nextAvailableDate(),
      isAvailable: productData.isAvailable !== false,
    });
    let savedProduct = response.data.product;
    if (productData.imageFile) {
      try {
        const formData = new FormData();
        formData.append("image", productData.imageFile);
        const uploadResponse = await api.upload(`/products/${entityId(savedProduct)}/image`, formData);
        savedProduct = uploadResponse.data.product;
      } catch (error) {
        notify("Product published without its image", error.message);
      }
    }
    await Promise.all([fetchCatalog(currentUser), fetchFarmerProducts(currentUser)]);
    notify("Product added to catalogue!", "The backend now owns this listing");
    return normalizeProduct(savedProduct);
  };

  const updateProduct = async (id, productData) => {
    const { imageFile, removeImage, ...details } = productData;
    let response = await api.patch(`/products/${id}`, details);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        response = await api.upload(`/products/${id}/image`, formData);
      } else if (removeImage) {
        response = await api.delete(`/products/${id}/image`);
      }
    } catch (error) {
      notify("Product details saved, but the image was not updated", error.message);
    }
    const updated = normalizeProduct(response.data.product);
    setFarmerProducts((current) => current.map((item) => entityId(item) === id ? updated : item));
    await Promise.all([fetchFarmerProducts(currentUser), fetchCatalog(currentUser)]);
    notify("Product updated", `${updated.name} was saved successfully`);
    return updated;
  };

  const updateProductStock = async (id, newStock) => {
    try {
      await api.patch(`/products/${id}`, { quantity: Math.max(0, Number(newStock)) });
      await fetchFarmerProducts(currentUser);
      notify("Stock updated", `Product inventory updated to ${newStock}`);
    } catch (error) { notify("Could not update stock", error.message); }
  };

  const deleteProduct = async (id) => {
    try { await api.delete(`/products/${id}`); await fetchFarmerProducts(currentUser); notify("Product archived", "Order history remains intact"); }
    catch (error) { notify("Could not remove product", error.message); }
  };

  const adminListFarmers = async () => {
    const response = await api.get("/admin/farmers");
    return (response.data?.farmers || []).map(normalizeFarmer);
  };

  const adminUpdateFarmer = async (id, updates) => {
    const response = await api.patch(`/admin/farmers/${id}`, updates);
    await fetchCatalog(currentUser);
    return normalizeFarmer(response.data.farmer);
  };

  const adminUpdateFarmerStatus = async (id, status) => {
    const response = await api.patch(`/admin/farmers/${id}/status`, { status });
    await fetchCatalog(currentUser);
    return normalizeFarmer(response.data.farmer);
  };

  const adminCreateMarket = async (market) => {
    const response = await api.post("/admin/markets", market);
    const created = normalizeMarket(response.data.market);
    setMarketsList((current) => [created, ...current]);
    return created;
  };

  const adminUpdateMarket = async (id, market) => {
    const response = await api.patch(`/admin/markets/${id}`, market);
    const existing = marketsList.find((item) => item.id === id);
    const updated = { ...normalizeMarket(response.data.market), farmers: existing?.farmers || 0, productsCount: existing?.productsCount || 0, rating: existing?.rating || 0, reviewsCount: existing?.reviewsCount || 0 };
    setMarketsList((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const adminUploadMarketImage = async (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.upload(`/admin/markets/${id}/image`, formData);
    const existing = marketsList.find((item) => item.id === id);
    const updated = { ...normalizeMarket(response.data.market), farmers: existing?.farmers || 0, productsCount: existing?.productsCount || 0, rating: existing?.rating || 0, reviewsCount: existing?.reviewsCount || 0 };
    setMarketsList((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const adminRemoveMarketImage = async (id) => {
    const response = await api.delete(`/admin/markets/${id}/image`);
    const existing = marketsList.find((item) => item.id === id);
    const updated = { ...normalizeMarket(response.data.market), farmers: existing?.farmers || 0, productsCount: existing?.productsCount || 0, rating: existing?.rating || 0, reviewsCount: existing?.reviewsCount || 0 };
    setMarketsList((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const adminDeleteMarket = async (id) => {
    await api.delete(`/admin/markets/${id}`);
    setMarketsList((current) => current.filter((item) => item.id !== id));
  };

  const getProductReviews = async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`);
    const loaded = (response.data?.reviews || []).map(normalizeReview);
    setReviews((current) => [...loaded, ...current.filter((review) => String(review.productId) !== String(productId))]);
    return loaded;
  };

  const getFarmerReviews = async (farmerId) => {
    const response = await api.get(`/reviews/farmer/${farmerId}`);
    return (response.data?.reviews || []).map(normalizeReview);
  };

  const addReview = async ({ productId, rating, comment }) => {
    const response = await api.post("/reviews", { product: productId, rating: Number(rating), comment });
    const review = normalizeReview(response.data.review);
    setReviews((previous) => [review, ...previous.filter((item) => item.id !== review.id)]);
    notify("Review submitted", "Thanks for supporting local farmers");
    return review;
  };

  const respondToReview = async (reviewId, responseText) => {
    const response = await api.patch(`/reviews/${reviewId}/response`, { response: responseText });
    return normalizeReview(response.data.review);
  };

  const modifyOrder = async (orderId, updates) => {
    const response = await api.patch(`/orders/${orderId}`, updates);
    await fetchOrders(currentUser);
    notify("Order updated", "Your pending pickup details were changed");
    return normalizeOrder(response.data.order);
  };

  const updateProfile = async (updates) => {
    const response = await api.patch("/auth/me", updates);
    saveSession(getToken(), response.data.user);
    setCurrentUserState(response.data.user);
    await fetchCatalog(response.data.user);
    notify("Profile updated", "Your account details were saved");
    return response.data.user;
  };

  const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.upload("/auth/me/image", formData);
    saveSession(getToken(), response.data.user);
    setCurrentUserState(response.data.user);
    await fetchCatalog(response.data.user);
    notify("Profile image uploaded", "Your new farmer photo is now visible");
    return response.data.user;
  };

  const removeProfileImage = async () => {
    const response = await api.delete("/auth/me/image");
    saveSession(getToken(), response.data.user);
    setCurrentUserState(response.data.user);
    await fetchCatalog(response.data.user);
    notify("Profile image removed");
    return response.data.user;
  };

  const adminListCustomers = async (query = "") => {
    const response = await api.get(`/admin/customers${query ? `?search=${encodeURIComponent(query)}` : ""}`);
    return response.data?.customers || [];
  };

  const adminCreateCustomer = async (customer) => {
    const response = await api.post("/admin/customers", customer);
    return response.data.customer;
  };

  const adminUpdateCustomer = async (id, customer) => {
    const response = await api.patch(`/admin/customers/${id}`, customer);
    return response.data.customer;
  };

  const adminDeleteCustomer = async (id) => {
    await api.delete(`/admin/customers/${id}`);
  };

  const adminUpdateCustomerStatus = async (id, status) => {
    const response = await api.patch(`/admin/customers/${id}/status`, { status });
    return response.data.customer;
  };

  const adminGetReport = async () => {
    const response = await api.get("/admin/reports");
    return response.data.report;
  };

  const adminListProducts = async () => ((await api.get("/admin/products")).data?.products || []).map(normalizeProduct);
  const adminUpdateProductStatus = async (id, isAvailable) => normalizeProduct((await api.patch(`/admin/products/${id}/status`, { isAvailable })).data.product);
  const adminListReviews = async () => ((await api.get("/admin/reviews")).data?.reviews || []).map(normalizeReview);
  const adminListCategories = async () => ((await api.get("/admin/categories")).data?.categories || []).map((category) => ({ ...category, id: category._id || category.id }));
  const adminCreateCategory = async (category) => (await api.post("/admin/categories", category)).data.category;
  const adminUpdateCategory = async (id, category) => (await api.patch(`/admin/categories/${id}`, category)).data.category;
  const adminArchiveCategory = async (id) => (await api.delete(`/admin/categories/${id}`)).data.category;
  const adminBroadcastNotification = async (notification) => api.post("/admin/notifications/broadcast", notification);

  const adminRemoveReview = async (id) => {
    await api.delete(`/admin/reviews/${id}`);
    setReviews((current) => current.filter((review) => review.id !== id));
  };

  const markNotificationRead = async (id) => {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((current) => current.map((item) => (item._id === id ? { ...item, read: true } : item)));
    setUnreadNotifications((count) => Math.max(0, count - 1));
  };

  const markAllNotificationsRead = async () => {
    await api.patch("/notifications/read-all", {});
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadNotifications(0);
  };

  const setRestockAlert = async (productId, enabled) => {
    await api.patch(`/favorites/product/${productId}/restock-alert`, { enabled });
    setFavorites((current) => current.map((product) => entityId(product) === productId ? { ...product, restockAlert: enabled } : product));
    notify(enabled ? "Restock alert enabled" : "Restock alert disabled");
  };

  const adminListAnnouncements = async () => (await api.get("/announcements/admin")).data?.announcements || [];
  const adminCreateAnnouncement = async (announcement) => (await api.post("/announcements", announcement)).data.announcement;
  const adminUpdateAnnouncement = async (id, announcement) => (await api.patch(`/announcements/${id}`, announcement)).data.announcement;
  const getWeeklyStock = useCallback(async () => (await api.get("/weekly-stock")).data?.templates || [], []);
  const saveWeeklyStock = useCallback(async (template, id) => id ? (await api.patch(`/weekly-stock/${id}`, template)).data.template : (await api.post("/weekly-stock", template)).data.template, []);
  const applyWeeklyStock = useCallback(async (id, date) => {
    await api.post(`/weekly-stock/${id}/apply`, { date });
    await Promise.all([fetchCatalog(currentUser), fetchFarmerProducts(currentUser)]);
  }, [currentUser, fetchCatalog, fetchFarmerProducts]);
  const deleteWeeklyStock = useCallback(async (id) => api.delete(`/weekly-stock/${id}`), []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const value = useMemo(() => ({
    products: productsList, farmerProducts, farmers: farmersList, markets: marketsList, categories: categoriesList, platformStats, cart, favorites, favoriteFarmers, orders, reviews, notifications, unreadNotifications, announcements,
    cartCount, subtotal, toast, currentUser, isLoading,
    setCurrentUser, login, register, logout, refreshCatalog: fetchCatalog, refreshFarmerProducts: fetchFarmerProducts, refreshOrders: fetchOrders,
    addToCart, updateQuantity, removeFromCart, clearCart, reorder, toggleFavorite, toggleFavoriteFarmer, placeOrder,
    updateOrderStatus, cancelOrder, modifyOrder, addProduct, updateProduct, updateProductStock, deleteProduct, addReview,
    getProductReviews, getFarmerReviews, respondToReview, updateProfile, uploadProfileImage, removeProfileImage,
    adminListFarmers, adminUpdateFarmer, adminUpdateFarmerStatus, adminCreateMarket, adminUpdateMarket, adminUploadMarketImage, adminRemoveMarketImage, adminDeleteMarket,
    adminListCustomers, adminCreateCustomer, adminUpdateCustomer, adminDeleteCustomer, adminUpdateCustomerStatus, adminGetReport, adminRemoveReview,
    adminListProducts, adminUpdateProductStatus, adminListReviews, adminListCategories, adminCreateCategory, adminUpdateCategory, adminArchiveCategory, adminBroadcastNotification,
    fetchNotifications, markNotificationRead, markAllNotificationsRead, setRestockAlert,
    adminListAnnouncements, adminCreateAnnouncement, adminUpdateAnnouncement, getWeeklyStock, saveWeeklyStock, applyWeeklyStock, deleteWeeklyStock, notify,
  }), [productsList, farmerProducts, farmersList, marketsList, categoriesList, platformStats, cart, favorites, favoriteFarmers, orders, reviews, notifications, unreadNotifications, announcements, cartCount, subtotal, toast, currentUser, isLoading, setCurrentUser, login, register, logout, fetchCatalog, fetchFarmerProducts, fetchOrders, fetchFavorites, authenticate, getWeeklyStock, saveWeeklyStock, applyWeeklyStock, deleteWeeklyStock, notify]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
