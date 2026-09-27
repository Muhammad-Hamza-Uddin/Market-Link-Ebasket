import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BellRing, Edit3, Megaphone, X } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { ErrorState, LoadingState } from "../components/ui";
import { useStore } from "../context/StoreContext";

export default function AdminAnnouncements() {
  const { adminListAnnouncements, adminCreateAnnouncement, adminUpdateAnnouncement, adminBroadcastNotification, notify } = useStore();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", audience: "all", publishAt: "", expiresAt: "" });
  const [editingId, setEditingId] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const announcements = await adminListAnnouncements();
      setItems(Array.isArray(announcements) ? announcements : []);
    } catch (requestError) {
      const message = requestError.message || "Announcements could not be loaded.";
      setError(message);
      notify("Could not load announcements", message, "error");
    } finally {
      setLoading(false);
    }
  }, [adminListAnnouncements, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        publishAt: form.publishAt || new Date().toISOString(),
        expiresAt: form.expiresAt || null,
        active: true,
      };
      if (editingId) await adminUpdateAnnouncement(editingId, payload);
      else {
        await adminCreateAnnouncement(payload);
        if (sendNotification) await adminBroadcastNotification({ title: form.title, message: form.message, audience: form.audience });
      }
      setForm({ title: "", message: "", audience: "all", publishAt: "", expiresAt: "" });
      setEditingId("");
      setSendNotification(true);
      await load();
      notify(editingId ? "Announcement updated" : "Announcement published");
    } catch (error) { notify("Could not save announcement", error.message); }
  };

  const edit = (item) => {
    const localInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";
    setEditingId(item._id);
    setForm({ title: item.title, message: item.message, audience: item.audience, publishAt: localInput(item.publishAt), expiresAt: localInput(item.expiresAt) });
  };

  return <AnimatedPage><section className="section-padding"><div className="container">
    <Link to="/admin/dashboard" className="back-nav-link"><ArrowLeft size={16} /> Admin dashboard</Link>
    <div className="dash-top-header"><div><span className="eyebrow">Platform Communication</span><h1 className="dash-title">Announcements</h1><p className="dash-subtitle">Publish database-backed notices to customers, farmers, or everyone.</p></div></div>
    {loading ? <LoadingState title="Loading announcements…" /> : error ? <ErrorState title="Announcements could not load" description={error} onRetry={load} /> : <div className="dash-panels-two-col">
      <form className="dash-card profile-edit-form" onSubmit={submit}>
        <div className="card-heading-row"><h3><Megaphone size={18} /> {editingId ? "Edit announcement" : "New announcement"}</h3>{editingId && <button type="button" className="btn-outline btn-compact" onClick={() => { setEditingId(""); setForm({ title: "", message: "", audience: "all", publishAt: "", expiresAt: "" }); }}><X size={14} /> Cancel</button>}</div>
        <div className="form-field-group"><label htmlFor="announcement-title">Title</label><input id="announcement-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="form-field-group"><label htmlFor="announcement-message">Message</label><textarea id="announcement-message" rows="4" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
        <div className="form-field-group"><label htmlFor="announcement-audience">Audience</label><select id="announcement-audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="all">Everyone</option><option value="customer">Customers</option><option value="farmer">Farmers</option></select></div>
        <div className="form-two-cols"><div className="form-field-group"><label htmlFor="announcement-publish">Publish date (optional)</label><input id="announcement-publish" type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} /></div><div className="form-field-group"><label htmlFor="announcement-expiry">Expiry (optional)</label><input id="announcement-expiry" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div></div>
        {!editingId && <label className="inline-checkbox"><input type="checkbox" checked={sendNotification} onChange={(event) => setSendNotification(event.target.checked)} /><BellRing size={16} /> Also send this as an in-app notification</label>}
        <button type="submit" className="btn-primary">{editingId ? "Save changes" : "Publish announcement"}</button>
      </form>
      <div className="dash-card"><h3>Announcement history</h3><div className="dash-stock-list">
        {items.map((item) => <div className="dash-stock-item" key={item._id}><div className="stock-info"><strong>{item.title}</strong><small>{item.audience} · {item.active ? "Active" : "Archived"} · Publishes {new Date(item.publishAt).toLocaleString()}{item.expiresAt ? ` · Expires ${new Date(item.expiresAt).toLocaleString()}` : ""}</small><p>{item.message}</p></div><div className="table-action-group"><button type="button" className="btn-outline btn-compact" onClick={() => edit(item)}><Edit3 size={14} /> Edit</button><button type="button" className="btn-outline btn-compact" onClick={async () => { await adminUpdateAnnouncement(item._id, { active: !item.active }); load(); }}>{item.active ? "Archive" : "Reactivate"}</button></div></div>)}
        {!items.length && <p>No announcements created yet.</p>}
      </div></div>
    </div>}
  </div></section></AnimatedPage>;
}
