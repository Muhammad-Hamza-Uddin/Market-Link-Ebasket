import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, MapPin, Clock, ArrowRight, BellRing, Sparkles, Store, Trash2, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export default function Favorites() {
  const { favorites, favoriteFarmers, toggleFavoriteFarmer, setRestockAlert } = useStore();
  const [activeTab, setActiveTab] = useState("products"); // 'products' or 'farmers'

  return (
    <AnimatedPage>
      {/* Page Hero */}
      <section className="page-hero-banner">
        <div className="container">
          <span className="eyebrow">Saved For Later</span>
          <h1 className="hero-page-title">My Favorites & Saved Stalls</h1>
          <p className="hero-page-desc">
            Quickly re-order your weekly produce, keep track of restock alerts, and follow your favorite local growers.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          {/* Tab Selector */}
          <div className="fav-tabs-bar">
            <button
              className={`fav-tab-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <span>Favorite Products</span>
              <span className="tab-counter-badge">{favorites.length}</span>
            </button>
            <button
              className={`fav-tab-btn ${activeTab === "farmers" ? "active" : ""}`}
              onClick={() => setActiveTab("farmers")}
            >
              <span>Favorite Farmers</span>
              <span className="tab-counter-badge">{favoriteFarmers.length}</span>
            </button>
          </div>

          {/* TAB 1: FAVORITE PRODUCTS */}
          {activeTab === "products" && (
            <div>
              {/* SRS Restock Alert Notice */}
              <div className="restock-alert-banner">
                <div className="alert-icon-box">
                  <BellRing size={20} />
                </div>
                <div className="alert-copy">
                  <strong>Optional Restock Alerts</strong>
                  <p>
                    Enable alerts on individual favorites to receive an in-app notification when stock changes from zero to available.
                  </p>
                </div>
              </div>

              {favorites.length > 0 ? (
                <div className="products-responsive-grid">
                  <AnimatePresence>
                    {favorites.map((product) => (
                      <div key={product.id}>
                        <ProductCard product={product} />
                        <button type="button" className="btn-outline full-width" onClick={async () => {
                          await setRestockAlert(product.id, !product.restockAlert);
                        }}>
                          <BellRing size={15} /> {product.restockAlert ? "Disable restock alert" : "Enable restock alert"}
                        </button>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="empty-cart-card">
                  <div className="empty-cart-icon">
                    <Heart size={50} color="#e11d48" />
                  </div>
                  <h2>No Favorite Products Saved Yet</h2>
                  <p>Tap the heart icon on any fresh tomato, spinach, or fruit card to save it here for fast weekly re-ordering.</p>
                  <Link className="btn-primary-large" to="/products">
                    Browse Fresh Harvest <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAVORITE FARMERS */}
          {activeTab === "farmers" && (
            <div>
              {favoriteFarmers.length > 0 ? (
                <div className="farmers-cards-grid">
                  <AnimatePresence>
                    {favoriteFarmers.map((farmer) => (
                      <motion.article
                        key={farmer.id}
                        className="farmer-card-modern"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                      >
                        <div className="farmer-card-header">
                          <div className="farmer-image-placeholder"><UserRound size={40} /><span>Photo not added</span></div>
                          {farmer.image && <img src={farmer.image} alt={farmer.name} className="farmer-cover-img" onError={(event) => event.currentTarget.remove()} />}
                          <button
                            className="farmer-fav-btn active"
                            onClick={() => toggleFavoriteFarmer(farmer)}
                            title="Remove from favorites"
                          >
                            <Trash2 size={16} color="#fff" />
                          </button>
                          <span className="farmer-badge-overlay">{farmer.badge}</span>
                        </div>

                        <div className="farmer-card-body">
                          <h2 className="farmer-name-heading">{farmer.name}</h2>
                          <div className="farmer-detail-lines">
                            <div className="detail-line">
                              <MapPin size={15} className="detail-icon" />
                              <span>{farmer.location}</span>
                            </div>
                            <div className="detail-line">
                              <Clock size={15} className="detail-icon" />
                              <span>{farmer.days} ({farmer.pickupHours})</span>
                            </div>
                            <div className="detail-line">
                              <Store size={15} className="detail-icon" />
                              <span>{farmer.stall}</span>
                            </div>
                          </div>

                          <Link to="/farmers" className="btn-view-farmer">
                            <span>Visit Stall Products</span>
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="empty-cart-card">
                  <div className="empty-cart-icon"><UserRound size={36} aria-hidden="true" /></div>
                  <h2>No Favorite Farmers Saved Yet</h2>
                  <p>Follow trusted local growers to see their weekly harvest schedules and stall locations first.</p>
                  <Link className="btn-primary-large" to="/farmers">
                    Meet Local Farmers <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </AnimatedPage>
  );
}
