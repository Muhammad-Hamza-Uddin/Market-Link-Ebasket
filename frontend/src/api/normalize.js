import { resolveMediaUrl } from "./client";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80";

export function entityId(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || value.id || "";
}

export function normalizeProduct(product) {
  const farmer = product.farmer && typeof product.farmer === "object" ? product.farmer : null;
  const market = product.market && typeof product.market === "object" ? product.market : null;
  const image = product.imageUrl?.startsWith('/uploads/')
    ? resolveMediaUrl(product.imageUrl)
    : product.imageUrl || FALLBACK_IMAGE;
  return {
    ...product,
    id: product._id || product.id,
    stock: Number(product.quantity ?? product.stock ?? 0),
    image,
    images: [image],
    farmerId: entityId(product.farmer),
    farmer: farmer?.farmName || farmer?.name || product.farmerName || "Local Farmer",
    farmerObject: farmer,
    marketId: entityId(product.market),
    market: market?.name || product.marketName || "Local Market",
    marketObject: market,
    rating: Number(product.averageRating ?? product.rating ?? 0),
    reviewsCount: Number(product.reviewCount ?? product.reviewsCount ?? 0),
  };
}

export function normalizeFarmer(farmer) {
  return {
    ...farmer,
    id: farmer._id || farmer.id,
    name: farmer.farmName || farmer.name || "Local Farmer",
    owner: farmer.name || "",
    location: farmer.location || "Local market",
    badge: farmer.accountStatus === "pending" ? "Pending approval" : farmer.accountStatus === "suspended" ? "Suspended" : "Verified Local Producer",
    rating: Number(farmer.rating ?? 0),
    reviewsCount: Number(farmer.reviewsCount ?? 0),
    productsCount: Number(farmer.productsCount ?? 0),
    image: resolveMediaUrl(farmer.imageUrl || farmer.image || ""),
    bio: farmer.bio || "A local producer on MarketLink.",
    days: farmer.days || (farmer.operatingDays || []).map((day) => day[0].toUpperCase() + day.slice(1)).join(", ") || "Market schedule varies",
    pickupHours: farmer.pickupHours || (farmer.pickupStartTime && farmer.pickupEndTime ? `${farmer.pickupStartTime} – ${farmer.pickupEndTime}` : "See market details"),
    stall: farmer.stall || farmer.location || "Local stall",
  };
}

export function normalizeMarket(market) {
  const [longitude = 0, latitude = 0] = market.location?.coordinates || [];
  const days = (market.marketDays || []).map((day) => day[0].toUpperCase() + day.slice(1));
  return {
    ...market,
    id: market._id || market.id,
    area: market.address?.split(",")[0] || "Karachi",
    city: market.address?.split(",").pop()?.trim() || "Karachi",
    timing: market.openingTime && market.closingTime ? `${market.openingTime} – ${market.closingTime}` : "See market details",
    operatingDays: days.join(", ") || "Schedule varies",
    landmark: market.address || "",
    farmers: Number(market.farmers ?? 0),
    productsCount: Number(market.productsCount ?? 0),
    rating: Number(market.rating ?? 0),
    reviewsCount: Number(market.reviewsCount ?? 0),
    coordinates: { longitude, latitude },
    coords: { x: Math.min(92, Math.max(8, 50 + (longitude - 67.05) * 200)), y: Math.min(90, Math.max(10, 50 - (latitude - 24.85) * 200)) },
    features: ["Fresh local produce", "Direct farmer pickup"],
    image: resolveMediaUrl(market.imageUrl || market.image || "") || FALLBACK_IMAGE,
  };
}

const STATUS_LABELS = {
  pending: "Placed",
  confirmed: "Accepted",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function normalizeOrder(order) {
  const market = order.market && typeof order.market === "object" ? order.market : null;
  const customer = order.customer && typeof order.customer === "object" ? order.customer : null;
  const farmer = order.farmer && typeof order.farmer === "object" ? order.farmer : null;
  const id = order._id || order.id;
  const pickupDate = order.pickupDate ? new Date(order.pickupDate) : null;
  return {
    ...order,
    id,
    customerName: customer?.name || "Customer",
    phone: customer?.phone || "",
    market: market?.name || "Local Market",
    marketObject: market,
    farmer: farmer?.farmName || farmer?.name || "Local Farmer",
    farmerObject: farmer,
    total: Number(order.totalAmount ?? order.total ?? 0),
    status: STATUS_LABELS[order.status] || order.status,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
    pickupSlot: order.pickupSlot || (pickupDate ? pickupDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""),
    pickupToken: `PK-${String(id).slice(-8).toUpperCase()}`,
    items: (order.items || []).map((item) => ({
      ...item,
      id: item.product?._id || item.product,
      price: Number(item.unitPrice ?? item.price ?? 0),
      total: Number(item.subtotal ?? 0),
      farmer: farmer?.farmName || farmer?.name || "Local Farmer",
    })),
  };
}

export function normalizeReview(review) {
  return {
    ...review,
    id: review._id || review.id,
    productId: entityId(review.product),
    farmerId: entityId(review.farmer),
    author: review.customer?.name || review.author || "Customer",
    rating: Number(review.rating || 0),
    date: review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : (review.date || ""),
    comment: review.comment || "",
    response: review.response || "",
    verified: true,
  };
}

export function backendStatus(label) {
  return { Placed: "pending", Accepted: "confirmed", "Ready for Pickup": "ready", Completed: "completed", Cancelled: "cancelled" }[label] || label;
}
