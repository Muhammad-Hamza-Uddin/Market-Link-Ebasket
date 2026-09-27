import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, LocateFixed, MapPin, Route, Phone, ShieldCheck, Store, User } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import PickupRouteDetails from "../components/PickupRouteDetails";
import { useStore } from "../context/StoreContext";
import { getRouteOrigin, routeToMarket } from "../utils/routing";

const groupKey = (item) => `${item.farmerId || "farmer"}:${item.marketId || "market"}`;
const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function nextPickupDate(validDays) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  for (let index = 0; index < 21; index += 1) {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    if (!validDays.length || validDays.includes(weekday)) return dateValue(date);
    date.setDate(date.getDate() + 1);
  }
  return "";
}

function makePickupSlots(farmer, market) {
  const start = farmer.pickupStartTime || market?.openingTime;
  const end = farmer.pickupEndTime || market?.closingTime;
  if (!start || !end) return [];
  const toMinutes = (value) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
  const format = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const slotMinutes = Number(farmer.pickupSlotMinutes || 60);
  const slots = [];
  for (let cursor = toMinutes(start); cursor + slotMinutes <= toMinutes(end); cursor += slotMinutes) slots.push(`${format(cursor)} - ${format(cursor + slotMinutes)}`);
  return slots;
}

export default function Checkout() {
  const { cart, subtotal, markets, placeOrder, currentUser, notify } = useStore();
  const navigate = useNavigate();
  const [pickupSelections, setPickupSelections] = useState({});
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [routeMetrics, setRouteMetrics] = useState({});
  const [planningRoute, setPlanningRoute] = useState(false);

  const pickupGroups = useMemo(() => {
    const groups = new Map();
    cart.forEach((item) => {
      const key = groupKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return [...groups.entries()].map(([key, items]) => {
      const market = markets.find((candidate) => candidate.id === items[0].marketId) || items[0].marketObject || {};
      const farmer = items[0].farmerObject || {};
      const farmerDays = (farmer.operatingDays || []).map((day) => day.toLowerCase());
      const marketDays = (market.marketDays || []).map((day) => day.toLowerCase());
      const validDays = farmerDays.length && marketDays.length ? farmerDays.filter((day) => marketDays.includes(day)) : (farmerDays.length ? farmerDays : marketDays);
      const slots = makePickupSlots(farmer, market);
      return { key, items, farmerName: items[0].farmer, market, marketName: items[0].market, validDays, slots, nextDate: nextPickupDate(validDays), total: items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0) };
    });
  }, [cart, markets]);

  const displayGroups = useMemo(() => [...pickupGroups].sort((a, b) => {
    const aDuration = routeMetrics[a.key]?.durationMinutes ?? Number.POSITIVE_INFINITY;
    const bDuration = routeMetrics[b.key]?.durationMinutes ?? Number.POSITIVE_INFINITY;
    return aDuration - bDuration;
  }), [pickupGroups, routeMetrics]);

  const planPickupRoute = async () => {
    setPlanningRoute(true);
    setError("");
    try {
      const origin = await getRouteOrigin(currentUser.address);
      const entries = await Promise.all(pickupGroups.map(async (group) => [group.key, await routeToMarket(origin, group.market)]));
      setRouteMetrics(Object.fromEntries(entries));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPlanningRoute(false);
    }
  };

  const selectionFor = (group) => ({ pickupDate: pickupSelections[group.key]?.pickupDate || group.nextDate, pickupSlot: pickupSelections[group.key]?.pickupSlot || group.slots[0] || "" });
  const updateSelection = (key, field, value) => setPickupSelections((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));

  if (!cart.length) {
    return <AnimatedPage><div className="container section-padding"><div className="empty-cart-card"><h2>Your Pre-Order Basket is Empty</h2><p>Please select some fresh produce before setting up your market pickups.</p><Link className="btn-primary-large" to="/products">Browse Fresh Harvest <ArrowRight size={18} /></Link></div></div></AnimatedPage>;
  }

  const handleSubmitPreOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const plans = pickupGroups.map((group) => ({ key: group.key, ...selectionFor(group) }));
      const invalidGroup = pickupGroups.find((group, index) => {
        if (!group.validDays.length) return false;
        const weekday = new Date(`${plans[index].pickupDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        return !group.validDays.includes(weekday);
      });
      if (invalidGroup) throw new Error(`Choose one of ${invalidGroup.validDays.join(", ")} for ${invalidGroup.farmerName}.`);
      await placeOrder({ orders: plans, notes });
      navigate("/orders");
    } catch (requestError) {
      setError(requestError.message || "Unable to place these orders");
      notify("Checkout could not be completed", requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allGroupsReady = pickupGroups.every((group) => group.slots.length && selectionFor(group).pickupDate && selectionFor(group).pickupSlot);

  return (
    <AnimatedPage>
      <section className="section-padding">
        <div className="container narrow-container">
          <Link to="/cart" className="back-nav-link"><ArrowLeft size={16} /> Return to Basket</Link>
          <div className="checkout-title-wrap"><span className="eyebrow">Multi-stall pre-order</span><h1 className="page-title">Arrange Your Market Pickups</h1><p className="page-subtitle">Your basket will become {pickupGroups.length} separate {pickupGroups.length === 1 ? "order" : "orders"}, so every farmer can prepare their own harvest.</p></div>
          <div className="checkout-grid-layout">
            <form onSubmit={handleSubmitPreOrder} className="checkout-form-card">
              {error && <div className="form-error-message" role="alert">{error}</div>}
              <div className="checkout-route-planner"><div><Route size={20} /><span><strong>Route-friendly pickup order</strong><small>Use your location to arrange the nearest market pickups first.</small></span></div><button type="button" onClick={planPickupRoute} disabled={planningRoute}><LocateFixed size={16} /> {planningRoute ? "Planning route..." : Object.keys(routeMetrics).length ? "Recalculate route" : "Optimize pickup route"}</button></div>
              <h3 className="form-subheading">1. Pickup details for each stall</h3>
              <div className="checkout-pickup-groups">
                {displayGroups.map((group, index) => {
                  const selection = selectionFor(group);
                  return <section className="checkout-pickup-card" key={group.key}>
                    <div className="checkout-pickup-head"><span className="checkout-group-number">{index + 1}</span><div><strong>{group.farmerName}</strong><small><MapPin size={12} /> {group.market.name || group.marketName}</small></div><strong>Rs. {group.total}</strong></div>
                    <div className="checkout-group-items">{group.items.map((item) => <span key={item.id}>{item.quantity}× {item.name}</span>)}</div>
                    {group.validDays.length > 0 && <p className="checkout-available-days"><CalendarDays size={13} /> Pickup days: {group.validDays.join(", ")}</p>}
                    <div className="market-highlight-box"><div className="m-icon"><Store size={20} /></div><div className="m-text"><strong>{group.market.name || group.marketName}</strong><p>{group.market.address || "Market pickup location"} · {group.market.timing || `${group.market.openingTime || "08:00"} – ${group.market.closingTime || "14:00"}`}</p></div></div>
                    <PickupRouteDetails market={group.market} address={currentUser.address} compact initialRoute={routeMetrics[group.key]} onRoute={(route) => setRouteMetrics((current) => ({ ...current, [group.key]: route }))} />
                    <div className="form-two-cols">
                      <div className="form-field-group"><label><CalendarDays size={15} /> Pickup Date</label><input type="date" value={selection.pickupDate} min={dateValue(new Date())} onChange={(event) => updateSelection(group.key, "pickupDate", event.target.value)} required /></div>
                      <div className="form-field-group"><label><Clock3 size={15} /> Preferred Time</label><select value={selection.pickupSlot} onChange={(event) => updateSelection(group.key, "pickupSlot", event.target.value)} required><option value="" disabled>{group.slots.length ? "Choose a pickup time" : "No pickup slots configured"}</option>{group.slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></div>
                    </div>
                  </section>;
                })}
              </div>
              <h3 className="form-subheading">2. Customer information</h3>
              <div className="form-two-cols"><div className="form-field-group"><label><User size={15} /> Full Name</label><input type="text" value={currentUser.name || ""} readOnly /></div><div className="form-field-group"><label><Phone size={15} /> Contact Phone</label><input type="tel" value={currentUser.phone || ""} placeholder="Add a phone number in your profile" readOnly required /></div></div>
              {!currentUser.phone && <p className="form-error-message">Add a contact phone number in your profile before checkout.</p>}
              <div className="form-field-group"><label><FileText size={15} /> Instructions for the farmers (Optional)</label><textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Packing requests that apply to your orders..." /></div>
              <div className="checkout-order-summary-box"><div className="summary-row-mini"><span>Separate pickup orders</span><strong>{pickupGroups.length}</strong></div><div className="summary-row-mini total-highlight"><span>Total Due Across Pickups</span><strong className="grand-total-large">Rs. {subtotal}</strong></div></div>
              <button type="submit" className="btn-confirm-order" disabled={isSubmitting || !allGroupsReady || !currentUser.phone}>{isSubmitting ? "Reserving Your Basket..." : <><CheckCircle2 size={20} /><span>Confirm {pickupGroups.length} {pickupGroups.length === 1 ? "Order" : "Orders"} (Rs. {subtotal})</span></>}</button>
              <div className="srs-guarantee-row"><span><ShieldCheck size={14} /> Zero upfront fees</span><span><CheckCircle2 size={14} /> Separate pickup tokens</span><span><Store size={14} /> Pay each farmer directly</span></div>
            </form>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
