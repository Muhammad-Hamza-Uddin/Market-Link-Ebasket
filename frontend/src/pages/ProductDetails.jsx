import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, MapPin, Plus, Minus, ShoppingCart, Star, ShieldCheck, Sparkles, Check, MessageSquarePlus, Leaf, UserRound, X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { products, addToCart, favorites, toggleFavorite, reviews, addReview, getProductReviews, currentUser, notify } = useStore();
  const product = products.find((p) => String(p.id || p._id) === String(id));

  const [qty, setQty] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (product?.id) getProductReviews(product.id).catch((error) => notify("Could not load reviews", error.message));
  }, [product?.id]);

  useEffect(() => {
    setQty(1);
    setActiveImgIndex(0);
    setIsAdded(false);
  }, [id]);

  if (!product) {
    return (
      <AnimatedPage>
        <div className="container section-padding">
          <div className="empty-cart-card">
            <h2>Product Not Found</h2>
            <p>The product you are looking for may have gone out of seasonal harvest.</p>
            <Link className="btn-primary-large" to="/products">
              Back to Market Catalogue
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const liked = favorites.some((p) => String(p.id) === String(product.id));
  const productReviews = reviews.filter((r) => String(r.productId) === String(product.id));
  const displayRating = productReviews.length ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length : 0;
  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  const relatedProducts = [
    ...products.filter((item) => String(item.id) !== String(product.id) && item.category === product.category),
    ...products.filter((item) => String(item.id) !== String(product.id) && item.category !== product.category && item.marketId === product.marketId),
  ].filter((item, index, list) => list.findIndex((candidate) => String(candidate.id) === String(item.id)) === index).slice(0, 4);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, qty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addReview({ productId: product.id, rating: newRating, comment: newComment.trim() });
      setNewComment("");
      setShowReviewModal(false);
    } catch (error) {
      notify("Review could not be submitted", error.message);
    }
  };

  return (
    <AnimatedPage>
      <section className="section-padding">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <div className="product-breadcrumb">
            <Link to="/products" className="back-nav-link">
              <ArrowLeft size={16} /> Back to Products
            </Link>
            <span className="bread-sep">/</span>
            <span className="bread-cat">{product.category}</span>
            <span className="bread-sep">/</span>
            <span className="bread-curr">{product.name}</span>
          </div>

          <div className="product-details-grid">
            {/* Left: Gallery Viewer */}
            <div className="product-gallery-side">
              <motion.div
                className="main-gallery-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={activeImgIndex}
                transition={{ duration: 0.3 }}
              >
                <img src={galleryImages[activeImgIndex]} alt={product.name} />
                <button
                  className={`gallery-fav-btn ${liked ? "liked" : ""}`}
                  onClick={() => toggleFavorite(product)}
                  aria-label="Add to favorites"
                >
                  <Heart size={22} fill={liked ? "#e11d48" : "none"} color={liked ? "#e11d48" : "#374151"} />
                </button>
                <div className="gallery-badge-row">
                  {product.organic && <span className="organic-badge"><Leaf size={14} /> 100% Organic</span>}
                  <span className="harvest-badge"><Sparkles size={14} /> {product.harvestTime || "Harvested Today"}</span>
                </div>
              </motion.div>

              {galleryImages.length > 1 && (
                <div className="gallery-thumbnails-strip">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      className={`thumbnail-btn ${activeImgIndex === idx ? "active" : ""}`}
                      onClick={() => setActiveImgIndex(idx)}
                    >
                      <img src={imgUrl} alt={`${product.name} thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & SRS Compliance Specifications */}
            <div className="product-info-side">
              <div className="meta-badge-row">
                <span className="category-pill">{product.category}</span>
                <span className="market-pill"><MapPin size={13} /> {product.market}</span>
              </div>

              <h1 className="detail-product-title">{product.name}</h1>

              {/* Rating Summary */}
              <div className="detail-rating-row">
                <div className="stars-cluster">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={17}
                      fill={s <= Math.round(displayRating) ? "#f59e0b" : "#e5e7eb"}
                      color={s <= Math.round(displayRating) ? "#f59e0b" : "#d1d5db"}
                    />
                  ))}
                </div>
                <strong className="rating-score">{productReviews.length ? displayRating.toFixed(1) : "Not rated"}</strong>
                <span className="rating-count">({productReviews.length} customer reviews)</span>
              </div>

              {/* Price & Unit Display (SRS Requirement) */}
              <div className="detail-price-box">
                <div className="price-tag-large">
                  <span className="curr">Rs.</span>
                  <strong className="amt">{product.price}</strong>
                  <span className="unit-label">/ {product.unit}</span>
                </div>
                <div className="stock-status-pill">
                  <span className="pulse-dot-green" />
                  <strong>Available: {product.stock} {product.unit}s in stock</strong>
                </div>
              </div>

              {/* Product Description */}
              <p className="detail-description">{product.description}</p>

              {/* SRS Farmer Information Specification */}
              <div className="farmer-info-card">
                <div className="farmer-avatar-box"><UserRound size={24} aria-hidden="true" /></div>
                <div className="farmer-meta-box">
                  <span className="farmer-label">Local Producer / Stall</span>
                  <Link to="/farmers" className="farmer-stall-name">
                    {product.farmer} <ArrowRight size={14} />
                  </Link>
                  <small className="farmer-pickup-note">
                    Pickup stall located at {product.market || "Local Market"}. Hand-packaged upon arrival.
                  </small>
                </div>
              </div>

              {/* Quantity Selector + Add to Cart Actions */}
              <div className="purchase-controls-row">
                <div className="detail-qty-control">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="detail-qty-number">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <motion.button
                  className={`btn-add-to-basket ${isAdded ? "added" : ""}`}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  whileTap={{ scale: 0.95 }}
                >
                  {isAdded ? (
                    <>
                      <Check size={20} />
                      <span>Added {qty} {product.unit} to Basket!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={19} />
                      <span>Add {qty > 1 ? `(${qty} ${product.unit}s)` : ""} to Cart</span>
                    </>
                  )}
                </motion.button>

                <button
                  className={`detail-heart-btn ${liked ? "liked" : ""}`}
                  onClick={() => toggleFavorite(product)}
                  title={liked ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart size={22} fill={liked ? "#e11d48" : "none"} color={liked ? "#e11d48" : "#4b5563"} />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="detail-feature-strip">
                <div className="strip-item">
                  <ShieldCheck size={16} className="strip-icon" />
                  <span>Verified Fresh by Farmer</span>
                </div>
                <div className="strip-item">
                  <MapPin size={16} className="strip-icon" />
                  <span>Direct Market Pickup</span>
                </div>
                <div className="strip-item">
                  <Sparkles size={16} className="strip-icon" />
                  <span>Zero Preservatives</span>
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section className="related-products-section" aria-labelledby="related-products-title">
              <div className="related-products-heading">
                <div><span className="eyebrow">More Fresh Picks</span><h2 id="related-products-title">Related Products</h2><p>Similar produce from this category and pickup market.</p></div>
                <Link className="related-products-link" to={`/products?category=${encodeURIComponent(product.category)}`}>View category <ArrowRight size={15} /></Link>
              </div>
              <div className="products-responsive-grid related-products-grid">
                {relatedProducts.map((item) => <ProductCard product={item} key={item.id} />)}
              </div>
            </section>
          )}

          {/* CUSTOMER REVIEWS & RATINGS SECTION */}
          <div className="product-reviews-section">
            <div className="reviews-header-bar">
              <div>
                <span className="eyebrow">Customer Feedback</span>
                <h2 className="reviews-title">Customer Reviews & Ratings</h2>
                <div className="average-rating-badge">
                  {productReviews.length ? <><Star size={16} fill="currentColor" /> <strong>{displayRating.toFixed(1)}</strong> out of 5 ({productReviews.length} ratings)</> : <strong>No ratings yet</strong>}
                </div>
              </div>

              <button className="btn-write-review" onClick={() => setShowReviewModal(true)}>
                <MessageSquarePlus size={18} /> Write a Review
              </button>
            </div>

            <div className="reviews-cards-grid">
              {productReviews.map((rev) => (
                <div className="customer-review-card" key={rev.id}>
                  <div className="rev-head">
                    <div className="rev-author-info">
                      <div className="author-avatar">{rev.author.charAt(0)}</div>
                      <div>
                        <strong>{rev.author}</strong>
                        <span className="rev-date">{rev.date}</span>
                      </div>
                    </div>
                    <div className="rev-stars" aria-label={`${rev.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={15} fill={star <= Math.round(rev.rating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="rev-body">"{rev.comment}"</p>
                  {rev.verified && (
                    <span className="verified-badge">
                      <ShieldCheck size={13} /> Verified Local Buyer
                    </span>
                  )}
                </div>
              ))}

              {productReviews.length === 0 && (
                <div className="customer-review-card">
                  <p className="rev-body">No verified reviews yet. Customers can review this product after a completed order.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WRITE A REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
            <motion.div
              className="modal-box review-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <div className="review-modal-heading">
                  <span className="review-heading-icon"><MessageSquarePlus size={20} /></span>
                  <div>
                    <span className="eyebrow">Rate & Review</span>
                    <h3>Share your harvest experience</h3>
                  </div>
                </div>
                <button className="modal-close" aria-label="Close review form" onClick={() => setShowReviewModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="review-product-summary">
                  <img src={product.image} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.farmer} · {product.market}</span>
                  </div>
                </div>

                <div className="rating-select-group">
                  <div className="rating-question-row">
                    <label>How was the product?</label>
                    <strong>{ratingLabels[newRating]}</strong>
                  </div>
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-choice ${newRating >= star ? "active" : ""}`}
                        onClick={() => setNewRating(star)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-pressed={newRating === star}
                      >
                        <Star size={25} fill={newRating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                    <span className="rating-text-label">{newRating}/5</span>
                  </div>
                </div>

                <div className="form-group review-comment-field">
                  <div className="review-field-label">
                    <label htmlFor="rev-text">Tell other customers about it</label>
                    <span>{newComment.length}/1000</span>
                  </div>
                  <textarea
                    id="rev-text"
                    rows={5}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Describe the freshness, taste, and pickup experience..."
                    maxLength={1000}
                    required
                  />
                  <small><ShieldCheck size={14} /> Reviews are available to customers with completed orders.</small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                    <Send size={16} /> Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
