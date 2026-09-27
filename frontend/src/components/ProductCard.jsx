import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "../context/StoreContext";

export default function ProductCard({ product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const [isAdded, setIsAdded] = useState(false);
  const liked = favorites.some((item) => item.id === product.id);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 900);
  };

  const handleToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`} className="image-link" aria-label={`View ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="product-img"
          />
        </Link>

        {/* Favorite Heart Button */}
        <motion.button
          className={`favorite-btn ${liked ? "liked" : ""}`}
          onClick={handleToggleFav}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.12 }}
        >
          <motion.div animate={{ scale: liked ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.3 }}>
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </motion.div>
        </motion.button>

        {/* Stock Badge */}
        <div className={`stock-badge ${product.stock <= 5 ? "low-stock" : ""}`}>
          <span className="stock-dot" />
          <span>Available: {product.stock} {product.unit}</span>
        </div>

        {product.harvestTime && (
          <div className="fresh-pill">
            <Sparkles size={11} /> Fresh Harvest
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-meta-top">
          <span className="category-pill">{product.category}</span>
          <div className="rating-pill">
            <Star size={13} fill="currentColor" />
            <span>{product.reviewsCount ? `${product.rating.toFixed(1)} (${product.reviewsCount})` : "No ratings yet"}</span>
          </div>
        </div>

        <Link to={`/products/${product.id}`} className="product-title-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>

        <p className="product-farmer">
          By <span>{product.farmer}</span>
        </p>
        <p className="product-market">Pickup at <span>{product.market}</span></p>

        <div className="product-bottom-bar">
          <div className="price-tag">
            <span className="currency">Rs.</span>
            <strong className="amount">{product.price}</strong>
            <span className="unit">/ {product.unit}</span>
          </div>

          <motion.button
            className={`add-cart-btn ${isAdded ? "added" : ""} ${product.stock <= 0 ? "disabled" : ""}`}
            onClick={handleAdd}
            disabled={product.stock <= 0}
            whileTap={{ scale: 0.92 }}
          >
            {isAdded ? (
              <motion.span
                className="btn-inner"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Check size={16} /> Added!
              </motion.span>
            ) : (
              <span className="btn-inner">
                <ShoppingCart size={15} /> Add to Cart
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}