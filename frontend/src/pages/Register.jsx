import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Store, Mail, Lock, Phone, MapPin, FileText, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";


export default function Register() {
  const navigate = useNavigate();
  const { register, notify, markets } = useStore();
  const [role, setRole] = useState("customer"); // 'customer' or 'farmer'

  // Customer fields
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [custPreferredMarket, setCustPreferredMarket] = useState("");

  // Farmer fields
  const [farmerName, setFarmerName] = useState("");
  const [farmTitle, setFarmTitle] = useState("");
  const [farmerMarket, setFarmerMarket] = useState("");
  const [farmerCnic, setFarmerCnic] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [farmerAddress, setFarmerAddress] = useState("");
  const [farmerEmail, setFarmerEmail] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const selectedFarmerMarket = markets.find((market) => String(market.id) === String(farmerMarket));
      const user = role === "farmer"
        ? await register("farmer", { name: farmerName, email: farmerEmail, password: farmerPassword, phone: farmerPhone, address: farmerAddress, farmName: farmTitle, location: selectedFarmerMarket?.name || farmerMarket, registrationNumber: farmerCnic })
        : await register("customer", { name: custName, email: custEmail, password: custPassword, phone: custPhone, address: custAddress, preferredMarket: custPreferredMarket || undefined });
      notify("Account created!", role === "farmer" ? "Your farmer account is awaiting admin approval" : "Welcome to MarketLink");
      navigate(user.role === "farmer" ? (user.accountStatus === "pending" ? "/farmer/pending" : "/farmer/dashboard") : "/products");
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account");
      notify("Registration failed", requestError.message);
    }
  };

  return (
    <AnimatedPage>
      <section className="auth-split-screen">
        {/* Left Visual Column */}
        <div className="auth-visual-column">
          <img
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=85"
            alt="Local farm community"
            className="auth-bg-img"
          />
          <div className="auth-visual-overlay" />

          <div className="auth-visual-content">
            <div className="auth-brand-pill">
              <img className="auth-brand-logo" src="/marketlink-logo-2-transparent.png" alt="MarketLink — Farm Fresh Pre-Order" />
            </div>

            <h2 className="auth-visual-heading">
              Support Local Growers. <br />
              <em>Eat Fresher Daily.</em>
            </h2>

            <p className="auth-visual-text">
              Whether you are an organic farmer seeking direct community market buyers or a family wanting seasonal crisp produce, MarketLink connects you directly.
            </p>

            <div className="auth-trust-badges">
              <div className="auth-badge-item">
                <CheckCircle2 size={16} />
                <span>Transparent Fair Pricing</span>
              </div>
              <div className="auth-badge-item">
                <ShieldCheck size={16} />
                <span>Verified Agro Sellers</span>
              </div>
              <div className="auth-badge-item">
                <Sparkles size={16} />
                <span>Zero Middlemen Commission</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="auth-form-column">
          <div className="auth-card-wrapper">
            <div className="auth-header">
              <span className="eyebrow">eGreen Basket Registration</span>
              <h1 className="auth-title">Create Your Account</h1>
              <p className="auth-subtitle">
                Select your account type to register according to SRS specifications.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="role-toggle-bar">
              <button
                type="button"
                className={`role-tab ${role === "customer" ? "active" : ""}`}
                onClick={() => setRole("customer")}
              >
                <User size={16} />
                <span>Customer Account</span>
              </button>
              <button
                type="button"
                className={`role-tab ${role === "farmer" ? "active" : ""}`}
                onClick={() => setRole("farmer")}
              >
                <Store size={16} />
                <span>Farmer / Producer</span>
              </button>
            </div>

            {error && <div className="form-error-message" role="alert">{error}</div>}

            <form onSubmit={handleRegister} className="auth-main-form">
              {/* CUSTOMER REGISTRATION FIELDS */}
              {role === "customer" && (
                <>
                  <div className="form-two-cols">
                    <div className="form-field-group">
                      <label>
                        <User size={15} /> Full Name
                      </label>
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. Muhammad Hamza"
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label>
                        <Phone size={15} /> Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label>
                      <MapPin size={15} /> Home / Pickup Address
                    </label>
                    <input
                      type="text"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="House, street, area, Karachi"
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label>
                      <Mail size={15} /> Email Address
                    </label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="hamza@example.com"
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label>
                      <MapPin size={15} /> Preferred Pickup Market Hub
                    </label>
                    <select
                      value={custPreferredMarket}
                      onChange={(e) => setCustPreferredMarket(e.target.value)}
                      className="custom-select"
                    >
                      <option value="">Choose a pickup market</option>
                      {markets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.area})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label>
                      <Lock size={15} /> Password
                    </label>
                    <input
                      type="password"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      placeholder="Create a secure password"
                      required
                    />
                  </div>
                </>
              )}

              {/* FARMER REGISTRATION FIELDS (SRS REQUIREMENTS) */}
              {role === "farmer" && (
                <>
                  <div className="form-two-cols">
                    <div className="form-field-group">
                      <label>
                        <User size={15} /> Farmer / Contact Name
                      </label>
                      <input
                        type="text"
                        value={farmerName}
                        onChange={(e) => setFarmerName(e.target.value)}
                        placeholder="e.g. Riaz Ahmed"
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label>
                        <Store size={15} /> Farm / Stall Name
                      </label>
                      <input
                        type="text"
                        value={farmTitle}
                        onChange={(e) => setFarmTitle(e.target.value)}
                        placeholder="e.g. Green Valley Farm"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-two-cols">
                    <div className="form-field-group">
                      <label>
                        <MapPin size={15} /> Assigned Market
                      </label>
                      <select
                        value={farmerMarket}
                        onChange={(e) => setFarmerMarket(e.target.value)}
                        className="custom-select"
                      >
                        <option value="">Choose an assigned market</option>
                      {markets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label>
                        <FileText size={15} /> CNIC / Stall Reg #
                      </label>
                      <input
                        type="text"
                        value={farmerCnic}
                        onChange={(e) => setFarmerCnic(e.target.value)}
                        placeholder="42101-XXXXXXX-X"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label>
                      <MapPin size={15} /> Farm / Contact Address
                    </label>
                    <input
                      type="text"
                      value={farmerAddress}
                      onChange={(e) => setFarmerAddress(e.target.value)}
                      placeholder="Farm or stall address"
                      required
                    />
                  </div>

                  <div className="form-two-cols">
                    <div className="form-field-group">
                      <label>
                        <Phone size={15} /> Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label>
                        <Mail size={15} /> Email
                      </label>
                      <input
                        type="email"
                        value={farmerEmail}
                        onChange={(e) => setFarmerEmail(e.target.value)}
                        placeholder="farmer@domain.pk"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label>
                      <Lock size={15} /> Password
                    </label>
                    <input
                      type="password"
                      value={farmerPassword}
                      onChange={(e) => setFarmerPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-primary-large full-width">
                <span>Complete {role === "farmer" ? "Farmer" : "Customer"} Registration</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer-link">
              <span>Already registered? </span>
              <Link to="/login" className="highlight-link">
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
