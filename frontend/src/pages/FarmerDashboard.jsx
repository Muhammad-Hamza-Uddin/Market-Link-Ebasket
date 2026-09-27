import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  Box,
  ClipboardList,
  DollarSign,
  Plus,
  Star,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Store,
  Trash2,
  Edit3,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  CalendarDays,
  Phone,
  Ticket,
  Hand,
  Upload
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import ProductForm from "../components/ProductForm";
import { Badge, Modal } from "../components/ui";
import { useStore } from "../context/StoreContext";
import { resolveMediaUrl } from "../api/client";

export default function FarmerDashboard() {
  const [searchParams] = useSearchParams();
  const {
    farmerProducts: products,
    markets,
    orders,
    addProduct,
    updateProduct,
    updateProductStock,
    deleteProduct,
    updateOrderStatus,
    currentUser,
    updateProfile,
    uploadProfileImage,
    removeProfileImage,
    getFarmerReviews,
    respondToReview,
    refreshFarmerProducts,
    notify,
  } = useStore();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "add-product" ? "add-product" : "dashboard"); // dashboard, products, add-product, orders, reviews, analytics, profile
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Profile edit state
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [marketLocation, setMarketLocation] = useState("");
  const [daysSchedule, setDaysSchedule] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("08:00");
  const [pickupEndTime, setPickupEndTime] = useState("14:00");
  const [pickupSlotMinutes, setPickupSlotMinutes] = useState(60);
  const [orderCutoffTime, setOrderCutoffTime] = useState("18:00");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [farmerReviews, setFarmerReviews] = useState([]);
  const [responseDrafts, setResponseDrafts] = useState({});

  useEffect(() => {
    const farmerId = currentUser.id || currentUser._id;
    if (farmerId) getFarmerReviews(farmerId).then(setFarmerReviews).catch((error) => notify("Could not load reviews", error.message));
    setFarmName(currentUser.farmName || currentUser.name || "");
    setOwnerName(currentUser.name || "");
    setProfileImage(currentUser.imageUrl || "");
    setMarketLocation(currentUser.location || "");
    const days = (currentUser.operatingDays || []).join(", ");
    setDaysSchedule(days);
    setPickupStartTime(currentUser.pickupStartTime || "08:00");
    setPickupEndTime(currentUser.pickupEndTime || "14:00");
    setPickupSlotMinutes(Number(currentUser.pickupSlotMinutes || 60));
    setOrderCutoffTime(currentUser.orderCutoffTime || "18:00");
    setLatitude(currentUser.coordinates?.latitude ?? "");
    setLongitude(currentUser.coordinates?.longitude ?? "");
  }, [currentUser.id, currentUser._id]);

  useEffect(() => {
    refreshFarmerProducts().catch((error) => notify("Could not load your products", error.message));
  }, [refreshFarmerProducts, notify]);

  const farmerOrders = orders;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === "Placed" || o.status === "Accepted").length;
  const totalRevenue = orders.filter((o) => o.status === "Completed").reduce((sum, o) => sum + Number(o.total || 0), 0);
  const soldByName = orders.flatMap((order) => order.items || []).reduce((result, item) => ({ ...result, [item.name]: (result[item.name] || 0) + Number(item.quantity || 0) }), {});
  const bestSellingProduct = Object.entries(soldByName).sort((a, b) => b[1] - a[1])[0] || ["No sales yet", 0];
  const weeklyOrderVolume = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const count = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return !Number.isNaN(created.getTime()) && created.toDateString() === date.toDateString();
    }).length;
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), count };
  });
  const weeklyMax = Math.max(1, ...weeklyOrderVolume.map((item) => item.count));

  const handleCreateProduct = async (payload) => {
    await addProduct(payload);
    setAddSuccess(true);
    setTimeout(() => { setAddSuccess(false); setActiveTab("products"); }, 900);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const operatingDays = daysSchedule.split(",").map((day) => day.trim().toLowerCase()).filter(Boolean);
      const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      if (!operatingDays.length || operatingDays.some((day) => !validDays.includes(day))) throw new Error("Enter valid comma-separated weekdays.");
      if (pickupStartTime >= pickupEndTime) throw new Error("Pickup end time must be after the start time.");
      await updateProfile({
        name: ownerName,
        farmName,
        location: marketLocation,
        operatingDays,
        pickupStartTime,
        pickupEndTime,
        pickupSlotMinutes: Number(pickupSlotMinutes),
        orderCutoffTime,
        coordinates: latitude !== "" && longitude !== "" ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (error) { notify("Could not save profile", error.message); }
  };

  const toggleProductAvailability = async (product) => {
    try {
      await updateProduct(product.id, { isAvailable: !product.isAvailable });
      notify(
        product.isAvailable ? "Product marked unavailable" : "Product is available again",
        product.isAvailable ? `${product.name} is hidden from customers.` : `${product.name} is live in the marketplace.`
      );
    } catch (error) {
      notify("Could not update availability", error.message, "error");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return notify("Image is too large", "Choose an image smaller than 3 MB");
    try {
      setImageUploading(true);
      const user = await uploadProfileImage(file);
      setProfileImage(user.imageUrl || "");
    } catch (error) {
      notify("Could not upload image", error.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = async () => {
    try {
      setImageUploading(true);
      const user = await removeProfileImage();
      setProfileImage(user.imageUrl || "");
    } catch (error) {
      notify("Could not remove image", error.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRespond = async (reviewId) => {
    try {
      const updated = await respondToReview(reviewId, responseDrafts[reviewId] || "");
      setFarmerReviews((current) => current.map((review) => review.id === updated.id ? updated : review));
      setResponseDrafts((current) => ({ ...current, [reviewId]: "" }));
      notify("Response saved", "Your reply is visible to the customer");
    } catch (error) { notify("Could not save response", error.message); }
  };

  return (
    <AnimatedPage>
      <section className="dashboard-section">
        <div className="container dashboard-container">
          {/* SIDEBAR NAVIGATION */}
          <aside className="farmer-sidebar">
            <div className="farmer-profile-summary">
              <div className={`farmer-avatar-badge ${profileImage ? "has-photo" : ""}`}>
                {profileImage ? <img src={resolveMediaUrl(profileImage)} alt={`${farmName} profile`} onError={() => setProfileImage("")} /> : <User size={21} aria-hidden="true" />}
              </div>
              <div className="farmer-title-box">
                <strong>{farmName}</strong>
                <span className="stall-location-text"><MapPin size={14} /> {marketLocation}</span>
                <span className="role-chip">Verified Farm Producer</span>
              </div>
            </div>

            <button type="button" className="mobile-dashboard-menu-toggle" onClick={() => setMobileNavOpen((open) => !open)} aria-expanded={mobileNavOpen}>
              <span><BarChart3 size={17} /> Dashboard menu</span><ChevronRight size={17} className={mobileNavOpen ? "rotate-90" : ""} />
            </button>
            <nav className={`farmer-nav-menu ${mobileNavOpen ? "mobile-open" : ""}`}>
              <button
                className={`farmer-nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </button>
              <Link className="farmer-nav-link" to="/farmer/weekly-stock">
                <CalendarDays size={18} />
                <span>Weekly Stock</span>
              </Link>

              <button
                className={`farmer-nav-link ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                <Box size={18} />
                <span>My Products</span>
                <span className="nav-counter">{products.length}</span>
              </button>

              <button
                className={`farmer-nav-link ${activeTab === "add-product" ? "active" : ""}`}
                onClick={() => setActiveTab("add-product")}
              >
                <Plus size={18} />
                <span>Add Product</span>
              </button>

              <button
                className={`farmer-nav-link ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                <ClipboardList size={18} />
                <span>Orders Queue</span>
                {pendingOrdersCount > 0 && <span className="nav-alert-dot">{pendingOrdersCount}</span>}
              </button>

              <button
                className={`farmer-nav-link ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                <Star size={18} />
                <span>Customer Reviews</span>
              </button>

              <button
                className={`farmer-nav-link ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                <TrendingUp size={18} />
                <span>Analytics</span>
              </button>

              <button
                className={`farmer-nav-link ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <Store size={18} />
                <span>Stall Profile</span>
              </button>
            </nav>

            <div className="sidebar-quick-card">
              <span className="quick-label">Market Day Notice</span>
              <p>{currentUser.operatingDays?.length ? `${currentUser.operatingDays.join(", ")} · ${currentUser.pickupStartTime || "time not set"}–${currentUser.pickupEndTime || "time not set"} at ${marketLocation || "your configured stall"}.` : "Add operating days and pickup hours in your stall profile."}</p>
              <Link to="/markets" className="link-green-small">
                View Market Schedule ➔
              </Link>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="farmer-main-content">
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Farmer Portal Overview</span>
                    <h1 className="dash-title">Welcome Back, {ownerName.split(" ")[0]} <Hand size={25} aria-hidden="true" /></h1>
                    <p className="dash-subtitle">Here is your weekly harvest pre-orders and inventory status.</p>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveTab("add-product")}>
                    <Plus size={16} /> Add New Harvest
                  </button>
                </div>

                {/* SRS Specifically Required 4 Metrics */}
                <div className="metrics-cards-grid">
                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-blue">
                      <ClipboardList size={20} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-label">Total Orders</span>
                      <strong className="metric-value">{totalOrdersCount}</strong>
                      <span className="metric-trend">All recorded orders</span>
                    </div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-amber">
                      <Clock size={20} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-label">Pending Orders</span>
                      <strong className="metric-value">{pendingOrdersCount}</strong>
                      <span className="metric-trend trend-pending">Requires preparation</span>
                    </div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-green">
                      <DollarSign size={20} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-label">Estimated Revenue</span>
                      <strong className="metric-value">Rs. {(totalRevenue / 1000).toFixed(1)}k</strong>
                      <span className="metric-trend">Completed orders only</span>
                    </div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-purple">
                      <TrendingUp size={20} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-label">Best Selling Product</span>
                      <strong className="metric-value">{bestSellingProduct[0]}</strong>
                      <span className="metric-trend">{bestSellingProduct[1]} units pre-ordered</span>
                    </div>
                  </div>
                </div>

                {/* Charts & Weekly Stock Grid */}
                <div className="dash-panels-two-col">
                  {/* Weekly Orders Trend Bar Chart */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div>
                        <h3>Weekly Pre-Order Volume</h3>
                        <small>Customer reservations by day</small>
                      </div>
                      <span className="badge-soft-green">Last 7 days</span>
                    </div>

                    <div className="weekly-bar-chart">
                      {weeklyOrderVolume.map((item, i) => (
                        <div key={i} className="bar-column">
                          <span className="bar-val-pop">{item.count}</span>
                          <div className="bar-track">
                            <motion.div
                              className="bar-fill"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(item.count ? 8 : 0, Math.round((item.count / weeklyMax) * 100))}%` }}
                              transition={{ duration: 0.6, delay: i * 0.08 }}
                            />
                          </div>
                          <span className="bar-day-label">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Inventory Stock Levels */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div>
                        <h3>Active Harvest Inventory</h3>
                        <small>Directly synchronized with customer basket</small>
                      </div>
                      <button className="link-btn-small" onClick={() => setActiveTab("products")}>
                        Manage All
                      </button>
                    </div>

                    <div className="dash-stock-list">
                      {products.slice(0, 5).map((p) => (
                        <div className="dash-stock-item" key={p.id}>
                          <img src={p.image} alt={p.name} />
                          <div className="stock-info">
                            <strong>{p.name}</strong>
                            <small>Rs. {p.price} / {p.unit}</small>
                          </div>
                          <div className="stock-level-pill">
                            <strong>{p.stock} {p.unit}</strong>
                            <span className={p.stock > 5 ? "tag-in-stock" : "tag-low-stock"}>
                              {p.stock > 5 ? "In Stock" : "Low Stock"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MY PRODUCTS TAB */}
            {activeTab === "products" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Inventory Management</span>
                    <h1 className="dash-title">My Harvest Catalog ({products.length})</h1>
                    <p className="dash-subtitle">Update available quantities, inspect customer pricing, or remove sold-out lots.</p>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveTab("add-product")}>
                    <Plus size={16} /> Add Product
                  </button>
                </div>

                {!products.length ? (
                  <div className="dash-card empty-state-card">
                    <Package size={36} />
                    <h2>No products yet</h2>
                    <p>Add your first product to start selling.</p>
                    <button className="btn-primary" type="button" onClick={() => setActiveTab("add-product")}><Plus size={16} /> Add Product</button>
                  </div>
                ) : <div className="dash-table-card responsive-table-wrap">
                  <table className="inventory-table farmer-products-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Unit Price</th>
                        <th>Available Stock</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id}>
                          <td className="table-prod-cell" data-label="Product">
                            <img src={prod.image} alt={prod.name} />
                            <div>
                              <strong>{prod.name}</strong>
                              <small>{prod.harvestTime || "Harvested Today"}</small>
                            </div>
                          </td>
                          <td data-label="Category">
                            <Badge>{prod.category}</Badge>
                          </td>
                          <td data-label="Unit price">
                            <strong>Rs. {prod.price}</strong>
                            <small> /{prod.unit}</small>
                          </td>
                          <td data-label="Stock">
                            <div className="stock-adjuster">
                              <button
                                onClick={() => updateProductStock(prod.id, prod.stock - 1)}
                                disabled={prod.stock <= 0}
                              >
                                -
                              </button>
                              <span>{prod.stock} {prod.unit}</span>
                              <button onClick={() => updateProductStock(prod.id, prod.stock + 1)}>
                                +
                              </button>
                            </div>
                          </td>
                          <td data-label="Rating">
                            {prod.reviewsCount ? <div className="rating-mini"><Star size={13} fill="#f59e0b" color="#f59e0b" /><span>{prod.rating.toFixed(1)} ({prod.reviewsCount})</span></div> : <span className="muted-text">No ratings yet</span>}
                          </td>
                          <td data-label="Actions">
                            <div className="table-action-group">
                              <button className={`btn-compact product-availability-toggle ${prod.isAvailable ? "available" : "unavailable"}`} type="button" onClick={() => toggleProductAvailability(prod)}>
                                {prod.isAvailable ? <><EyeOff size={15} /> Mark unavailable</> : <><Eye size={15} /> Make available</>}
                              </button>
                              <button className="btn-outline btn-compact" type="button" onClick={() => setEditingProduct(prod)}><Edit3 size={15} /> Edit</button>
                              <button
                                className="btn-trash-icon"
                                onClick={() => {
                                  if (window.confirm("Archive this product? Existing order history will remain intact.")) deleteProduct(prod.id);
                                }}
                                title="Archive product"
                                aria-label={`Archive ${prod.name}`}
                              ><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
              </div>
            )}

            {/* 3. ADD PRODUCT TAB */}
            {activeTab === "add-product" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Catalogue Creation</span>
                    <h1 className="dash-title">Add New Harvest Product</h1>
                    <p className="dash-subtitle">List your produce for upcoming market days so customers can pre-order.</p>
                  </div>
                </div>

                <div className="dash-card form-max-width">
                  {addSuccess && (
                    <div className="success-banner">
                      <CheckCircle2 size={18} />
                      <span>Product added successfully! Visible to customer baskets now.</span>
                    </div>
                  )}

                  <ProductForm mode="create" markets={markets} onSubmit={handleCreateProduct} />
                </div>
              </div>
            )}

            {/* 4. ORDERS QUEUE TAB */}
            {activeTab === "orders" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Customer Reservations</span>
                    <h1 className="dash-title">Incoming Market Pre-Orders ({farmerOrders.length})</h1>
                    <p className="dash-subtitle">Update order status as you pack harvests and prepare stalls.</p>
                  </div>
                </div>

                <div className="dash-orders-queue">
                  {farmerOrders.map((ord) => (
                    <div className="farmer-order-card" key={ord.id}>
                      <div className="f-order-head">
                        <div>
                          <span className="f-order-num">Order #{ord.id}</span>
                          <strong className="f-customer-name">{ord.customerName}</strong>
                          <small className="f-phone"><Phone size={13} /> {ord.phone}</small>
                        </div>
                        <div className="f-order-total-block">
                          <span className="f-total-amt">Rs. {ord.total}</span>
                          <span className={`f-status-pill status-${ord.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      <div className="f-order-body">
                        <div className="f-items-tags">
                          {ord.items.map((it, idx) => (
                            <span key={idx} className="f-item-tag">
                              {it.quantity}× {it.name}
                            </span>
                          ))}
                        </div>

                        <div className="f-pickup-meta">
                          <span><MapPin size={13} /> Market: {ord.market}</span>
                          <span><Clock size={13} /> Slot: {ord.pickupSlot}</span>
                          <span><Ticket size={13} /> Token: <strong>{ord.pickupToken}</strong></span>
                        </div>
                      </div>

                      {/* Live Status Controls for Farmer */}
                      <div className="f-order-actions-bar">
                        <span className="actions-label">Advance Order Status:</span>
                        <div className="status-button-row">
                          {ord.status === "Placed" && <><button className="btn-state" onClick={() => updateOrderStatus(ord.id, "Accepted")}>Accept Order</button><button className="btn-state" onClick={() => updateOrderStatus(ord.id, "Cancelled")}>Decline</button></>}
                          {ord.status === "Accepted" && <><button className="btn-state" onClick={() => updateOrderStatus(ord.id, "Ready for Pickup")}>Ready for Pickup</button><button className="btn-state" onClick={() => updateOrderStatus(ord.id, "Cancelled")}>Cancel Order</button></>}
                          {ord.status === "Ready for Pickup" && <button className="btn-state" onClick={() => updateOrderStatus(ord.id, "Completed")}>Mark Completed</button>}
                          {["Completed", "Cancelled"].includes(ord.status) && <span className="muted-text">No further status changes are allowed.</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!farmerOrders.length && <div className="dash-card empty-state-card"><ClipboardList size={34} /><h2>No orders yet</h2><p>New customer pre-orders will appear here.</p></div>}
                </div>
              </div>
            )}

            {/* 5. REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Customer Ratings</span>
                    <h1 className="dash-title">Customer Feedback & Reviews</h1>
                    <p className="dash-subtitle">Ratings submitted by verified community market shoppers.</p>
                  </div>
                </div>

                <div className="reviews-cards-grid">
                  {farmerReviews.map((rev) => (
                    <div className="customer-review-card" key={rev.id}>
                      <div className="rev-head">
                        <div className="rev-author-info">
                          <div className="author-avatar">{rev.author.charAt(0)}</div>
                          <div>
                            <strong>{rev.author}</strong>
                            <span className="rev-date">{rev.date}</span>
                          </div>
                        </div>
                        <div className="rev-stars">{"★".repeat(Math.round(rev.rating))}</div>
                      </div>
                      <p className="rev-body">"{rev.comment}"</p>
                      <span className="verified-badge"><ShieldCheck size={13} /> Verified Local Customer</span>
                      {rev.response && <p className="rev-body"><strong>Your response:</strong> {rev.response}</p>}
                      {!rev.response && <div className="review-response-row"><input value={responseDrafts[rev.id] || ""} onChange={(event) => setResponseDrafts((current) => ({ ...current, [rev.id]: event.target.value }))} placeholder="Reply to this customer" /><button className="link-btn-small" onClick={() => handleRespond(rev.id)}>Reply</button></div>}
                    </div>
                  ))}
                  {farmerReviews.length === 0 && <div className="dash-card"><p>No customer reviews have been submitted yet.</p></div>}
                </div>
              </div>
            )}

            {/* 6. ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Sales & Demand Metrics</span>
                    <h1 className="dash-title">Weekly Farm Analytics</h1>
                    <p className="dash-subtitle">Customer pickup completion rates and seasonal demand insights.</p>
                  </div>
                </div>

                <div className="analytics-metrics-grid">
                  <div className="dash-card">
                    <h3>Pickup Fulfillment Rate</h3>
                    <div className="fulfillment-circle-stat">
                      <strong>{orders.filter((order) => order.status !== "Cancelled").length ? `${Math.round((orders.filter((order) => order.status === "Completed").length / orders.filter((order) => order.status !== "Cancelled").length) * 100)}%` : "No data"}</strong>
                      <p>Completed orders as a share of non-cancelled orders</p>
                    </div>
                  </div>

                  <div className="dash-card">
                    <h3>Top Selling Categories</h3>
                    <div className="category-bars">
                      {Object.entries(products.reduce((totals, product) => ({ ...totals, [product.category]: (totals[product.category] || 0) + Number(product.stock || 0) }), {})).map(([category, quantity]) => {
                        const total = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
                        const percent = total ? Math.round((quantity / total) * 100) : 0;
                        return <div className="cat-bar-item" key={category}><div className="cat-bar-label"><span>{category}</span><strong>{percent}%</strong></div><div className="cat-track"><div className="cat-fill" style={{ width: `${percent}%` }}/></div></div>;
                      })}
                      {!products.length && <p>No inventory data yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PROFILE TAB */}
            {activeTab === "profile" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Stall Settings</span>
                    <h1 className="dash-title">Farmer Stall Profile</h1>
                    <p className="dash-subtitle">This information is shown to customers on the Market and Farmers pages.</p>
                  </div>
                </div>

                <div className="dash-card form-max-width">
                  {profileSaved && (
                    <div className="success-banner">
                      <CheckCircle2 size={18} />
                      <span>Stall settings saved successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="profile-edit-form">
                    <div className="farmer-image-editor">
                      <div className={`farmer-image-preview ${profileImage ? "has-photo" : ""}`}>
                        {profileImage ? <img src={resolveMediaUrl(profileImage)} alt="Farmer profile preview" onError={() => setProfileImage("")} /> : <><User size={34} aria-hidden="true" /><span>No profile photo added</span></>}
                      </div>
                      <div className="form-field-group farmer-image-upload-field">
                        <label htmlFor="farmer-profile-image"><Upload size={15} /> Upload profile image</label>
                        <input
                          id="farmer-profile-image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                        <small>JPG, PNG, or WebP. Maximum file size: 3 MB.</small>
                        {imageUploading && <span className="image-upload-status" role="status">Uploading image…</span>}
                        {profileImage && !imageUploading && <button className="btn-text-danger remove-profile-image" type="button" onClick={handleImageRemove}><Trash2 size={14} /> Remove image</button>}
                      </div>
                    </div>
                    <div className="form-two-cols">
                      <div className="form-field-group">
                        <label>Farm / Stall Name</label>
                        <input
                          type="text"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label>Owner / Grower Name</label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-two-cols">
                      <div className="form-field-group">
                        <label>Assigned Community Market</label>
                        <input
                          type="text"
                          value={marketLocation}
                          onChange={(e) => setMarketLocation(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label>Order cutoff time</label>
                        <input
                          type="time"
                          value={orderCutoffTime}
                          onChange={(e) => setOrderCutoffTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-two-cols">
                      <div className="form-field-group"><label>Latitude</label><input type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></div>
                      <div className="form-field-group"><label>Longitude</label><input type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></div>
                    </div>

                    <div className="form-field-group">
                      <label>Operating days</label>
                      <input
                        type="text"
                        value={daysSchedule}
                        onChange={(e) => setDaysSchedule(e.target.value)}
                        placeholder="saturday, sunday"
                        required
                      />
                      <small>Comma-separated weekdays, for example: friday, saturday</small>
                    </div>
                    <div className="form-three-cols">
                      <div className="form-field-group"><label>Pickup start</label><input type="time" value={pickupStartTime} onChange={(e) => setPickupStartTime(e.target.value)} required /></div>
                      <div className="form-field-group"><label>Pickup end</label><input type="time" value={pickupEndTime} onChange={(e) => setPickupEndTime(e.target.value)} required /></div>
                      <div className="form-field-group"><label>Slot length (minutes)</label><input type="number" min="15" max="240" step="15" value={pickupSlotMinutes} onChange={(e) => setPickupSlotMinutes(e.target.value)} required /></div>
                    </div>

                    <button type="submit" className="btn-primary">
                      Save Profile Changes
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
      <Modal open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} eyebrow="Inventory Management" title="Edit product" className="product-edit-modal">
        {editingProduct && (
              <ProductForm
                mode="edit"
                product={editingProduct}
                markets={markets}
                onCancel={() => setEditingProduct(null)}
                onSubmit={async (payload) => {
                  await updateProduct(editingProduct.id, payload);
                  setEditingProduct(null);
                }}
              />
        )}
      </Modal>
    </AnimatedPage>
  );
}
