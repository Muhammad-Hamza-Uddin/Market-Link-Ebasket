import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, ArrowRight, Clock, Sprout, Store, Heart, Check, ShoppingCart, X, Phone, Mail, Award, ShieldCheck, Carrot, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function Farmers() {
  const { farmers, products, addToCart, favoriteFarmers, toggleFavoriteFarmer, reviews } = useStore();
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [addedItemMap, setAddedItemMap] = useState({});

  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
    }, 900);
  };

  return (
    <AnimatedPage>
      {/* Page Hero */}
      <section className="page-hero-banner">
        <div className="container">
          <span className="eyebrow">Local Producers</span>
          <h1 className="hero-page-title">Meet Our Local Farmers</h1>
          <p className="hero-page-desc">
            Directly connect with the growers, artisans, and dairy families bringing fresh organic harvests to your neighborhood markets.
          </p>
        </div>
      </section>

      {/* Farmers Grid */}
      <section className="section-padding">
        <div className="container">
          <div className="farmers-cards-grid">
            {farmers.map((farmer) => {
              const isFav = favoriteFarmers.some((f) => f.id === farmer.id);
              return (
                <motion.article
                  className="farmer-card-modern"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  key={farmer.id}
                >
                  <div className="farmer-card-header">
                    <div className="farmer-image-placeholder"><UserRound size={40} /><span>Photo not added</span></div>
                    {farmer.image && <img src={farmer.image} alt={farmer.name} className="farmer-cover-img" onError={(event) => event.currentTarget.remove()} />}
                    <button
                      className={`farmer-fav-btn ${isFav ? "active" : ""}`}
                      onClick={() => toggleFavoriteFarmer(farmer)}
                      title={isFav ? "Remove from favorite farmers" : "Favorite this farmer"}
                    >
                      <Heart size={18} fill={isFav ? "#e11d48" : "none"} color={isFav ? "#e11d48" : "#fff"} />
                    </button>
                    <span className="farmer-badge-overlay">{farmer.badge}</span>
                  </div>

                  <div className="farmer-card-body">
                    <div className="farmer-rating-chip">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      {farmer.reviewsCount ? <><strong>{farmer.rating.toFixed(1)}</strong><span>({farmer.reviewsCount})</span></> : <span>No ratings yet</span>}
                    </div>

                    <h2 className="farmer-name-heading">{farmer.name}</h2>

                    <div className="farmer-detail-lines">
                      <div className="detail-line">
                        <MapPin size={15} className="detail-icon" />
                        <span>{farmer.location}</span>
                      </div>
                      <div className="detail-line">
                        <Clock size={15} className="detail-icon" />
                        <span>{farmer.days}</span>
                      </div>
                      <div className="detail-line">
                        <span className="carrot-emoji"><Carrot size={18} aria-hidden="true" /></span>
                        <span>{farmer.productsCount} Products</span>
                      </div>
                    </div>

                    <button
                      className="btn-view-farmer"
                      onClick={() => setSelectedFarmer(farmer)}
                    >
                      <span>View Farmer</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* DETAILED FARMER PROFILE MODAL / VIEW */}
      <AnimatePresence>
        {selectedFarmer && (
          <div className="modal-backdrop" onClick={() => setSelectedFarmer(null)}>
            <motion.div
              className="farmer-profile-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.28 }}
            >
              <button className="modal-close-icon" onClick={() => setSelectedFarmer(null)}>
                <X size={20} />
              </button>

              <div className="profile-banner-top">
                <div className="farmer-image-placeholder profile-image-placeholder"><UserRound size={46} /><span>Photo not added</span></div>
                {selectedFarmer.image && <img src={selectedFarmer.image} alt={selectedFarmer.name} className="profile-hero-image" onError={(event) => event.currentTarget.remove()} />}
                <div className="profile-hero-badge">
                  <Award size={16} /> {selectedFarmer.experience}
                </div>
              </div>

              <div className="profile-modal-content">
                <div className="profile-title-row">
                  <div>
                    <span className="eyebrow">{selectedFarmer.city} • Verified Farm Stall</span>
                    <h2>{selectedFarmer.name}</h2>
                    <p className="owner-title">Managed by: <strong>{selectedFarmer.owner}</strong></p>
                  </div>
                  <div className="profile-rating-score">
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    {selectedFarmer.reviewsCount ? <><strong>{selectedFarmer.rating.toFixed(1)}</strong><small>({selectedFarmer.reviewsCount} reviews)</small></> : <small>No ratings yet</small>}
                  </div>
                </div>

                {/* SRS Stall & Operational Specifications */}
                <div className="stall-spec-grid">
                  <div className="stall-box">
                    <Store size={18} className="stall-icon" />
                    <div>
                      <small>Market Stall</small>
                      <strong>{selectedFarmer.stall}</strong>
                    </div>
                  </div>

                  <div className="stall-box">
                    <MapPin size={18} className="stall-icon" />
                    <div>
                      <small>Market Location</small>
                      <strong>{selectedFarmer.location}</strong>
                    </div>
                  </div>

                  <div className="stall-box">
                    <Clock size={18} className="stall-icon" />
                    <div>
                      <small>Operating Days</small>
                      <strong>{selectedFarmer.days}</strong>
                    </div>
                  </div>

                  <div className="stall-box">
                    <Clock size={18} className="stall-icon" />
                    <div>
                      <small>Pickup Timings</small>
                      <strong>{selectedFarmer.pickupHours}</strong>
                    </div>
                  </div>
                </div>

                <div className="profile-bio-box">
                  <h4>About The Farm</h4>
                  <p>{selectedFarmer.bio}</p>
                  <div className="farmer-contact-pills">
                    {selectedFarmer.phone && (
                      <a href={`tel:${selectedFarmer.phone}`} aria-label={`Call ${selectedFarmer.name}`}>
                        <Phone size={14} /> {selectedFarmer.phone}
                      </a>
                    )}
                    {selectedFarmer.email && (
                      <a href={`mailto:${selectedFarmer.email}`} aria-label={`Email ${selectedFarmer.name}`}>
                        <Mail size={14} /> {selectedFarmer.email}
                      </a>
                    )}
                    {!selectedFarmer.phone && !selectedFarmer.email && <span>Contact details are not available yet.</span>}
                  </div>
                </div>

                {/* Farmer's Available Products */}
                <div className="profile-products-section">
                  <div className="section-mini-head">
                    <h3>Fresh Harvest Products ({products.filter(p => p.farmerId === selectedFarmer.id).length})</h3>
                    <small>Reserve ahead for morning pickup</small>
                  </div>

                  <div className="farmer-products-list">
                    {products
                      .filter((p) => p.farmerId === selectedFarmer.id || p.farmer === selectedFarmer.name)
                      .map((prod) => {
                        const isAdded = addedItemMap[prod.id];
                        return (
                          <div className="farmer-product-row" key={prod.id}>
                            <img src={prod.image} alt={prod.name} className="prod-mini-img" />
                            <div className="prod-mini-info">
                              <Link to={`/products/${prod.id}`} className="prod-mini-title">
                                {prod.name}
                              </Link>
                              <div className="prod-mini-price">
                                <strong>Rs. {prod.price}</strong> / {prod.unit}
                                <span className="stock-count">({prod.stock} in stock)</span>
                              </div>
                            </div>

                            <motion.button
                              className={`btn-quick-add ${isAdded ? "added" : ""}`}
                              onClick={() => handleQuickAdd(prod)}
                              whileTap={{ scale: 0.92 }}
                            >
                              {isAdded ? (
                                <>
                                  <Check size={14} /> Added
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={14} /> Add to Cart
                                </>
                              )}
                            </motion.button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Farmer Reviews */}
                <div className="profile-reviews-section">
                  <div className="section-mini-head">
                    <h3>Recent Customer Reviews</h3>
                    <small>Verified market buyers</small>
                  </div>

                  <div className="farmer-reviews-container">
                    {reviews
                      .filter((r) => r.farmerId === selectedFarmer.id)
                      .slice(0, 2)
                      .map((rev) => (
                        <div className="farmer-review-bubble" key={rev.id}>
                          <div className="rev-head-mini">
                            <strong>{rev.author}</strong>
                            <span className="stars-mini">{"★".repeat(Math.round(rev.rating))}</span>
                          </div>
                          <p>"{rev.comment}"</p>
                          <span className="verified-pill">
                            <ShieldCheck size={12} /> Verified Pickup
                          </span>
                        </div>
                      ))}
                    {reviews.filter((r) => r.farmerId === selectedFarmer.id).length === 0 && (
                      <div className="farmer-review-bubble">
                        <div className="rev-head-mini">
                          <strong>Hamza M.</strong>
                          <span className="stars-mini">★★★★★</span>
                        </div>
                        <p>"Always fresh produce and very polite behavior at the stall. Quality is consistently high."</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
