import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LogOut, Save, UserRound, MapPin, Phone, Mail, Store, ShieldCheck } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, markets, updateProfile, logout, notify } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", address: "", farmName: "", location: "", preferredMarkets: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      farmName: currentUser.farmName || "",
      location: currentUser.location || "",
      preferredMarkets: (currentUser.preferredMarkets?.length ? currentUser.preferredMarkets : currentUser.preferredMarket ? [currentUser.preferredMarket] : [])
        .map((market) => String(market?._id || market?.id || market)),
    });
  }, [currentUser]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const togglePreferredMarket = (marketId) => setForm((current) => ({
    ...current,
    preferredMarkets: current.preferredMarkets.includes(String(marketId))
      ? current.preferredMarkets.filter((id) => id !== String(marketId))
      : [...current.preferredMarkets, String(marketId)],
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = currentUser.role === "customer"
        ? form
        : (({ preferredMarkets, ...farmerFields }) => farmerFields)(form);
      await updateProfile(payload);
    } catch (error) {
      notify("Profile update failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AnimatedPage>
      <section className="profile-page section-padding">
        <div className="container profile-page-grid">
          <aside className="profile-hero-card">
            <div className="profile-avatar-large"><UserRound size={42} /></div>
            <span className="eyebrow">Account Profile</span>
            <h1>{currentUser.name || "MarketLink user"}</h1>
            <p>{currentUser.email}</p>
            <span className="profile-role-chip"><ShieldCheck size={14} /> {currentUser.role}</span>
            {currentUser.role === "farmer" && <p className="profile-helper"><Store size={15} /> Manage your farm and pickup details here.</p>}
            <button type="button" className="btn-danger-outline" onClick={handleLogout}><LogOut size={17} /> Logout</button>
          </aside>

          <div className="profile-form-card">
            <div className="section-heading-row"><div><span className="eyebrow">Personal Information</span><h2>Profile Details</h2><p>Keep your MarketLink contact and pickup information up to date.</p></div></div>
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <div className="form-two-cols">
                <div className="form-field-group"><label><UserRound size={15} /> Full name</label><input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={2} /></div>
                <div className="form-field-group"><label><Mail size={15} /> Email</label><input value={currentUser.email || ""} readOnly className="input-readonly" /></div>
              </div>
              <div className="form-two-cols">
                <div className="form-field-group"><label><Phone size={15} /> Phone</label><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="0300 1234567" /></div>
                <div className="form-field-group"><label><MapPin size={15} /> Address</label><input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="House, street, area" /></div>
              </div>
              {currentUser.role === "customer" && <div className="preferred-markets-field"><div className="preferred-markets-heading"><div><label><MapPin size={15} /> Preferred pickup markets</label><p>Save multiple convenient locations. The first selected market remains your primary market.</p></div><span>{form.preferredMarkets.length} saved</span></div><div className="preferred-markets-grid">{markets.map((market) => { const selected = form.preferredMarkets.includes(String(market.id)); return <button type="button" key={market.id} className={selected ? "selected" : ""} onClick={() => togglePreferredMarket(market.id)}><span className="preferred-market-check">{selected ? <Check size={15} /> : <MapPin size={15} />}</span><span><strong>{market.name}</strong><small>{market.address || market.area}</small></span></button>; })}</div></div>}
              {currentUser.role === "farmer" && <div className="form-two-cols"><div className="form-field-group"><label><Store size={15} /> Farm / stall name</label><input value={form.farmName} onChange={(event) => update("farmName", event.target.value)} /></div><div className="form-field-group"><label><MapPin size={15} /> Farm location</label><input value={form.location} onChange={(event) => update("location", event.target.value)} /></div></div>}
              <div className="profile-actions"><button className="btn-primary-large" type="submit" disabled={saving}><Save size={18} /> {saving ? "Saving..." : "Save Profile"}</button><button className="btn-secondary" type="button" onClick={() => navigate(-1)}>Cancel</button></div>
            </form>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
