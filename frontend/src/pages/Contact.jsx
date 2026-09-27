import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function Contact() {
  const { notify } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`MarketLink inquiry from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
    notify("Opening your email app", "Review and send the message from your configured email account.");
    window.location.href = `mailto:support@marketlink.pk?subject=${subject}&body=${body}`;
  };

  return (
    <AnimatedPage>
      <section className="page-hero-banner">
        <div className="container">
          <span className="eyebrow">Customer & Farmer Support</span>
          <h1 className="hero-page-title">Get in Touch with MarketLink</h1>
          <p className="hero-page-desc">
            Have a question about a local market stall, farm pickup, or want to register as a local grower? We're here to help.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <div className="contact-grid">
            <div>
              <span className="eyebrow">Community Assistance</span>
              <h2>We'd Love to Hear From You</h2>
              <p className="lead">
                Our support desk works with local market committees to ensure smooth pickups and direct farmer communication.
              </p>

              <div className="contact-info">
                <p>
                  <MapPin size={18} />
                  <Link to="/markets">View active market locations and directions</Link>
                </p>
                <p>
                  <Mail size={18} />
                  <span>support@marketlink.pk</span>
                </p>
                <p>
                  <Phone size={18} />
                  <span>Contact details are provided through verified farmer and market profiles.</span>
                </p>
              </div>
            </div>

            <form className="form-card" onSubmit={handleSubmit}>
              <div className="form-field-group">
                <label htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fatima Ali"
                  required
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="contact-email">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fatima@example.com"
                  required
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="contact-message">Message / Question</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Ask about stall timings, pre-orders, or grower partnerships..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary-large">
                <Send size={17} /> Open Email App
              </button>
            </form>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}