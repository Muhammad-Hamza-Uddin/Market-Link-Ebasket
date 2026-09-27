import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBasket, Trash2, ShieldCheck, Clock, MapPin, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function Cart() {
  const { cart, subtotal, updateQuantity, removeFromCart, clearCart } = useStore();

  if (!cart.length) {
    return (
      <AnimatedPage>
        <section className="section-padding">
          <div className="container">
            <div className="empty-cart-card">
              <div className="empty-cart-icon">
                <ShoppingBasket size={54} />
              </div>
              <h2>Your Basket is Currently Empty</h2>
              <p>
                You haven't reserved any fresh farm produce yet. Explore our local farmers' harvest and add your weekly groceries to your basket!
              </p>
              <div className="empty-cart-actions">
                <Link className="btn-primary-large" to="/products">
                  <span>Explore Fresh Products</span>
                  <ArrowRight size={18} />
                </Link>
                <Link className="btn-secondary-large" to="/markets">
                  <MapPin size={18} />
                  <span>Check Nearby Markets</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedPage>
    );
  }

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const pickupGroups = new Set(cart.map((item) => `${item.farmerId}:${item.marketId}`)).size;

  return (
    <AnimatedPage>
      <section className="section-padding">
        <div className="container">
          <div className="cart-page-header">
            <div>
              <span className="eyebrow">eGreen Basket</span>
              <h1 className="page-title">Review Your Pre-Order Basket</h1>
              <p className="page-subtitle">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} reserved from local farmers. You will inspect and pay at pickup.
              </p>
            </div>
            <button className="clear-cart-btn" onClick={clearCart} title="Clear entire basket">
              <Trash2 size={16} /> Clear Basket
            </button>
          </div>

          <div className="cart-layout-grid">
            {/* Cart Table Container */}
            <div className="cart-table-wrapper">
              <div className="cart-table">
                {/* Table Header */}
                <div className="cart-table-header">
                  <div className="col-product">Product</div>
                  <div className="col-price">Price</div>
                  <div className="col-qty">Quantity</div>
                  <div className="col-total">Total</div>
                  <div className="col-action"></div>
                </div>

                {/* Table Body */}
                <div className="cart-table-body">
                  <AnimatePresence>
                    {cart.map((item) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="cart-table-row"
                          key={item.id}
                        >
                          {/* Product Info */}
                          <div className="col-product product-info-cell">
                            <Link to={`/products/${item.id}`} className="cart-item-thumb">
                              <img src={item.image} alt={item.name} />
                            </Link>
                            <div className="cart-item-meta">
                              <span className="cart-item-cat">{item.category}</span>
                              <Link to={`/products/${item.id}`} className="cart-item-name">
                                {item.name}
                              </Link>
                              <span className="cart-item-farmer">
                                <Store size={12} /> {item.farmer}
                              </span>
                              <span className="cart-item-market"><MapPin size={12} /> {item.market}</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-price price-cell">
                            <span className="mobile-col-label">Price: </span>
                            <strong>Rs. {item.price}</strong>
                            <span className="per-unit">/{item.unit}</span>
                          </div>

                          {/* Quantity Selector */}
                          <div className="col-qty qty-cell">
                            <span className="mobile-col-label">Quantity: </span>
                            <div className="cart-qty-ctrl">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="qty-val">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= (item.stock || 99)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="col-total total-cell">
                            <span className="mobile-col-label">Total: </span>
                            <strong className="line-total-amt">Rs. {itemTotal}</strong>
                          </div>

                          {/* Delete Action */}
                          <div className="col-action action-cell">
                            <button
                              className="cart-remove-btn"
                              onClick={() => removeFromCart(item.id)}
                              aria-label={`Remove ${item.name}`}
                              title="Remove item"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Continue Shopping Link */}
              <div className="cart-bottom-actions">
                <Link className="btn-continue-shopping" to="/products">
                  <ArrowLeft size={16} />
                  <span>Continue Shopping</span>
                </Link>
                <span className="cart-guarantee-note">
                  <ShieldCheck size={16} /> 100% Guaranteed Fresh Produce
                </span>
              </div>
            </div>

            {/* Cart Summary & Pre-Order Checkout Panel */}
            <aside className="cart-summary-sidebar">
              <div className="summary-card-inner">
                <h3 className="summary-title">Order Summary</h3>

                <div className="summary-line">
                  <span>Selected Products</span>
                  <span>{cart.length} varieties</span>
                </div>

                <div className="summary-line">
                  <span>Total Quantity</span>
                  <span>{totalItemsCount} units</span>
                </div>

                <div className="summary-line">
                  <span>Pickup Orders</span>
                  <span>{pickupGroups} {pickupGroups === 1 ? "stall" : "stalls"}</span>
                </div>

                <div className="summary-line highlight-line">
                  <span>Subtotal</span>
                  <strong className="summary-subtotal">Rs. {subtotal}</strong>
                </div>

                <div className="summary-line">
                  <span>Pre-Order Reservation Fee</span>
                  <span className="free-tag">FREE (Rs. 0)</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-line final-total-row">
                  <div>
                    <strong>Total Amount</strong>
                    <small className="block-muted">Pay at pickup point</small>
                  </div>
                  <strong className="grand-total">Rs. {subtotal}</strong>
                </div>

                <Link className="btn-proceed-preorder" to="/checkout">
                  <span>Proceed to Pre-Order</span>
                  <ArrowRight size={18} />
                </Link>

                <div className="srs-pickup-notice">
                  <div className="notice-icon">
                    <Clock size={16} />
                  </div>
                  <div className="notice-copy">
                    <strong>SRS Pre-Order Protocol</strong>
                    <p>
                      No online payment needed. Your fresh items are reserved directly with the local farmer. You will inspect quality and settle payment in person at the pickup stall.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
