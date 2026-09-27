import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Edit3, Plus, RefreshCw, Trash2, X } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const emptyEntry = () => ({ product: "", defaultQuantity: "", defaultPrice: "", unit: "kg", active: true });
const emptyForm = () => ({ name: "", dayOfWeek: "saturday", enabled: true, entries: [emptyEntry()] });
const productId = (value) => typeof value === "string" ? value : value?._id || value?.id || "";
const overridesForDate = (template, date) => {
  const overrides = {};
  (template.overrides || []).filter((item) => String(item.date).slice(0, 10) === date).forEach((item) => {
    overrides[productId(item.product)] = { quantity: item.quantity, price: item.price ?? "" };
  });
  return overrides;
};

function nextOccurrence(dayOfWeek) {
  const target = weekdays.indexOf(dayOfWeek);
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const current = (date.getDay() + 6) % 7;
  let offset = (target - current + 7) % 7;
  if (offset === 0) offset = 7;
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validateApplyDate(value, dayOfWeek) {
  if (!value) return "Select an apply date.";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Select a valid apply date.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return "The apply date cannot be in the past.";
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  if (weekday !== dayOfWeek) return `Choose a ${dayOfWeek}.`;
  return "";
}

export default function WeeklyStock() {
  const { farmerProducts: products, refreshFarmerProducts, getWeeklyStock, saveWeeklyStock, applyWeeklyStock, deleteWeeklyStock, notify } = useStore();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyState, setApplyState] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [, loadedTemplates] = await Promise.all([refreshFarmerProducts(), getWeeklyStock()]);
      setTemplates(loadedTemplates);
      setApplyState((current) => {
        const next = { ...current };
        loadedTemplates.forEach((template) => {
          if (!next[template._id]) {
            const date = nextOccurrence(template.dayOfWeek);
            next[template._id] = { date, overrides: overridesForDate(template, date), error: "", applying: false };
          }
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError.message || "Weekly stock could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [getWeeklyStock, refreshFarmerProducts]);

  useEffect(() => { load(); }, [load]);

  const selectedMarket = useMemo(() => {
    const first = form.entries.find((entry) => entry.product);
    return products.find((product) => product.id === first?.product)?.marketId || "";
  }, [form.entries, products]);

  const updateEntry = (index, changes) => setForm((current) => ({
    ...current,
    entries: current.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...changes } : entry),
  }));

  const chooseProduct = (index, id) => {
    const product = products.find((item) => item.id === id);
    updateEntry(index, { product: id, defaultPrice: product?.price ?? "", unit: product?.unit || "kg" });
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm());
    setFormError("");
  };

  const editTemplate = (template) => {
    setEditingId(template._id);
    setForm({
      name: template.name,
      dayOfWeek: template.dayOfWeek,
      enabled: template.enabled,
      entries: template.entries.map((entry) => ({
        product: productId(entry.product),
        defaultQuantity: entry.defaultQuantity,
        defaultPrice: entry.defaultPrice,
        unit: entry.unit,
        active: entry.active !== false,
      })),
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Template name is required.");
    if (!form.entries.length) return setFormError("Add at least one product.");
    if (form.entries.some((entry) => !entry.product || Number(entry.defaultQuantity) < 0 || Number(entry.defaultPrice) < 0)) return setFormError("Every entry needs a product and non-negative quantity and price.");
    if (new Set(form.entries.map((entry) => entry.product)).size !== form.entries.length) return setFormError("A product can appear only once in a template.");
    const marketIds = new Set(form.entries.map((entry) => products.find((product) => product.id === entry.product)?.marketId));
    if (marketIds.size !== 1 || marketIds.has(undefined)) return setFormError("All template products must belong to the same active market.");

    setSaving(true);
    try {
      await saveWeeklyStock({
        name: form.name.trim(),
        market: [...marketIds][0],
        dayOfWeek: form.dayOfWeek,
        enabled: form.enabled,
        entries: form.entries.map((entry) => ({
          product: entry.product,
          defaultQuantity: Number(entry.defaultQuantity),
          defaultPrice: Number(entry.defaultPrice),
          unit: entry.unit,
          active: Boolean(entry.active),
        })),
      }, editingId || undefined);
      notify(editingId ? "Weekly stock template updated" : "Weekly stock template saved");
      resetForm();
      await load();
    } catch (requestError) {
      setFormError(requestError.message || "The template could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateApply = (templateId, changes) => setApplyState((current) => ({ ...current, [templateId]: { ...current[templateId], ...changes } }));

  const setApplyDate = (template, date) => {
    updateApply(template._id, { date, overrides: overridesForDate(template, date), error: "" });
  };

  const updateOverride = (templateId, entryId, field, value) => setApplyState((current) => ({
    ...current,
    [templateId]: {
      ...current[templateId],
      error: "",
      overrides: {
        ...(current[templateId]?.overrides || {}),
        [entryId]: { ...(current[templateId]?.overrides?.[entryId] || {}), [field]: value },
      },
    },
  }));

  const apply = async (template) => {
    const state = applyState[template._id] || {};
    const dateError = validateApplyDate(state.date, template.dayOfWeek);
    if (dateError) return updateApply(template._id, { error: dateError });
    updateApply(template._id, { applying: true, error: "" });
    try {
      const dateKey = state.date;
      const entryIds = new Set(template.entries.map((entry) => productId(entry.product)));
      const retained = (template.overrides || []).filter((item) => String(item.date).slice(0, 10) !== dateKey || !entryIds.has(productId(item.product)));
      const dateOverrides = template.entries.flatMap((entry) => {
        const id = productId(entry.product);
        const value = state.overrides?.[id];
        if (!value || ((value.quantity === "" || value.quantity === undefined) && (value.price === "" || value.price === undefined))) return [];
        return [{
          date: dateKey,
          product: id,
          quantity: value.quantity === "" || value.quantity === undefined ? entry.defaultQuantity : Number(value.quantity),
          price: value.price === "" || value.price === undefined ? entry.defaultPrice : Number(value.price),
        }];
      });
      if (dateOverrides.some((item) => item.quantity < 0 || item.price < 0)) throw new Error("Overrides cannot be negative.");
      if (dateOverrides.length || retained.length !== (template.overrides || []).length) await saveWeeklyStock({ overrides: [...retained, ...dateOverrides] }, template._id);
      await applyWeeklyStock(template._id, dateKey);
      await load();
      notify("Template applied to live inventory", `Inventory updated for ${dateKey}`);
    } catch (requestError) {
      updateApply(template._id, { error: requestError.message || "The template could not be applied." });
    } finally {
      updateApply(template._id, { applying: false });
    }
  };

  return (
    <AnimatedPage>
      <section className="section-padding">
        <div className="container">
          <Link to="/farmer/dashboard" className="back-nav-link"><ArrowLeft size={16} /> Farmer dashboard</Link>
          <div className="dash-top-header"><div><span className="eyebrow">Recurring Inventory</span><h1 className="dash-title">Weekly Stock Templates</h1><p className="dash-subtitle">Templates are copied into live inventory; customer orders never decrement recurring defaults.</p></div></div>

          {loading && <div className="dash-card weekly-state-card" role="status"><RefreshCw className="spin-icon" size={24} /><h2>Loading weekly stock…</h2></div>}
          {!loading && error && <div className="dash-card weekly-state-card error-state" role="alert"><h2>Weekly stock could not load</h2><p>{error}</p><button className="btn-primary" type="button" onClick={load}><RefreshCw size={16} /> Retry</button></div>}
          {!loading && !error && !products.length && <div className="dash-card weekly-state-card"><CalendarDays size={36} /><h2>No products available yet</h2><p>Add a product before creating a weekly stock template.</p><Link className="btn-primary" to="/farmer/dashboard?tab=add-product"><Plus size={16} /> Add Product</Link></div>}

          {!loading && !error && products.length > 0 && <div className="dash-panels-two-col weekly-stock-layout">
            <form className="dash-card profile-edit-form weekly-template-form" onSubmit={submit}>
              <div className="card-heading-row"><h3>{editingId ? "Edit recurring template" : "Create a recurring stock template"}</h3>{editingId && <button type="button" className="btn-outline btn-compact" onClick={resetForm}><X size={14} /> Cancel edit</button>}</div>
              {formError && <div className="form-error-message" role="alert">{formError}</div>}
              <div className="form-two-cols">
                <div className="form-field-group"><label htmlFor="template-name">Template name</label><input id="template-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required /></div>
                <div className="form-field-group"><label htmlFor="template-day">Market day</label><select id="template-day" value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}>{weekdays.map((day) => <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>)}</select></div>
              </div>
              <label className="inline-checkbox"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Template enabled</label>
              <div className="template-entry-list">
                {form.entries.map((entry, index) => (
                  <div className="template-entry-card" key={`${index}-${entry.product}`}>
                    <div className="card-heading-row"><strong>Product {index + 1}</strong>{form.entries.length > 1 && <button type="button" className="btn-trash-icon" aria-label={`Remove product ${index + 1}`} onClick={() => setForm((current) => ({ ...current, entries: current.entries.filter((_, entryIndex) => entryIndex !== index) }))}><Trash2 size={15} /></button>}</div>
                    <div className="form-field-group"><label>Product</label><select value={entry.product} onChange={(event) => chooseProduct(index, event.target.value)} required><option value="">Choose product</option>{products.filter((product) => !selectedMarket || product.marketId === selectedMarket || product.id === entry.product).map((product) => <option value={product.id} key={product.id}>{product.name} · {product.market}</option>)}</select></div>
                    <div className="form-three-cols">
                      <div className="form-field-group"><label>Default quantity</label><input type="number" min="0" value={entry.defaultQuantity} onChange={(event) => updateEntry(index, { defaultQuantity: event.target.value })} required /></div>
                      <div className="form-field-group"><label>Default price</label><input type="number" min="0" step="0.01" value={entry.defaultPrice} onChange={(event) => updateEntry(index, { defaultPrice: event.target.value })} required /></div>
                      <div className="form-field-group"><label>Unit</label><input value={entry.unit} readOnly /></div>
                    </div>
                    <label className="inline-checkbox"><input type="checkbox" checked={entry.active} onChange={(event) => updateEntry(index, { active: event.target.checked })} /> Active in template</label>
                  </div>
                ))}
              </div>
              <button className="btn-outline" type="button" onClick={() => setForm((current) => ({ ...current, entries: [...current.entries, emptyEntry()] }))}><Plus size={15} /> Add product to template</button>
              <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save Changes" : "Save recurring stock"}</button>
            </form>

            <div className="dash-card weekly-saved-templates">
              <div className="saved-templates-heading">
                <div>
                  <span className="eyebrow">Ready to reuse</span>
                  <h3>Saved templates</h3>
                </div>
                <span className="saved-template-count">{templates.length}</span>
              </div>
              {!templates.length && <div className="weekly-state-card"><CalendarDays size={30} /><h4>No recurring stock templates yet</h4><p>Create one using the form.</p></div>}
              <div className="dash-stock-list">
                {templates.map((template) => {
                  const state = applyState[template._id] || { date: nextOccurrence(template.dayOfWeek), overrides: {} };
                  return <article className="dash-stock-item weekly-template-card" key={template._id}>
                    <div className="stock-info">
                      <strong>{template.name}</strong>
                      <small>{template.dayOfWeek} · {template.market?.name} · {template.enabled ? "Enabled" : "Disabled"}</small>
                      <ul className="template-products-summary">
                        {template.entries.map((entry) => <li key={entry._id || productId(entry.product)}><span>{entry.product?.name || "Product"}</span><strong>{entry.defaultQuantity} {entry.unit} · Rs. {entry.defaultPrice}</strong>{entry.active === false && <em>Inactive</em>}</li>)}
                      </ul>
                      <div className="apply-panel">
                        <label>Apply date ({template.dayOfWeek})<input type="date" value={state.date || ""} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setApplyDate(template, event.target.value)} /></label>
                        <p className="field-help">Optional per-date overrides affect only this date.</p>
                        {template.entries.filter((entry) => entry.active !== false).map((entry) => {
                          const id = productId(entry.product);
                          const override = state.overrides?.[id] || {};
                          return <div className="override-row" key={id}><span>{entry.product?.name}</span><input aria-label={`${entry.product?.name} quantity override`} type="number" min="0" placeholder={`${entry.defaultQuantity} ${entry.unit}`} value={override.quantity ?? ""} onChange={(event) => updateOverride(template._id, id, "quantity", event.target.value)} /><input aria-label={`${entry.product?.name} price override`} type="number" min="0" step="0.01" placeholder={`Rs. ${entry.defaultPrice}`} value={override.price ?? ""} onChange={(event) => updateOverride(template._id, id, "price", event.target.value)} /></div>;
                        })}
                        {state.error && <div className="form-error-message" role="alert">{state.error}</div>}
                      </div>
                    </div>
                    <div className="stock-level-pill template-actions">
                      <button className="btn-outline btn-compact" type="button" onClick={() => editTemplate(template)}><Edit3 size={14} /> Edit</button>
                      <button className="btn-outline btn-compact" type="button" onClick={async () => { try { await saveWeeklyStock({ enabled: !template.enabled }, template._id); await load(); notify(template.enabled ? "Template disabled" : "Template enabled"); } catch (requestError) { notify("Could not update template", requestError.message); } }}>{template.enabled ? "Disable" : "Enable"}</button>
                      <button className="btn-primary btn-compact" type="button" disabled={!template.enabled || state.applying} onClick={() => apply(template)}><RefreshCw size={14} /> {state.applying ? "Applying…" : "Apply"}</button>
                      <button className="btn-trash-icon" type="button" aria-label={`Delete ${template.name}`} onClick={async () => { if (!window.confirm(`Delete “${template.name}”? This does not change live product inventory.`)) return; try { await deleteWeeklyStock(template._id); await load(); notify("Weekly stock template deleted"); } catch (requestError) { notify("Could not delete template", requestError.message); } }}><Trash2 size={14} /></button>
                    </div>
                  </article>;
                })}
              </div>
            </div>
          </div>}
        </div>
      </section>
    </AnimatedPage>
  );
}
