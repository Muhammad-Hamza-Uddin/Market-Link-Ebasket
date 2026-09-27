import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Users,
  Store,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  X,
  AlertTriangle,
  LocateFixed,
  ChevronRight,
  Megaphone,
  Upload,
  PackageSearch,
  Tags,
  Search,
  Boxes,
  Eye,
  EyeOff,
  FileDown
} from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { Badge } from "../components/ui";
import { useStore } from "../context/StoreContext";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=900&q=80";

const emptyFarmerForm = { name: "", owner: "", location: "", city: "Karachi", phone: "", email: "", rating: "0", productsCount: "0", badge: "Verified Local Producer" };
const emptyCustomerForm = { name: "", email: "", phone: "", area: "", preferredMarket: "", password: "" };
const emptyMarketForm = { name: "", area: "", address: "", timing: "", operatingDays: "", farmers: "0", landmark: "", latitude: "", longitude: "" };

const normalizeAdminCustomer = (customer) => ({
  ...customer,
  id: customer._id || customer.id,
  area: customer.address || customer.area || "Not provided",
  orders: Number(customer.ordersCount || customer.orders || 0),
  status: customer.accountStatus === "suspended" ? "Suspended" : "Active",
  preferredMarket: customer.preferredMarket?.name || customer.preferredMarket || "Not selected",
  preferredMarketId: customer.preferredMarket?._id || (typeof customer.preferredMarket === "string" ? customer.preferredMarket : ""),
  registrationDate: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB") : "—",
});

export default function AdminDashboard() {
  const { farmers, markets, orders, products, currentUser, refreshCatalog, adminListFarmers, adminUpdateFarmer, adminUpdateFarmerStatus, adminCreateMarket, adminUpdateMarket, adminUploadMarketImage, adminRemoveMarketImage, adminDeleteMarket, adminListCustomers, adminCreateCustomer, adminUpdateCustomer, adminDeleteCustomer, adminUpdateCustomerStatus, adminGetReport, adminRemoveReview, adminListProducts, adminUpdateProductStatus, adminListReviews, adminListCategories, adminCreateCategory, adminUpdateCategory, adminArchiveCategory, notify } = useStore();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, farmers, customers, markets, orders, moderation
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [farmerList, setFarmerList] = useState(farmers);
  const [customerList, setCustomerList] = useState([]);
  const [report, setReport] = useState(null);
  const [marketList, setMarketList] = useState(markets);
  const [reviewList, setReviewList] = useState([]);
  const [moderationProducts, setModerationProducts] = useState([]);
  const [moderationView, setModerationView] = useState("products");
  const [moderationSearch, setModerationSearch] = useState("");
  const [moderationStatus, setModerationStatus] = useState("all");
  const [categoryList, setCategoryList] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", icon: "basket", sortOrder: "0" });
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("all");

  useEffect(() => {
    setMarketList(markets);
  }, [markets]);

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    adminListFarmers().then(setFarmerList).catch((error) => notify("Could not load admin farmer list", error.message));
    adminListCustomers().then((customers) => setCustomerList(customers.map(normalizeAdminCustomer))).catch((error) => notify("Could not load customer list", error.message));
    adminGetReport().then(setReport).catch((error) => notify("Could not load platform report", error.message));
    adminListProducts().then(setModerationProducts).catch((error) => notify("Could not load product moderation", error.message));
    adminListReviews().then(setReviewList).catch((error) => notify("Could not load review moderation", error.message));
    adminListCategories().then(setCategoryList).catch((error) => notify("Could not load categories", error.message));
  }, [currentUser.role]);

  // Form visibility + edit-target state, one set per section
  const [farmerForm, setFarmerForm] = useState(null); // null = hidden, {...fields} = shown
  const [editingFarmerId, setEditingFarmerId] = useState(null);

  const [customerForm, setCustomerForm] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  const [marketForm, setMarketForm] = useState(null);
  const [editingMarketId, setEditingMarketId] = useState(null);
  const [marketImageFile, setMarketImageFile] = useState(null);
  const [marketImagePreview, setMarketImagePreview] = useState("");

  const totalRevenue = Number(report?.revenue ?? orders.reduce((sum, o) => sum + o.total, 0));
  const pendingOrdersCount = orders.filter((o) => o.status === "Placed" || o.status === "Accepted").length;
  const visibleCustomerList = customerList.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    const matchesQuery = !query || [customer.name, customer.email, customer.area, customer.preferredMarket].some((value) => String(value || "").toLowerCase().includes(query));
    return matchesQuery && (customerStatusFilter === "all" || customer.status.toLowerCase() === customerStatusFilter);
  });
  const visibleModerationProducts = moderationProducts.filter((product) => {
    const query = moderationSearch.trim().toLowerCase();
    const matchesSearch = !query || [product.name, product.farmer, product.market, product.category]
      .some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = moderationStatus === "all"
      || (moderationStatus === "live" && product.isAvailable)
      || (moderationStatus === "removed" && !product.isAvailable);
    return matchesSearch && matchesStatus;
  });

  /* ---------------- FARMERS ---------------- */
  const openEditFarmer = (f) => {
    setEditingFarmerId(f.id);
    setFarmerForm({
      name: f.name, owner: f.owner, location: f.location, city: f.city,
      phone: f.phone, email: f.email, rating: String(f.rating),
      productsCount: String(f.productsCount), badge: f.badge
    });
  };
  const closeFarmerForm = () => { setFarmerForm(null); setEditingFarmerId(null); };
  const saveFarmer = async (e) => {
    e.preventDefault();
    if (!editingFarmerId || !farmerForm.name || !farmerForm.owner || !farmerForm.location) return;
    try {
      const updated = await adminUpdateFarmer(editingFarmerId, { name: farmerForm.owner, farmName: farmerForm.name, location: farmerForm.location, phone: farmerForm.phone, email: farmerForm.email, address: farmerForm.location });
      setFarmerList((prev) => prev.map((farmer) => farmer.id === editingFarmerId ? updated : farmer));
      notify("Farmer details saved", "The database record was updated");
      closeFarmerForm();
    } catch (error) { notify("Could not update farmer", error.message); }
  };
  const changeFarmerStatus = async (farmer, status) => {
    try {
      const updated = await adminUpdateFarmerStatus(farmer.id, status);
      setFarmerList((prev) => prev.map((item) => item.id === farmer.id ? updated : item));
      notify("Farmer status updated", `${farmer.name} is now ${status}`);
    } catch (error) {
      notify("Could not update farmer status", error.message);
    }
  };

  /* ---------------- CUSTOMERS ---------------- */
  const openAddCustomer = () => { setEditingCustomerId(null); setCustomerForm(emptyCustomerForm); };
  const openEditCustomer = (c) => {
    setEditingCustomerId(c.id);
    setCustomerForm({ name: c.name, email: c.email, phone: c.phone || "", area: c.area === "Not provided" ? "" : c.area, preferredMarket: c.preferredMarketId || "", password: "" });
  };
  const closeCustomerForm = () => { setCustomerForm(null); setEditingCustomerId(null); };
  const saveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.email || (!editingCustomerId && !customerForm.password)) return;
    try {
      const payload = { name: customerForm.name, email: customerForm.email, phone: customerForm.phone, address: customerForm.area, preferredMarket: customerForm.preferredMarket || undefined };
      const saved = editingCustomerId
        ? await adminUpdateCustomer(editingCustomerId, payload)
        : await adminCreateCustomer({ ...payload, password: customerForm.password });
      const normalized = normalizeAdminCustomer(saved);
      setCustomerList((prev) => editingCustomerId ? prev.map((customer) => customer.id === editingCustomerId ? normalized : customer) : [normalized, ...prev]);
      notify("Customer saved", "The database record was updated successfully");
      closeCustomerForm();
    } catch (error) { notify("Could not save customer", error.message); }
  };
  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer account? Accounts with order history must be suspended instead.")) return;
    try {
      await adminDeleteCustomer(id);
      setCustomerList((prev) => prev.filter((customer) => customer.id !== id));
      notify("Customer deleted", "The account was removed from the database");
    } catch (error) { notify("Could not delete customer", error.message); }
  };

  /* ---------------- MARKETS ---------------- */
  const openAddMarket = () => { setEditingMarketId(null); setMarketForm({ ...emptyMarketForm, removeImage: false }); setMarketImageFile(null); setMarketImagePreview(""); };
  const openEditMarket = (m) => {
    setEditingMarketId(m.id);
    setMarketForm({
      name: m.name, area: m.area, address: m.address, timing: m.timing,
      operatingDays: m.operatingDays, farmers: String(m.farmers), landmark: m.landmark,
      latitude: String(m.coordinates?.latitude ?? m.location?.coordinates?.[1] ?? ""),
      longitude: String(m.coordinates?.longitude ?? m.location?.coordinates?.[0] ?? ""),
      removeImage: false,
    });
    setMarketImageFile(null);
    setMarketImagePreview(m.imageUrl ? m.image : "");
  };
  const closeMarketForm = () => { setMarketForm(null); setEditingMarketId(null); setMarketImageFile(null); setMarketImagePreview(""); };
  const chooseMarketImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      event.target.value = "";
      return notify("Image is too large", "Choose a market image smaller than 3 MB", "error");
    }
    setMarketImageFile(file);
    setMarketImagePreview(URL.createObjectURL(file));
    setMarketForm((current) => ({ ...current, removeImage: false }));
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return notify("Location unavailable", "Enter latitude and longitude manually", "error");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setMarketForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })),
      () => notify("Location permission denied", "Enter the market coordinates manually", "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveMarket = async (e) => {
    e.preventDefault();
    if (!marketForm.name || !marketForm.area || !marketForm.address) return;
    const existing = marketList.find((market) => market.id === editingMarketId);
    const latitude = Number(marketForm.latitude || existing?.coordinates?.latitude);
    const longitude = Number(marketForm.longitude || existing?.coordinates?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      notify("Coordinates are required", "Use your current location or enter verified latitude and longitude.", "error");
      return;
    }
    const timeParts = String(marketForm.timing || "08:00 – 14:00").split(/–|-/).map((part) => part.trim());
    const payload = {
      name: marketForm.name,
      address: marketForm.address,
      location: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },
      marketDays: String(marketForm.operatingDays || "saturday").split(",").map((day) => day.trim().toLowerCase()).filter(Boolean),
      openingTime: timeParts[0] || "08:00",
      closingTime: timeParts[1] || "14:00",
      description: marketForm.landmark || "MarketLink community pickup market",
      isActive: true,
    };
    const wasEditing = Boolean(editingMarketId);
    let saved;
    try {
      saved = wasEditing ? await adminUpdateMarket(editingMarketId, payload) : await adminCreateMarket(payload);
      setMarketList((previous) => previous.some((item) => item.id === saved.id)
        ? previous.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...previous]);
    } catch (error) {
      notify("Could not save market", error.message);
      return;
    }

    try {
      if (marketImageFile) saved = await adminUploadMarketImage(saved.id, marketImageFile);
      else if (wasEditing && marketForm.removeImage) saved = await adminRemoveMarketImage(saved.id);
      setMarketList((previous) => previous.map((item) => item.id === saved.id ? saved : item));
      notify("Market saved", marketImageFile ? "Market details and image were uploaded" : "The backend market record was updated");
      closeMarketForm();
    } catch (error) {
      setEditingMarketId(saved.id);
      notify("Market saved, but image upload failed", `${error.message}. Try selecting the image again.`, "error");
    }
  };
  const deleteMarket = async (id) => {
    if (!window.confirm("Archive this market from the platform?")) return;
    try {
      await adminDeleteMarket(id);
      setMarketList((prev) => prev.filter((m) => m.id !== id));
      notify("Market archived", "The market is no longer visible to customers");
    } catch (error) { notify("Could not archive market", error.message); }
  };

  const toggleCustomerStatus = async (customer) => {
    const nextStatus = customer.status === "Active" ? "suspended" : "active";
    try {
      const updated = await adminUpdateCustomerStatus(customer.id, nextStatus);
      setCustomerList((current) => current.map((item) => item.id === customer.id ? normalizeAdminCustomer(updated) : item));
      notify("Customer status updated", `${customer.name} is now ${nextStatus}`);
    } catch (error) { notify("Could not update customer", error.message); }
  };

  const removeReview = async (id) => {
    try {
      await adminRemoveReview(id);
      setReviewList((prev) => prev.filter((r) => r.id !== id));
      notify("Review removed", "The moderation action was saved");
    } catch (error) { notify("Could not remove review", error.message); }
  };

  const setProductAvailability = async (product, isAvailable) => {
    try {
      const updated = await adminUpdateProductStatus(product.id, isAvailable);
      setModerationProducts((current) => current.map((item) => item.id === product.id ? updated : item));
      notify(isAvailable ? "Product restored" : "Product removed", `${product.name} moderation status was updated`);
    } catch (error) { notify("Could not update product", error.message); }
  };

  const generatePlatformReport = () => {
    if (!report) return notify("Report is still loading", "Please try again in a moment", "error");
    const safeCell = (value) => {
      const text = String(value ?? "");
      const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${protectedText.replace(/"/g, '""')}"`;
    };
    const rows = [
      ["MarketLink Platform Report"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Platform summary"],
      ["Metric", "Value"],
      ["Total orders", report.orderCount],
      ["Completed revenue (Rs.)", report.revenue],
      ["Registered farmers", report.farmerCount],
      ["Pending farmers", report.pendingFarmerCount],
      ["Active customers", report.customerCount],
      ["Active markets", report.marketCount],
      ["Live products", report.activeProductCount],
      [],
      ["Revenue by market"],
      ["Market", "Orders", "Completed revenue (Rs.)"],
      ...(report.marketRevenue || []).map((item) => [item.market?.name || "Market", item.orderCount, item.revenue]),
      [],
      ["Most active farmers"],
      ["Farmer", "Orders", "Completed orders", "Units", "Revenue (Rs.)"],
      ...(report.activeFarmers || []).map((item) => [item.farmer?.farmName || item.farmer?.name || "Farmer", item.orderCount, item.completedOrders, item.units, item.revenue]),
      [],
      ["Best-selling products"],
      ["Product", "Units sold"],
      ...(report.bestSelling || []).map((item) => [item.name, item.units]),
    ];
    const csv = rows.map((row) => row.map(safeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketlink-platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Report generated", "The CSV report was downloaded successfully");
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    try {
      if (editingCategoryId) await adminUpdateCategory(editingCategoryId, { ...categoryForm, sortOrder: Number(categoryForm.sortOrder) });
      else await adminCreateCategory({ ...categoryForm, sortOrder: Number(categoryForm.sortOrder) });
      setCategoryList(await adminListCategories());
      await refreshCatalog(currentUser);
      setCategoryForm({ name: "", slug: "", icon: "basket", sortOrder: "0" });
      setEditingCategoryId("");
      notify(editingCategoryId ? "Category updated" : "Category created");
    } catch (error) { notify("Could not save category", error.message); }
  };

  const editCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, slug: category.slug, icon: category.icon || "basket", sortOrder: String(category.sortOrder || 0) });
  };

  const toggleCategory = async (category) => {
    try {
      if (category.isActive) await adminArchiveCategory(category.id);
      else await adminUpdateCategory(category.id, { isActive: true });
      setCategoryList(await adminListCategories());
      await refreshCatalog(currentUser);
      notify(category.isActive ? "Category archived" : "Category restored");
    } catch (error) { notify("Could not update category", error.message); }
  };

  return (
    <AnimatedPage>
      <section className="dashboard-section">
        <div className="container dashboard-container">
          {/* SIDEBAR NAVIGATION */}
          <aside className="farmer-sidebar">
            <div className="farmer-profile-summary">
              <div className="farmer-avatar-badge">AD</div>
              <div className="farmer-title-box">
                <strong>{currentUser.name}</strong>
                <span className="stall-location-text"><MapPin size={14} /> MarketLink HQ</span>
                <span className="role-chip">Platform Administrator</span>
              </div>
            </div>

            <button type="button" className="mobile-dashboard-menu-toggle" onClick={() => setMobileNavOpen((open) => !open)} aria-expanded={mobileNavOpen}>
              <span><BarChart3 size={17} /> Admin menu</span><ChevronRight size={17} className={mobileNavOpen ? "rotate-90" : ""} />
            </button>
            <nav className={`farmer-nav-menu ${mobileNavOpen ? "mobile-open" : ""}`}>
              <button className={`farmer-nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                <BarChart3 size={18} />
                <span>Overview</span>
              </button>

              <button className={`farmer-nav-link ${activeTab === "farmers" ? "active" : ""}`} onClick={() => setActiveTab("farmers")}>
                <Store size={18} />
                <span>Manage Farmers</span>
                <span className="nav-counter">{farmerList.length}</span>
              </button>

              <button className={`farmer-nav-link ${activeTab === "customers" ? "active" : ""}`} onClick={() => setActiveTab("customers")}>
                <Users size={18} />
                <span>Manage Customers</span>
                <span className="nav-counter">{customerList.length}</span>
              </button>

              <button className={`farmer-nav-link ${activeTab === "markets" ? "active" : ""}`} onClick={() => setActiveTab("markets")}>
                <MapPin size={18} />
                <span>Manage Markets</span>
                <span className="nav-counter">{marketList.length}</span>
              </button>

              <button className={`farmer-nav-link ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
                <ClipboardList size={18} />
                <span>All Orders</span>
                {pendingOrdersCount > 0 && <span className="nav-alert-dot">{pendingOrdersCount}</span>}
              </button>

              <button className={`farmer-nav-link ${activeTab === "moderation" ? "active" : ""}`} onClick={() => setActiveTab("moderation")}>
                <ShieldCheck size={18} />
                <span>Content Moderation</span>
              </button>
              <button className={`farmer-nav-link ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
                <Tags size={18} />
                <span>Product Categories</span>
              </button>
              <Link className="farmer-nav-link" to="/admin/announcements">
                <Megaphone size={18} />
                <span>Announcements</span>
              </Link>
            </nav>

            <div className="sidebar-quick-card">
              <span className="quick-label">Platform Notice</span>
              <p>You're viewing the Admin panel. Changes are persisted through the MarketLink API.</p>
              <Link to="/" className="link-green-small">
                Back to Storefront ➔
              </Link>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="farmer-main-content">
            {/* 1. OVERVIEW */}
            {activeTab === "dashboard" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Admin Panel Overview</span>
                    <h1 className="dash-title">Welcome, {currentUser.name.split(" ")[0]} <ShieldCheck size={25} aria-hidden="true" /></h1>
                    <p className="dash-subtitle">Platform-wide snapshot of farmers, customers, markets and orders.</p>
                  </div>
                  <button type="button" className="btn-primary admin-report-download" onClick={generatePlatformReport} disabled={!report}>
                    <FileDown size={17} /> Generate CSV Report
                  </button>
                </div>

                <div className="metrics-cards-grid">
                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-blue"><Store size={20} /></div>
                    <div className="metric-data">
                      <span className="metric-label">Registered Farmers</span>
                      <strong className="metric-value">{farmerList.length}</strong>
                      <span className="metric-trend trend-up">Across {marketList.length} markets</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-amber"><Users size={20} /></div>
                    <div className="metric-data">
                      <span className="metric-label">Registered Customers</span>
                      <strong className="metric-value">{customerList.length}</strong>
                      <span className="metric-trend trend-pending">{customerList.filter(c => c.status === "Suspended").length} suspended</span>
                    </div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-green"><DollarSign size={20} /></div>
                    <div className="metric-data">
                      <span className="metric-label">Total Platform Revenue</span>
                      <strong className="metric-value">Rs. {(totalRevenue / 1000).toFixed(1)}k</strong>
                      <span className="metric-trend trend-up">From {orders.length} pre-orders</span>
                    </div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-icon-wrap icon-purple"><TrendingUp size={20} /></div>
                    <div className="metric-data">
                      <span className="metric-label">Live Products</span>
                      <strong className="metric-value">{products.length}</strong>
                      <span className="metric-trend">Across all stalls</span>
                    </div>
                  </div>
                </div>

                <div className="dash-panels-two-col">
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div>
                        <h3>Recent Orders</h3>
                        <small>Latest pre-orders placed across the platform</small>
                      </div>
                      <button className="link-btn-small" onClick={() => setActiveTab("orders")}>View All</button>
                    </div>
                    <div className="dash-stock-list">
                      {orders.slice(0, 5).map((o) => (
                        <div className="dash-stock-item" key={o.id}>
                          <div className="stock-info">
                            <strong>#{o.id} — {o.customerName}</strong>
                            <small>{o.market} · {o.date}</small>
                          </div>
                          <div className="stock-level-pill">
                            <strong>Rs. {o.total}</strong>
                            <span className="tag-in-stock">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div>
                        <h3>Most Active Farmers</h3>
                        <small>Ranked by non-cancelled customer orders</small>
                      </div>
                      <button className="link-btn-small" onClick={() => setActiveTab("farmers")}>Manage All</button>
                    </div>
                    <div className="dash-stock-list">
                      {(report?.activeFarmers || []).slice(0, 5).map((item) => (
                        <div className="dash-stock-item" key={item._id}>
                          <div className="stock-info">
                            <strong>{item.farmer?.farmName || item.farmer?.name || "Farmer"}</strong>
                            <small>{item.orderCount} orders · {item.completedOrders} completed · {item.units} units</small>
                          </div>
                          <div className="stock-level-pill">
                            <strong>Rs. {Number(item.revenue || 0).toLocaleString()}</strong>
                            <span className="tag-in-stock">Active</span>
                          </div>
                        </div>
                      ))}
                      {!report?.activeFarmers?.length && <p className="muted-text">Farmer activity will appear after orders are placed.</p>}
                    </div>
                  </div>

                  <div className="dash-card">
                    <div className="dash-card-header"><div><h3>Revenue by Market</h3><small>Completed-order revenue and total order activity</small></div></div>
                    <div className="dash-stock-list">
                      {(report?.marketRevenue || []).map((item) => <div className="dash-stock-item" key={item._id}><div className="stock-info"><strong>{item.market?.name || "Market"}</strong><small>{item.orderCount} total orders</small></div><div className="stock-level-pill"><strong>Rs. {Number(item.revenue || 0).toLocaleString()}</strong><span className="tag-in-stock">Revenue</span></div></div>)}
                      {!report?.marketRevenue?.length && <p className="muted-text">Market revenue will appear after completed orders.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MANAGE FARMERS */}
            {activeTab === "farmers" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">User Management</span>
                    <h1 className="dash-title">Farmers ({farmerList.length})</h1>
                    <p className="dash-subtitle">Add new farm stalls, edit existing ones, or remove them from the platform.</p>
                  </div>
                </div>

                {farmerForm && (
                  <div className="dash-card form-max-width">
                    <div className="dash-card-header">
                      <h3>Edit Farmer Details</h3>
                      <button className="link-btn-small" onClick={closeFarmerForm}><X size={14} /> Cancel</button>
                    </div>
                    <form onSubmit={saveFarmer} className="profile-edit-form">
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Farm / Stall Name</label>
                          <input type="text" value={farmerForm.name} onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })} required />
                        </div>
                        <div className="form-field-group">
                          <label>Owner Name</label>
                          <input type="text" value={farmerForm.owner} onChange={(e) => setFarmerForm({ ...farmerForm, owner: e.target.value })} required />
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Assigned Market</label>
                          <input type="text" value={farmerForm.location} onChange={(e) => setFarmerForm({ ...farmerForm, location: e.target.value })} required />
                        </div>
                        <div className="form-field-group">
                          <label>City</label>
                          <input type="text" value={farmerForm.city} onChange={(e) => setFarmerForm({ ...farmerForm, city: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Phone</label>
                          <input type="text" value={farmerForm.phone} onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })} />
                        </div>
                        <div className="form-field-group">
                          <label>Email</label>
                          <input type="email" value={farmerForm.email} onChange={(e) => setFarmerForm({ ...farmerForm, email: e.target.value })} />
                        </div>
                      </div>
                      <p className="field-help">Ratings and product counts are calculated from reviews and catalogue data and cannot be edited manually.</p>
                      <button type="submit" className="btn-primary">
                        Save Changes
                      </button>
                    </form>
                  </div>
                )}

                <div className="dash-table-card">
                  <table className="inventory-table admin-farmers-table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Market</th>
                        <th>Products</th>
                        <th>Rating</th>
                        <th>Registration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerList.map((f) => (
                        <tr key={f.id}>
                          <td className="table-prod-cell" data-label="Farmer">
                            <img src={f.image} alt={f.name} />
                            <div>
                              <strong>{f.name}</strong>
                              <small>{f.owner}</small>
                            </div>
                          </td>
                          <td data-label="Market">{f.location}</td>
                          <td data-label="Products">{f.productsCount}</td>
                          <td data-label="Rating">★ {f.rating}</td>
                          <td data-label="Registration"><Badge tone={f.registrationNumberProvided ? "success" : "warning"}>{f.registrationNumberMasked || "Missing"}</Badge></td>
                          <td data-label="Status"><Badge>{f.accountStatus || f.badge}</Badge></td>
                          <td data-label="Actions">
                            <div className="table-actions-row">
                              <button className="link-btn-small" onClick={() => openEditFarmer(f)}>
                                <Edit3 size={14} /> Edit
                              </button>
                              {f.accountStatus !== "active" && <button className="link-btn-small" onClick={() => changeFarmerStatus(f, "active")}>
                                <CheckCircle2 size={14} /> Approve
                              </button>}
                              {f.accountStatus === "active" && <button className="link-btn-small" onClick={() => changeFarmerStatus(f, "suspended")}>
                                <AlertTriangle size={14} /> Suspend
                              </button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {farmerList.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No farmers left in the list.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. MANAGE CUSTOMERS */}
            {activeTab === "customers" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">User Management</span>
                    <h1 className="dash-title">Customers ({customerList.length})</h1>
                    <p className="dash-subtitle">Review real customer accounts, preferred hubs and access status.</p>
                  </div>
                  {!customerForm && (
                    <button className="btn-primary" onClick={openAddCustomer}>
                      <Plus size={16} /> Add Customer
                    </button>
                  )}
                </div>
                <div className="admin-list-toolbar">
                  <input aria-label="Search customers" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search name, email, area..." />
                  <select aria-label="Filter customers by status" value={customerStatusFilter} onChange={(event) => setCustomerStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
                </div>

                {customerForm && (
                  <div className="dash-card form-max-width">
                    <div className="dash-card-header">
                      <h3>{editingCustomerId ? "Edit Customer" : "Add New Customer"}</h3>
                      <button className="link-btn-small" onClick={closeCustomerForm}><X size={14} /> Cancel</button>
                    </div>
                    <form onSubmit={saveCustomer} className="profile-edit-form">
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Full Name</label>
                          <input type="text" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} required />
                        </div>
                        <div className="form-field-group">
                          <label>Email</label>
                          <input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} required />
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Address / Area</label>
                          <input type="text" value={customerForm.area} onChange={(e) => setCustomerForm({ ...customerForm, area: e.target.value })} />
                        </div>
                        <div className="form-field-group">
                          <label>Phone</label>
                          <input type="tel" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group"><label>Preferred Market</label><select value={customerForm.preferredMarket} onChange={(e) => setCustomerForm({ ...customerForm, preferredMarket: e.target.value })}><option value="">No preferred market</option>{marketList.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}</select></div>
                        {!editingCustomerId && <div className="form-field-group"><label>Temporary Password</label><input type="password" minLength={6} value={customerForm.password} onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })} required /></div>}
                      </div>
                      <button type="submit" className="btn-primary">
                        {editingCustomerId ? "Save Changes" : "Add Customer"}
                      </button>
                    </form>
                  </div>
                )}

                <div className="dash-table-card">
                  <table className="inventory-table admin-customers-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Area</th>
                        <th>Preferred Market</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCustomerList.map((c) => (
                        <tr key={c.id}>
                          <td className="table-prod-cell" data-label="Customer">
                            <div>
                              <strong>{c.name}</strong>
                              <small>{c.email}</small>
                            </div>
                          </td>
                          <td data-label="Area">{c.area}</td>
                          <td data-label="Preferred market">{c.preferredMarket}</td>
                          <td data-label="Registered">{c.registrationDate}</td>
                          <td data-label="Status">
                            <Badge>{c.status}</Badge>
                          </td>
                          <td data-label="Actions">
                            <div className="table-actions-row">
                              <button className="link-btn-small" onClick={() => openEditCustomer(c)}>
                                <Edit3 size={14} /> Edit
                              </button>
                              <button className="link-btn-small" onClick={() => toggleCustomerStatus(c)}>
                                {c.status === "Active" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                {c.status === "Active" ? "Suspend" : "Activate"}
                              </button>
                              <button className="link-btn-small" onClick={() => deleteCustomer(c.id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {visibleCustomerList.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>{customerList.length === 0 ? "No customers found in the database." : "No customers match this search."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. MANAGE MARKETS */}
            {activeTab === "markets" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Market Locations</span>
                    <h1 className="dash-title">Markets ({marketList.length})</h1>
                    <p className="dash-subtitle">Add new pickup markets, edit details, or remove inactive ones.</p>
                  </div>
                  {!marketForm && (
                    <button className="btn-primary" onClick={openAddMarket}>
                      <Plus size={16} /> Add Market
                    </button>
                  )}
                </div>

                {marketForm && (
                  <div className="dash-card form-max-width">
                    <div className="dash-card-header">
                      <h3>{editingMarketId ? "Edit Market" : "Add New Market"}</h3>
                      <button className="link-btn-small" onClick={closeMarketForm}><X size={14} /> Cancel</button>
                    </div>
                    <form onSubmit={saveMarket} className="profile-edit-form">
                      <div className="market-image-editor">
                        <div className="market-image-admin-preview">
                          {marketImagePreview ? <img src={marketImagePreview} alt="Market preview" /> : <><Store size={34} /><span>No market image added</span></>}
                        </div>
                        <div className="form-field-group farmer-image-upload-field">
                          <label htmlFor="admin-market-image"><Upload size={15} /> Market image</label>
                          <input id="admin-market-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseMarketImage} />
                          <small>Upload a JPG, PNG, or WebP image up to 3 MB.</small>
                          {marketImagePreview && <button className="remove-profile-image" type="button" onClick={() => { setMarketImageFile(null); setMarketImagePreview(""); setMarketForm((current) => ({ ...current, removeImage: true })); }}><Trash2 size={14} /> Remove image</button>}
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Market Name</label>
                          <input type="text" value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} required />
                        </div>
                        <div className="form-field-group">
                          <label>Area</label>
                          <input type="text" value={marketForm.area} onChange={(e) => setMarketForm({ ...marketForm, area: e.target.value })} required />
                        </div>
                      </div>
                      <div className="form-field-group">
                        <label>Full Address</label>
                        <input type="text" value={marketForm.address} onChange={(e) => setMarketForm({ ...marketForm, address: e.target.value })} />
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Timing</label>
                          <input type="text" placeholder="8:00 AM – 2:00 PM" value={marketForm.timing} onChange={(e) => setMarketForm({ ...marketForm, timing: e.target.value })} />
                        </div>
                        <div className="form-field-group">
                          <label>Operating Days</label>
                          <input type="text" placeholder="Mon, Wed, Sat" value={marketForm.operatingDays} onChange={(e) => setMarketForm({ ...marketForm, operatingDays: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-two-cols">
                        <div className="form-field-group">
                          <label>Nearby Landmark</label>
                          <input type="text" value={marketForm.landmark} onChange={(e) => setMarketForm({ ...marketForm, landmark: e.target.value })} placeholder="Near Expo Center gate 2" />
                        </div>
                        <div className="form-field-group">
                          <label>Active Stalls (Automatic)</label>
                          <input type="number" value={marketForm.farmers} readOnly aria-readonly="true" />
                        </div>
                      </div>
                      <div className="market-location-picker">
                        <div className="market-location-picker-head"><label><MapPin size={15} /> Location Pin</label><button type="button" className="link-btn-small" onClick={useCurrentLocation}><LocateFixed size={14} /> Use my current location</button></div>
                        <p className="field-help">Allow browser location or enter coordinates manually so customers can open the exact market point.</p>
                        <div className="form-two-cols">
                          <div className="form-field-group"><label>Latitude</label><input type="number" step="any" min="-90" max="90" value={marketForm.latitude} onChange={(e) => setMarketForm({ ...marketForm, latitude: e.target.value })} placeholder="24.8138" required /></div>
                          <div className="form-field-group"><label>Longitude</label><input type="number" step="any" min="-180" max="180" value={marketForm.longitude} onChange={(e) => setMarketForm({ ...marketForm, longitude: e.target.value })} placeholder="67.0271" required /></div>
                        </div>
                      </div>
                      <button type="submit" className="btn-primary">
                        {editingMarketId ? "Save Changes" : "Add Market"}
                      </button>
                    </form>
                  </div>
                )}

                <div className="dash-table-card">
                  <table className="inventory-table admin-markets-table">
                    <thead>
                      <tr>
                        <th>Market</th>
                        <th>Area</th>
                        <th>Timing</th>
                        <th>Operating Days</th>
                        <th>Farmers</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketList.map((m) => (
                        <tr key={m.id}>
                          <td className="table-prod-cell" data-label="Market">
                            <img src={m.image} alt={m.name} />
                            <div>
                              <strong>{m.name}</strong>
                              <small>{m.landmark}</small>
                            </div>
                          </td>
                          <td data-label="Area">{m.area}</td>
                          <td data-label="Timing">{m.timing}</td>
                          <td data-label="Market days">{m.operatingDays}</td>
                          <td data-label="Farmers">{m.farmers}</td>
                          <td data-label="Actions">
                            <div className="table-actions-row">
                              <button className="link-btn-small" onClick={() => openEditMarket(m)}>
                                <Edit3 size={14} /> Edit
                              </button>
                              <button className="link-btn-small" onClick={() => deleteMarket(m.id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {marketList.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>No markets left in the list.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. ALL ORDERS */}
            {activeTab === "orders" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Order Oversight</span>
                    <h1 className="dash-title">All Pre-Orders ({orders.length})</h1>
                    <p className="dash-subtitle">Every pre-order placed across all farmers and markets.</p>
                  </div>
                </div>

                <div className="dash-table-card">
                  <table className="inventory-table admin-orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Market</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td data-label="Order"><strong>#{o.id}</strong></td>
                          <td data-label="Customer">{o.customerName}</td>
                          <td data-label="Market">{o.market}</td>
                          <td data-label="Amount">Rs. {o.total}</td>
                          <td data-label="Status"><Badge>{o.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. CATEGORY MASTER DATA */}
            {activeTab === "categories" && (
              <div>
                <div className="dash-top-header"><div><span className="eyebrow">System Configuration</span><h1 className="dash-title">Product Categories ({categoryList.length})</h1><p className="dash-subtitle">Manage the live categories available to farmers and customers.</p></div></div>
                <div className="dash-panels-two-col">
                  <form className="dash-card profile-edit-form" onSubmit={saveCategory}>
                    <div className="card-heading-row"><h3><Tags size={18} /> {editingCategoryId ? "Edit category" : "Add category"}</h3>{editingCategoryId && <button type="button" className="btn-outline btn-compact" onClick={() => { setEditingCategoryId(""); setCategoryForm({ name: "", slug: "", icon: "basket", sortOrder: "0" }); }}><X size={14} /> Cancel</button>}</div>
                    <div className="form-field-group"><label>Category name</label><input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required maxLength={60} /></div>
                    <div className="form-two-cols"><div className="form-field-group"><label>Slug</label><input value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} placeholder="Generated from name" /></div><div className="form-field-group"><label>Display order</label><input type="number" min="0" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })} /></div></div>
                    <div className="form-field-group"><label>Icon type</label><select value={categoryForm.icon} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })}><option value="vegetables">Vegetables</option><option value="fruits">Fruits</option><option value="dairy">Dairy</option><option value="bakery">Bakery</option><option value="basket">General basket</option></select></div>
                    <button type="submit" className="btn-primary"><Plus size={16} /> {editingCategoryId ? "Save category" : "Create category"}</button>
                  </form>
                  <div className="dash-card"><h3>Category master list</h3><div className="dash-stock-list">{categoryList.map((category) => <div className="dash-stock-item" key={category.id}><div className="stock-info"><strong>{category.name}</strong><small>{category.slug} · order {category.sortOrder || 0}</small></div><div className="table-action-group"><Badge tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Active" : "Archived"}</Badge><button type="button" className="btn-outline btn-compact" onClick={() => editCategory(category)}><Edit3 size={14} /> Edit</button><button type="button" className="btn-outline btn-compact" onClick={() => toggleCategory(category)}>{category.isActive ? "Archive" : "Restore"}</button></div></div>)}{!categoryList.length && <p>No categories configured.</p>}</div></div>
                </div>
              </div>
            )}

            {/* 7. CONTENT MODERATION */}
            {activeTab === "moderation" && (
              <div>
                <div className="dash-top-header">
                  <div>
                    <span className="eyebrow">Content Moderation</span>
                    <h1 className="dash-title">Products & Reviews</h1>
                    <p className="dash-subtitle">Remove inappropriate listings or customer reviews and restore content when needed.</p>
                  </div>
                </div>
                <div className="moderation-switch"><button type="button" className={moderationView === "products" ? "active" : ""} onClick={() => setModerationView("products")}><PackageSearch size={16} /> Product listings ({moderationProducts.length})</button><button type="button" className={moderationView === "reviews" ? "active" : ""} onClick={() => setModerationView("reviews")}><ShieldCheck size={16} /> Customer reviews ({reviewList.length})</button></div>

                {moderationView === "products" && (
                  <section className="moderation-product-panel" aria-label="Product listing moderation">
                    <div className="moderation-product-toolbar">
                      <div className="moderation-summary">
                        <span className="moderation-summary-icon"><Boxes size={20} /></span>
                        <div><strong>{moderationProducts.length} listings</strong><small>{moderationProducts.filter((item) => item.isAvailable).length} live · {moderationProducts.filter((item) => !item.isAvailable).length} removed</small></div>
                      </div>
                      <div className="moderation-controls">
                        <label className="moderation-search" htmlFor="moderation-product-search">
                          <Search size={16} />
                          <input id="moderation-product-search" value={moderationSearch} onChange={(event) => setModerationSearch(event.target.value)} placeholder="Search product, farmer or market" />
                        </label>
                        <select aria-label="Filter listings by status" value={moderationStatus} onChange={(event) => setModerationStatus(event.target.value)}>
                          <option value="all">All listings</option>
                          <option value="live">Live only</option>
                          <option value="removed">Removed only</option>
                        </select>
                      </div>
                    </div>

                    <div className="moderation-table-shell">
                      <table className="moderation-product-table">
                        <thead><tr><th>Product listing</th><th>Seller & pickup</th><th>Category</th><th>Inventory</th><th>Visibility</th><th><span className="sr-only">Moderation action</span></th></tr></thead>
                        <tbody>
                          {visibleModerationProducts.map((product) => (
                            <tr key={product.id} className={!product.isAvailable ? "is-removed" : ""}>
                              <td data-label="Product listing"><div className="admin-product-cell"><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>Rs. {Number(product.price || 0).toLocaleString()} / {product.unit}</small></div></div></td>
                              <td data-label="Seller & pickup"><div className="moderation-location"><strong>{product.farmer}</strong><small><MapPin size={12} /> {product.market}</small></div></td>
                              <td data-label="Category"><span className="moderation-category">{product.category}</span></td>
                              <td data-label="Inventory"><div className="moderation-stock"><strong>{product.stock}</strong><small>{product.unit} available</small></div></td>
                              <td data-label="Visibility"><Badge tone={product.isAvailable ? "success" : "neutral"}>{product.isAvailable ? <><Eye size={12} /> Live</> : <><EyeOff size={12} /> Removed</>}</Badge></td>
                              <td data-label="Action" className="moderation-action-cell"><button type="button" className={`moderation-action ${product.isAvailable ? "remove" : "restore"}`} onClick={() => setProductAvailability(product, !product.isAvailable)}>{product.isAvailable ? <><EyeOff size={15} /> Remove listing</> : <><Eye size={15} /> Restore listing</>}</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!visibleModerationProducts.length && <div className="moderation-empty"><PackageSearch size={25} /><strong>No matching listings</strong><span>Try changing the search or status filter.</span></div>}
                    </div>
                  </section>
                )}

                {moderationView === "reviews" && <div className="reviews-cards-grid">
                  {reviewList.filter((review) => review.status !== "removed").map((rev) => (
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
                      <small>{rev.product?.name || "Product review"}</small>
                      <button className="link-btn-small" onClick={() => removeReview(rev.id)}>
                        <AlertTriangle size={14} /> Remove Review
                      </button>
                    </div>
                  ))}
                  {reviewList.filter((review) => review.status !== "removed").length === 0 && (
                    <div className="dash-card">
                      <CheckCircle2 size={18} /> No reviews left to moderate.
                    </div>
                  )}
                </div>}
              </div>
            )}
          </main>
        </div>
      </section>
    </AnimatedPage>
  );
}
