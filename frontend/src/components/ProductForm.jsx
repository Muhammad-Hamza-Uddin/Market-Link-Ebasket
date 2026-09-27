import { useEffect, useMemo, useState } from "react";
import { ImagePlus, PackageOpen, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { categories as fallbackCategories } from "../data";
import { useStore } from "../context/StoreContext";

const units = ["kg", "gram", "piece", "dozen", "bunch", "box", "litre"];

const localDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const blankForm = {
  name: "",
  category: "vegetables",
  description: "",
  price: "",
  unit: "kg",
  quantity: "",
  availableDate: "",
  market: "",
  isAvailable: true,
};

export default function ProductForm({
  mode = "create",
  product,
  markets = [],
  onSubmit,
  onCancel,
  submitLabel,
}) {
  const { categories: liveCategories = [] } = useStore();
  const categories = liveCategories.length ? liveCategories : fallbackCategories;
  const initialValues = useMemo(() => product ? {
    name: product.name || "",
    category: product.category || "vegetables",
    description: product.description || "",
    price: product.price ?? "",
    unit: product.unit || "kg",
    quantity: product.quantity ?? product.stock ?? "",
    availableDate: localDate(product.availableDate),
    market: product.marketId || "",
    isAvailable: product.isAvailable !== false,
  } : blankForm, [product]);
  const [form, setForm] = useState(initialValues);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ? product.image : "");
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialValues);
    setImageFile(null);
    setImagePreview(product?.imageUrl ? product.image : "");
    setRemoveImage(false);
  }, [initialValues, product]);
  useEffect(() => () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);
  useEffect(() => {
    if (!form.market && markets.length === 1) setForm((current) => ({ ...current, market: markets[0].id }));
  }, [markets, form.market]);

  const change = (field) => (event) => {
    const value = field === "isAvailable" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      return setError("Upload a JPG, PNG, or WebP product image.");
    }
    if (file.size > 3 * 1024 * 1024) {
      event.target.value = "";
      return setError("Product image must be 3 MB or smaller.");
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(Boolean(product?.imageUrl));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!form.name.trim()) return setError("Product name is required.");
    if (!categories.some((category) => category.slug === form.category)) return setError("Choose a valid category.");
    if (!Number.isFinite(price) || price < 0) return setError("Price must be zero or greater.");
    if (!Number.isFinite(quantity) || quantity < 0) return setError("Quantity must be zero or greater.");
    if (!units.includes(form.unit)) return setError("Choose a valid unit.");
    if (!form.market) return setError("Choose an active market.");
    if (!form.availableDate || Number.isNaN(new Date(`${form.availableDate}T00:00:00`).getTime())) return setError("Choose a valid available date.");
    if (form.description.length > 500) return setError("Description cannot exceed 500 characters.");

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price,
        unit: form.unit,
        quantity,
        availableDate: form.availableDate,
        market: form.market,
        imageFile,
        removeImage,
        isAvailable: Boolean(form.isAvailable),
      });
      if (mode === "create") {
        setForm({ ...blankForm, market: markets.length === 1 ? markets[0].id : "" });
        setImageFile(null);
        setImagePreview("");
        setRemoveImage(false);
      }
    } catch (requestError) {
      setError(requestError.message || "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="add-product-form">
      {error && <div className="form-error-message" role="alert">{error}</div>}
      <div className="form-two-cols">
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-name`}>Product name</label>
          <input id={`${mode}-product-name`} value={form.name} onChange={change("name")} maxLength={100} required />
        </div>
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-category`}>Category</label>
          <select id={`${mode}-product-category`} value={form.category} onChange={change("category")}>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-field-group">
        <label htmlFor={`${mode}-product-description`}>Description</label>
        <textarea id={`${mode}-product-description`} rows="3" value={form.description} onChange={change("description")} maxLength={500} />
        <small>{form.description.length}/500 characters</small>
      </div>
      <div className="form-three-cols">
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-price`}>Price (Rs.)</label>
          <input id={`${mode}-product-price`} type="number" min="0" step="0.01" value={form.price} onChange={change("price")} required />
        </div>
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-unit`}>Unit</label>
          <select id={`${mode}-product-unit`} value={form.unit} onChange={change("unit")}>
            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-quantity`}>Quantity</label>
          <input id={`${mode}-product-quantity`} type="number" min="0" step="1" value={form.quantity} onChange={change("quantity")} required />
        </div>
      </div>
      <div className="form-two-cols">
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-date`}>Available date</label>
          <input id={`${mode}-product-date`} type="date" value={form.availableDate} onChange={change("availableDate")} required />
        </div>
        <div className="form-field-group">
          <label htmlFor={`${mode}-product-market`}>Market</label>
          <select id={`${mode}-product-market`} value={form.market} onChange={change("market")} required>
            <option value="">Choose an active market</option>
            {markets.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
          </select>
        </div>
      </div>
      <div className="product-image-editor">
        <div className={`product-image-preview ${imagePreview ? "has-photo" : ""}`}>
          {imagePreview ? (
            <img src={imagePreview} alt="Product preview" />
          ) : (
            <><PackageOpen size={30} aria-hidden="true" /><span>No product image selected</span></>
          )}
        </div>
        <div className="form-field-group product-image-upload-field">
          <label htmlFor={`${mode}-product-image`}><ImagePlus size={17} /> Product image</label>
          <p className="field-help">Upload a clear JPG, PNG, or WebP image up to 3 MB.</p>
          <label className="product-file-button" htmlFor={`${mode}-product-image`}>
            <Upload size={16} /> {imageFile ? "Choose a different image" : imagePreview ? "Replace image" : "Upload image"}
          </label>
          <input id={`${mode}-product-image`} className="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
          {imagePreview && (
            <button type="button" className="remove-product-image" onClick={clearImage}>
              <Trash2 size={15} /> Remove image
            </button>
          )}
        </div>
      </div>
      <label className="inline-checkbox" htmlFor={`${mode}-product-available`}>
        <input id={`${mode}-product-available`} type="checkbox" checked={form.isAvailable} onChange={change("isAvailable")} />
        Available to customers
      </label>
      <div className="form-action-row">
        <button className={mode === "create" ? "btn-primary-large" : "btn-primary"} type="submit" disabled={saving}>
          {mode === "create" ? <Plus size={18} /> : <Save size={17} />}
          {saving ? "Saving…" : (submitLabel || (mode === "create" ? "Publish to Market Stall" : "Save Changes"))}
        </button>
        {onCancel && <button className="btn-outline" type="button" onClick={onCancel} disabled={saving}><X size={16} /> Cancel</button>}
      </div>
    </form>
  );
}
