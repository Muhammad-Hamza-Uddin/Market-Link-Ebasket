import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, MapPinned, Sprout, ShieldCheck, Users, Clock3 } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";

export default function About() {
  return (
    <AnimatedPage>
      <section className="page-hero-banner">
        <div className="container">
          <span className="eyebrow">About MarketLink</span>
          <h1 className="hero-page-title">Connecting Local Farmers & Communities</h1>
          <p className="hero-page-desc">
            A unified digital bridge for weekly harvest discovery, transparent farm-gate pricing, and predictable market-day pickups.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <div className="about-grid">
            <div>
              <span className="eyebrow">Our Mission • eGreen Basket</span>
              <h2>Eliminate Food Waste, Empower Local Growers</h2>
              <p>
                MarketLink was born out of a desire to bridge the gap between hard-working local farmers in Pakistan and conscious consumers seeking healthy, natural produce.
              </p>
              <p>
                By allowing shoppers to pre-order what they need before arriving at community weekend markets, farmers only harvest what has been reserved — eliminating spoilage and guaranteeing morning freshness.
              </p>
              <div style={{ marginTop: "24px" }}>
                <Link className="btn-primary-large" to="/products">
                  <span>Explore Marketplace</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="values">
              <div className="value-card">
                <Sprout size={24} className="val-icon" />
                <div>
                  <strong>Fresh & Local Harvest</strong>
                  <span>Directly sourced from regional farms with zero prolonged cold storage or chemicals.</span>
                </div>
              </div>

              <div className="value-card">
                <Clock3 size={24} className="val-icon" />
                <div>
                  <strong>Guaranteed Reservation</strong>
                  <span>Reserve your basket online; pick up at the farmer's stall at your convenience.</span>
                </div>
              </div>

              <div className="value-card">
                <HeartHandshake size={24} className="val-icon" />
                <div>
                  <strong>Fair Farmer Compensation</strong>
                  <span>Farmers retain 100% of their earnings with zero middlemen slicing their profits.</span>
                </div>
              </div>

              <div className="value-card">
                <ShieldCheck size={24} className="val-icon" />
                <div>
                  <strong>Pay In Person at Pickup</strong>
                  <span>Inspect produce quality first hand before settling payment directly with the stall grower.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}