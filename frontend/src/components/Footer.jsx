import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <img className="footer-brand-image" src="/marketlink-logo-2-transparent.png" alt="MarketLink — Farm Fresh Pre-Order" />
          </div>
          <p>Connecting local farmers with customers through fresh, predictable and convenient market shopping.</p>
        </div>
        <div><h4>Explore</h4><Link to="/products">Products</Link><Link to="/farmers">Farmers</Link><Link to="/markets">Markets</Link><Link to="/favorites">Favorites</Link></div>
        <div><h4>Support</h4><Link to="/about">About Us</Link><Link to="/contact">Contact Us</Link><Link to="/orders">My Orders</Link></div>
        <div><h4>Contact</h4><p><MapPin size={15}/> Local Farmers Market</p><p><Mail size={15}/> hello@marketlink.local</p></div>
      </div>
      <div className="footer-bottom">© 2026 MarketLink. Built for the eGreen Basket project.</div>
    </footer>
  );
}
