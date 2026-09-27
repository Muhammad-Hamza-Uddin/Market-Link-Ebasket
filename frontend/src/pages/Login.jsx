import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Hand } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, notify } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login({ email, password });
      notify("Welcome back!", `Logged in as ${user.role}`);
      navigate(user.role === "farmer" ? (user.accountStatus === "pending" ? "/farmer/pending" : "/farmer/dashboard") : user.role === "admin" ? "/admin/dashboard" : "/products");
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in");
      notify("Sign in failed", requestError.message);
    }
  };

  return (
    <AnimatedPage>
      <section className="auth-split-screen">
        {/* Left Visual Column */}
        <div className="auth-visual-column">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85"
            alt="MarketLink organic farm produce"
            className="auth-bg-img"
          />
          <div className="auth-visual-overlay" />

          <div className="auth-visual-content">
            <div className="auth-brand-pill">
              <img className="auth-brand-logo" src="/marketlink-logo-2-transparent.png" alt="MarketLink — Farm Fresh Pre-Order" />
            </div>

            <h2 className="auth-visual-heading">
              Fresh From Local Farmers, <br />
              <em>Straight To Your Basket.</em>
            </h2>

            <p className="auth-visual-text">
              Reserve weekly organic harvests, discover nearby farmers markets, and enjoy zero-waste pre-orders directly with verified growers.
            </p>

            <div className="auth-trust-badges">
              <div className="auth-badge-item">
                <CheckCircle2 size={16} />
                <span>Zero Pre-Payment Fees</span>
              </div>
              <div className="auth-badge-item">
                <ShieldCheck size={16} />
                <span>Verified Local Stalls</span>
              </div>
              <div className="auth-badge-item">
                <Sparkles size={16} />
                <span>Same-Day Harvest</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="auth-form-column">
          <div className="auth-card-wrapper">
            <div className="auth-header">
              <span className="eyebrow">Account Access</span>
              <h1 className="auth-title">Welcome Back <Hand size={27} aria-hidden="true" /></h1>
              <p className="auth-subtitle">
                Sign in to manage your pre-order basket, favorites, or farm stall dashboard.
              </p>
            </div>

            {error && <div className="form-error-message" role="alert">{error}</div>}

            <form onSubmit={handleLogin} className="auth-main-form">
              <div className="form-field-group">
                <label>
                  <Mail size={15} /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@marketlink.pk"
                  required
                />
              </div>

              <div className="form-field-group">
                <div className="field-label-between">
                  <label>
                    <Lock size={15} /> Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-primary-large full-width">
                <span>Sign In</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer-link">
              <span>Don't have an account yet? </span>
              <Link to="/register" className="highlight-link">
                Register Here
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
