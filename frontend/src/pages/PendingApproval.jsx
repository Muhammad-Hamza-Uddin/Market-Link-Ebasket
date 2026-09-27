import { Clock3, Mail, ShieldCheck, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import { useStore } from "../context/StoreContext";

export default function PendingApproval() {
  const { currentUser, logout } = useStore();

  return (
    <AnimatedPage>
      <section className="pending-approval-page section-padding">
        <div className="container pending-approval-container">
          <div className="pending-approval-card">
            <div className="pending-approval-icon"><Clock3 size={38} /></div>
            <span className="eyebrow">Farmer application received</span>
            <h1>Account Under Review</h1>
            <p className="pending-lead">Thanks, {currentUser.name || "farmer"}. Your MarketLink farmer application has been submitted successfully.</p>
            <div className="approval-steps">
              <div className="approval-step done"><span>1</span><div><strong>Application submitted</strong><small>Your details are safely recorded.</small></div></div>
              <div className="approval-step current"><span>2</span><div><strong>Admin verification pending</strong><small>Our team is reviewing your farm and registration details.</small></div></div>
              <div className="approval-step"><span>3</span><div><strong>Farmer dashboard unlocked</strong><small>You can publish products after approval.</small></div></div>
            </div>
            <div className="pending-info-grid"><div><ShieldCheck size={18} /><span>Only approved farmers can manage products and orders.</span></div><div><Mail size={18} /><span>Need help? <a href="mailto:support@marketlink.pk">Contact support</a>.</span></div></div>
            <div className="pending-actions"><Link className="btn-primary-large" to="/contact"><Mail size={17} /> Contact Support</Link><Link className="btn-secondary" to="/markets"><Sprout size={17} /> Explore MarketLink</Link><button className="btn-secondary" onClick={logout}>Sign out</button></div>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
