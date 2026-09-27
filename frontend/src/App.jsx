import { lazy, Suspense, useEffect } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useStore } from "./context/StoreContext";
import { getToken } from "./api/client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIChat from "./components/AIChat";
import ScrollToTop from "./components/ScrollToTop";
import { LoadingState } from "./components/ui";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Farmers = lazy(() => import("./pages/Farmers"));
const Markets = lazy(() => import("./pages/Markets"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const FarmerDashboard = lazy(() => import("./pages/FarmerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const WeeklyStock = lazy(() => import("./pages/WeeklyStock"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RoleRoute({ role, children, approvedOnly = false }) {
  const { currentUser } = useStore();
  if (!getToken()) return <Navigate to="/login" replace />;
  if (role && currentUser.role !== role) return <Navigate to="/" replace />;
  if (currentUser.accountStatus === "suspended") return <Navigate to="/login" replace />;
  if (approvedOnly && currentUser.role === "farmer" && currentUser.accountStatus !== "active") return <Navigate to="/farmer/pending" replace />;
  return children;
}

export default function App() {
  const { toast, announcements } = useStore();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const fallback = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='620' viewBox='0 0 900 620'%3E%3Crect width='900' height='620' fill='%23e5f3ea'/%3E%3Cpath d='M450 405c-95-84-104-196 8-247 4 80 49 109 111 129-23 78-61 118-119 118Z' fill='%23176b43' opacity='.82'/%3E%3Cpath d='M452 402c-4-93 27-162 89-211' stroke='%23fff' stroke-width='18' stroke-linecap='round' opacity='.75'/%3E%3C/svg%3E";
    const handleImageError = (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = "true";
      image.src = fallback;
    };
    document.addEventListener("error", handleImageError, true);
    return () => document.removeEventListener("error", handleImageError, true);
  }, []);

  return (
    <div className={`app-shell ${isAuthPage ? "auth-route" : ""}`}>
      <ScrollToTop />
      <Navbar />
      {location.pathname === "/" && announcements.length > 0 && (
        <section className="announcement-strip" aria-label="Platform announcements">
          <strong>{announcements[0].title}</strong>
          <span>{announcements[0].message}</span>
        </section>
      )}

      <main className="main-viewport">
        <Suspense fallback={<div className="route-loading"><LoadingState title="Loading MarketLink…" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<RoleRoute role="customer"><Checkout /></RoleRoute>} />
          <Route path="/orders" element={<RoleRoute role="customer"><Orders /></RoleRoute>} />
          <Route path="/favorites" element={<RoleRoute role="customer"><Favorites /></RoleRoute>} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/profile" element={<RoleRoute><Profile /></RoleRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farmer/pending" element={<RoleRoute role="farmer"><PendingApproval /></RoleRoute>} />
          <Route path="/farmer/dashboard" element={<RoleRoute role="farmer" approvedOnly><FarmerDashboard /></RoleRoute>} />
          <Route path="/farmer/weekly-stock" element={<RoleRoute role="farmer" approvedOnly><WeeklyStock /></RoleRoute>} />
          <Route path="/admin/dashboard" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/announcements" element={<RoleRoute role="admin"><AdminAnnouncements /></RoleRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>

      {/* MarketLink AI Assistant */}
      <AIChat />

      {/* Floating Animated Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-notification-capsule"
            initial={{ opacity: 0, y: 35, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
          >
            <div className={`toast-icon-wrap toast-${toast.kind || "success"}`}>
              {toast.kind === "error" ? <AlertCircle size={18} className="toast-check" /> : <CheckCircle2 size={18} className="toast-check" />}
            </div>
            <div className="toast-text-wrap">
              <strong className="toast-title">{toast.title}</strong>
              {toast.subtitle && <span className="toast-subtitle">{toast.subtitle}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
