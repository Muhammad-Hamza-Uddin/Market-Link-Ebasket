import { useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, Clock3, CheckCircle2, CircleDot, ChevronDown, ChevronUp, MapPin, QrCode, ShoppingBag, ArrowRight, ShieldCheck, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import PickupRouteDetails from "../components/PickupRouteDetails";
import { useStore } from "../context/StoreContext";

// SRS Spec: Placed -> Accepted -> Ready for Pickup -> Completed
const ORDER_STAGES = [
  { key: "Placed", label: "Placed", desc: "Pre-order submitted by customer" },
  { key: "Accepted", label: "Accepted", desc: "Farmer accepted and reserving harvest" },
  { key: "Ready for Pickup", label: "Ready for Pickup", desc: "Packed and waiting at market stall" },
  { key: "Completed", label: "Completed", desc: "Collected and settled in person" }
];

const orderPickupSlots = (order) => {
  const farmer = order?.farmerObject || {};
  const market = order?.marketObject || {};
  const toMinutes = (value) => {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = Math.max(toMinutes(farmer.pickupStartTime) ?? 0, toMinutes(market.openingTime) ?? 0);
  const end = Math.min(toMinutes(farmer.pickupEndTime) ?? 1440, toMinutes(market.closingTime) ?? 1440);
  const size = Number(farmer.pickupSlotMinutes || 60);
  const format = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const slots = [];
  for (let cursor = start; cursor + size <= end; cursor += size) slots.push(`${format(cursor)} - ${format(cursor + size)}`);
  return slots;
};

export default function Orders() {
  const { orders, currentUser, cancelOrder, modifyOrder, reorder, notify } = useStore();
  const [editingOrder, setEditingOrder] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(orders[0]?.id || null);
  const primaryMarket = Object.entries(orders.reduce((counts, order) => ({ ...counts, [order.market]: (counts[order.market] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "No pickups yet";

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const openEdit = (order) => {
    setEditingOrder(order);
    setEditDate(order.pickupDate?.slice?.(0, 10) || "");
    setEditSlot(order.pickupSlot || "");
    setEditNotes(order.notes || "");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await modifyOrder(editingOrder.id, { pickupDate: editDate, pickupSlot: editSlot, notes: editNotes });
      setEditingOrder(null);
    } catch (error) { notify("Could not modify order", error.message); }
  };

  const getStageIndex = (status) => {
    const idx = ORDER_STAGES.findIndex((s) => s.key.toLowerCase() === status.toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  return (
    <AnimatedPage>
      {/* Page Hero */}
      <section className="page-hero-banner">
        <div className="container">
          <span className="eyebrow">Customer Dashboard</span>
          <h1 className="hero-page-title">My Pre-Orders & Pickup Status</h1>
          <p className="hero-page-desc">
            Track your reserved farm produce in real-time, view pickup verification tokens, and inspect stall locations.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          {/* Quick Metrics Bar */}
          <div className="customer-stats-strip">
            <div className="c-stat-box">
              <span className="c-stat-label">Total Pre-Orders</span>
              <strong className="c-stat-number">{orders.length}</strong>
            </div>
            <div className="c-stat-box">
              <span className="c-stat-label">Active / Ready for Pickup</span>
              <strong className="c-stat-number c-green">
                {orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)).length}
              </strong>
            </div>
            <div className="c-stat-box">
              <span className="c-stat-label">Completed Pickups</span>
              <strong className="c-stat-number">
                {orders.filter((o) => o.status === "Completed").length}
              </strong>
            </div>
            <div className="c-stat-box">
              <span className="c-stat-label">Primary Market Hub</span>
              <strong className="c-stat-number c-small">{primaryMarket}</strong>
            </div>
          </div>

          {/* Orders List */}
          <div className="orders-cards-list">
            {orders.map((order) => {
              const currentStageIdx = getStageIndex(order.status);
              const isExpanded = expandedOrderId === order.id;
              const itemCount = order.items.reduce((s, i) => s + (i.quantity || 1), 0);

              return (
                <motion.div
                  key={order.id}
                  className="modern-order-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Order Top Bar */}
                  <div className="order-main-header">
                    <div className="order-id-group">
                      <div className="order-number-badge">
                        <span>Order</span>
                        <strong>#{order.id}</strong>
                      </div>
                      <div className="order-meta-info">
                        <span className="order-products-summary">
                          {order.items.length} Products ({itemCount} units)
                        </span>
                        <div className="order-date-row">
                          <span><Clock3 size={13} /> {order.date}</span>
                          <span>•</span>
                          <span><MapPin size={13} /> {order.market}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-header-right">
                      <div className="order-price-box">
                        <small>Total Amount</small>
                        <strong className="order-total-price">Rs. {order.total}</strong>
                      </div>
                      <div className={`status-badge-capsule status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        <CircleDot size={12} />
                        <span>{order.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* SRS Status Timeline: Placed -> Accepted -> Ready for Pickup -> Completed */}
                  <div className="srs-timeline-container">
                    <div className="timeline-progress-bar">
                      <div
                        className="timeline-progress-fill"
                        style={{ width: `${(currentStageIdx / (ORDER_STAGES.length - 1)) * 100}%` }}
                      />
                    </div>

                    <div className="timeline-steps-row">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isDone = currentStageIdx > idx;
                        const isCurrent = currentStageIdx === idx;
                        return (
                          <div
                            key={stage.key}
                            className={`timeline-step-node ${isDone ? "step-done" : ""} ${isCurrent ? "step-current" : ""}`}
                          >
                            <div className="node-circle">
                              {isDone ? (
                                <CheckCircle2 size={16} />
                              ) : isCurrent ? (
                                <span className="current-ring" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span className="step-label">{stage.label}</span>
                            <small className="step-desc">{stage.desc}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pickup Verification Token & QR Card */}
                  <div className="pickup-token-strip">
                    <div className="token-left">
                      <div className="qr-visual-box">
                        <QrCode size={28} />
                      </div>
                      <div className="token-details">
                        <small>Stall Pickup Verification Code</small>
                        <strong className="token-code">{order.pickupToken || `PK-${order.id}-XG`}</strong>
                        <p className="token-tip">Show this code or QR at the farmer's stall when collecting.</p>
                      </div>
                    </div>

                    <div className="token-right">
                      <div className="pickup-slot-pill">
                        <Clock3 size={14} />
                        <span>Slot: {order.pickupSlot || "Not configured"}</span>
                      </div>
                      <button
                        className="btn-toggle-items"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <span>{isExpanded ? "Hide Details" : "View Order Details"}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Order Items Breakdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="order-breakdown-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <h4 className="breakdown-title">Items in this Pre-Order</h4>
                        <div className="breakdown-items-list">
                          {order.items.map((it, idx) => (
                            <div className="breakdown-row" key={idx}>
                              <div className="b-item-name">
                                <strong>{it.name}</strong>
                                <small>By {it.farmer || "Local Farm"}</small>
                              </div>
                              <div className="b-item-pricing">
                                <span>{it.quantity || 1} {it.unit || "unit"} × Rs. {it.price}</span>
                                <strong>Rs. {(it.quantity || 1) * it.price}</strong>
                              </div>
                            </div>
                          ))}
                        </div>

                        <PickupRouteDetails market={{ ...order.marketObject, name: order.market }} address={currentUser.address} />

                        <div className="breakdown-footer">
                          <div className="payment-note">
                            <ShieldCheck size={16} />
                            <span>Payment of <strong>Rs. {order.total}</strong> to be completed at market pickup.</span>
                          </div>

                          {order.status === "Placed" && (
                            <div className="status-simulate-pill">
                              <button className="btn-step-mini" onClick={() => openEdit(order)}>Modify pickup</button>
                              <button className="btn-step-mini" onClick={() => cancelOrder(order.id)}>Cancel pending order</button>
                            </div>
                          )}
                          {order.status === "Completed" && (
                            <Link className="btn-step-mini" to="/cart" onClick={(event) => { if (!reorder(order)) event.preventDefault(); }}>Reorder available items</Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {orders.length === 0 && (
              <div className="empty-cart-card">
                <ShoppingBag size={48} />
                <h2>No Orders Yet</h2>
                <p>You haven't reserved any produce from local market stalls yet.</p>
                <Link to="/products" className="btn-primary-large">
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {editingOrder && (
        <div className="modal-backdrop" onClick={() => setEditingOrder(null)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="eyebrow">Pending Order</span><h3>Modify Pickup Details</h3></div>
              <button className="modal-close" onClick={() => setEditingOrder(null)}>✕</button>
            </div>
            <form className="review-form" onSubmit={saveEdit}>
              <label>Pickup date<input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} required /></label>
              <label>Pickup slot<select value={editSlot} onChange={(event) => setEditSlot(event.target.value)} required>{!orderPickupSlots(editingOrder).length && <option value="">No pickup slots configured</option>}{orderPickupSlots(editingOrder).map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
              <label>Notes<textarea rows={3} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} /></label>
              <button className="btn-primary-large" type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
