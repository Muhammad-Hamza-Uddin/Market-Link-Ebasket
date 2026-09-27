import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarDays, Clock3, Handshake, Leaf, Mail, MapPin, PackageCheck, ShieldCheck, ShoppingBag, Sprout, Star, Store } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

const FALLBACK_MARKET_IMAGE = "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=84";
const testimonials = [
  { name: "Ahmed Ali", detail: "Clifton · 24 orders", text: "I used to race to the market before everything sold out. Now I reserve the week’s harvest and collect it without waiting long." },
  { name: "Ayesha Ahmed", detail: "Gulshan · 15 orders", text: "The zero-payment model gave me confidence. I inspect the produce, meet the grower, and pay directly at the stall." },
  { name: "Tauseef Haider", detail: "Johar · 21 orders", text: "Being able to message the farmer and choose a pickup window has made our weekend grocery run genuinely easy." },
];

export default function Home() {
  const { products, farmers, markets, platformStats, notify } = useStore();
  const [email, setEmail] = useState("");
  const popularProducts = products.slice(0, 4);
  const featuredMarkets = markets.slice(0, 3);
  const featuredFarmer = farmers[0];

  const subscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    notify("Harvest updates enabled", "We’ll keep you posted about fresh weekly stock");
    setEmail("");
  };

  return (
    <AnimatedPage>
      <section className="harvest-hero">
        <div className="harvest-hero-bg" aria-hidden="true" />
        <div className="harvest-hero-pattern" aria-hidden="true" />
        <div className="container harvest-hero-inner">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="harvest-kicker"><Sprout size={13} /> Spring pre-orders now live · weekend pickup</div>
            <h1>Farm Fresh. Just a <em>Click Away</em></h1>
            <p>Skip early morning market sell-outs. Pre-order peak-season harvests directly from independent regional farmers and collect your basket this weekend.</p>
          </motion.div>
          <div className="harvest-finder" aria-label="Find a local harvest">
            <Link to="/markets" className="finder-field"><MapPin size={18} /><span><small>Your nearest market</small><strong>{featuredMarkets[0]?.area || "Choose your neighborhood"}</strong></span></Link>
            <Link to="/markets" className="finder-field"><CalendarDays size={18} /><span><small>Pickup date</small><strong>Saturday morning</strong></span></Link>
            <Link to="/products" className="finder-field"><Leaf size={18} /><span><small>Harvest type</small><strong>All nearby harvests</strong></span></Link>
            <Link to="/products" className="harvest-find-button">Find Harvest <ArrowRight size={16} /></Link>
          </div>
          <div className="harvest-trends" aria-label="Popular harvest filters"><span>Trending</span><Link to="/products?category=vegetables"><Leaf size={12} /> Fresh vegetables</Link><Link to="/products">Organic picks</Link><Link to="/products">Harvested today</Link><Link to="/products">Pay at pickup</Link></div>
        </div>
      </section>

      <section className="harvest-benefits container" aria-label="MarketLink benefits">
        <article><span><ShoppingBag size={20} /></span><div><strong>400+</strong><p>orders placed in the last 7 days</p></div></article>
        <article><span><Store size={20} /></span><div><strong>{platformStats.activeFarmers.toLocaleString()} Farmers</strong><p>active growers and makers in the network</p></div></article>
        <article><span><ShieldCheck size={20} /></span><div><strong>Zero Upfront Payment</strong><p>inspect before you pay directly at the farmer’s stall</p></div></article>
      </section>

      <section className="home-section home-how" id="how-it-works"><div className="container">
        <div className="home-section-head split"><div><span className="home-overline">How pre-order works</span><h2>Direct harvest connection with zero morning guesswork.</h2></div><p>Farmers only harvest what has been committed. You get peak nutrient density without standing in chaotic market queues.</p></div>
        <div className="home-steps-grid">
          <article><b>01</b><span><MapPin size={18} /></span><h3>Pick Your Local Market</h3><p>Select the weekend hub in your neighborhood and see attending stalls, pickup times, and live product maps.</p><small><Clock3 size={12} /> Lock in before the cutoff</small></article>
          <article><b>02</b><span><ShoppingBag size={18} /></span><h3>Reserve Fresh Harvest</h3><p>Browse farm inventory, choose quantities, and reserve your basket with zero upfront payment.</p><small><PackageCheck size={12} /> Live harvest availability</small></article>
          <article><b>03</b><span><Handshake size={18} /></span><h3>Pay & Bag at Pickup</h3><p>Meet the grower, inspect your produce, show your pickup token, and pay directly at the stall.</p><small><ShieldCheck size={12} /> Guaranteed zero farm-food waste</small></article>
        </div>
      </div></section>

      <section className="home-section home-markets"><div className="container">
        <div className="home-section-head"><div><span className="home-overline">Regional distribution hubs</span><h2>Featured Farmers Markets</h2></div><Link to="/markets">View all markets <ArrowRight size={14} /></Link></div>
        <div className="home-market-grid">
          {featuredMarkets.map((market) => <article className="home-market-card" key={market.id}><div className="home-market-image"><img src={market.image || FALLBACK_MARKET_IMAGE} alt={market.name} /><span><Clock3 size={12} /> {market.timing}</span></div><div className="home-market-body"><div><h3>{market.name}</h3><span className="home-rating"><Star size={12} fill={market.reviewsCount ? "currentColor" : "none"} /> {market.reviewsCount ? `${market.rating} (${market.reviewsCount})` : "New"}</span></div><p><MapPin size={13} /> {market.area || market.address}</p><dl><div><dt>Active stalls</dt><dd>{market.farmers} {market.farmers === 1 ? "stall" : "stalls"}</dd></div><div><dt>Live products</dt><dd>{market.productsCount} listed</dd></div></dl><div className="home-market-schedule"><CalendarDays size={12} /> {market.operatingDays}</div><Link to={`/products?market=${market.id}`}>Browse Stalls <ArrowRight size={14} /></Link></div></article>)}
          {!featuredMarkets.length && <div className="home-empty-card"><Store size={28} /><h3>Markets are loading</h3><p>Live regional pickup hubs will appear here.</p></div>}
        </div>
      </div></section>

      <section className="home-section home-products"><div className="container">
        <div className="home-section-head"><div><span className="home-overline">Harvest season peak</span><h2>Fresh This Week for Pre-Order</h2></div><Link to="/products">Browse all produce <ArrowRight size={14} /></Link></div>
        <div className="products-responsive-grid home-product-grid">{popularProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
        {!popularProducts.length && <div className="home-empty-card"><Leaf size={28} /><h3>Fresh stock is being prepared</h3><p>Live farmer listings will appear here as soon as this week’s harvest is published.</p></div>}
      </div></section>

      <section className="home-section home-farmer-story"><div className="container"><div className="farmer-story-card">
        <div className="farmer-story-image"><img src="/farmers-image.png" alt="Local MarketLink grower with fresh farm produce" /></div>
        <div className="farmer-story-copy"><span className="home-overline"><BadgeCheck size={13} /> Grower of the month</span><blockquote>“Pre-orders let us pick at 5:00 AM on market day, so every customer receives produce at peak freshness.”</blockquote><p>{featuredFarmer?.bio || "Working directly with customers helps independent growers plan each harvest, reduce waste, and bring only the freshest seasonal produce to the market."}</p><div className="farmer-story-facts"><span><small>Market stall</small><strong>{featuredFarmer?.stall || "Local weekend market"}</strong></span><span><small>Specialties</small><strong>Seasonal produce</strong></span><span><small>Growing practice</small><strong>Low-impact farming</strong></span></div><Link to="/farmers">View Farmer Stories <ArrowRight size={14} /></Link></div>
      </div></div></section>

      <section className="home-section home-testimonials"><div className="container">
        <div className="home-centered-heading"><span className="home-overline">Rooted in neighbors</span><h2>Loved by Weekend Marketgoers</h2><p>Discover why thousands of local families pre-order their freshest pantry staples every week.</p></div>
        <div className="testimonial-grid">{testimonials.map((item) => <article key={item.name}><div className="testimonial-stars">{[1,2,3,4,5].map((star) => <Star key={star} size={13} fill="currentColor" />)}</div><p>“{item.text}”</p><footer><span>{item.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div></footer></article>)}</div>
      </div></section>

      <section className="home-newsletter-wrap"><div className="container"><form className="home-newsletter" onSubmit={subscribe}><span className="newsletter-icon"><Mail size={20} /></span><div><strong>Never miss your favorite crop harvest.</strong><p>Get a friendly weekly notice when regional growers publish fresh stock.</p></div><label><span className="sr-only">Email address</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" /></label><button type="submit">Subscribe Free</button></form></div></section>
    </AnimatedPage>
  );
}
