import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Clock3, MapPin, Navigation, Users, Search, CheckCircle2, ArrowRight, ExternalLink, Calendar, Store, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../components/AnimatedPage";
import PickupRouteDetails from "../components/PickupRouteDetails";
import { useStore } from "../context/StoreContext";

export default function Markets() {
  const { markets, farmers, isLoading, currentUser, updateProfile, notify } = useStore();
  const [activeMarketId, setActiveMarketId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetailsMarket, setSelectedDetailsMarket] = useState(null);

  useEffect(() => {
    if (!activeMarketId && markets[0]) setActiveMarketId(markets[0].id);
  }, [markets, activeMarketId]);

  const filteredMarkets = useMemo(() => markets.filter((market) => {
    const query = searchTerm.toLowerCase();
    return [market.name, market.area, market.address, market.city].some((value) => String(value || "").toLowerCase().includes(query));
  }), [markets, searchTerm]);

  const currentSelected = markets.find((market) => market.id === activeMarketId) || markets[0];
  if (!currentSelected) {
    return <AnimatedPage><div className="container section-padding"><div className="empty-cart-card"><h2>{isLoading ? "Loading live markets…" : "No active markets available"}</h2><p>Markets are loaded from the MarketLink API.</p></div></div></AnimatedPage>;
  }

  const longitude = currentSelected.coordinates?.longitude || 67.05;
  const latitude = currentSelected.coordinates?.latitude || 24.86;
  const delta = 0.025;
  const mapSrc = "https://www.openstreetmap.org/export/embed.html?bbox=" + (longitude - delta) + "%2C" + (latitude - delta) + "%2C" + (longitude + delta) + "%2C" + (latitude + delta) + "&layer=mapnik&marker=" + latitude + "%2C" + longitude;
  const directionsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(currentSelected.name + " " + currentSelected.address);
  const savedMarketIds = (currentUser?.preferredMarkets?.length ? currentUser.preferredMarkets : currentUser?.preferredMarket ? [currentUser.preferredMarket] : []).map((market) => String(market?._id || market?.id || market));
  const marketIsSaved = savedMarketIds.includes(String(currentSelected.id));
  const toggleSavedMarket = async () => {
    if (currentUser?.role !== "customer" || !currentUser?.email) return notify("Customer login required", "Log in as a customer to save pickup markets");
    const preferredMarkets = marketIsSaved ? savedMarketIds.filter((id) => id !== String(currentSelected.id)) : [...savedMarketIds, String(currentSelected.id)];
    await updateProfile({ preferredMarkets });
  };

  return (
    <AnimatedPage>
      <section className="page-hero-banner"><div className="container"><span className="eyebrow">Local Pickup Points</span><h1 className="hero-page-title">Nearby Farmers Markets</h1><p className="hero-page-desc">Explore community market days, pickup operating hours, active farmer stalls, and live map locations across Karachi.</p></div></section>
      <section className="section-padding"><div className="container">
        <div className="market-search-bar"><div className="search-input-wrap"><Search size={18} className="search-icon" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search market name, area, or address…" />{searchTerm && <button className="clear-btn" aria-label="Clear search" onClick={() => setSearchTerm("")}><X size={16} /></button>}</div><div className="markets-badge-count"><span>{filteredMarkets.length} Active Market Hubs</span></div></div>
        <div className="map-view-layout">
          <div className="interactive-map-frame"><div className="map-canvas-inner real-map-surface">
            <iframe title={`OpenStreetMap location for ${currentSelected.name}`} src={mapSrc} className="real-market-map" loading="lazy" />
            <div className="map-floating-panel"><div className="map-tag"><Navigation size={14} /><span>Live OpenStreetMap pickup map</span></div><small>Select a market below to update the marker.</small></div>
            <div className="map-market-selector" aria-label="Choose a market on the map">
              <span className="map-selector-label"><MapPin size={14} /> Select market</span>
              <div className="map-selector-options">
                {filteredMarkets.map((market) => <button type="button" key={market.id} className={market.id === activeMarketId ? "active" : ""} onClick={() => setActiveMarketId(market.id)}><span className="map-selector-pin"><MapPin size={14} /></span><span><strong>{market.name}</strong><small>{market.area}</small></span>{market.id === activeMarketId && <CheckCircle2 size={14} className="map-selector-check" />}</button>)}
              </div>
            </div>
            <div className="map-active-preview-card"><div className="preview-top"><span className="live-status-dot" /><strong>{currentSelected.name}</strong></div><p className="preview-address">{currentSelected.address}</p><div className="preview-meta"><span><Clock3 size={13} /> {currentSelected.timing}</span><span><Users size={13} /> {currentSelected.farmers} farmers</span></div><div className="preview-actions"><button className="btn-preview-details" onClick={() => setSelectedDetailsMarket(currentSelected)}>View Details <ArrowRight size={14} /></button><a className="btn-preview-details" href={directionsUrl} target="_blank" rel="noreferrer">Directions <ExternalLink size={14} /></a><button className="btn-preview-details" type="button" onClick={toggleSavedMarket}>{marketIsSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {marketIsSaved ? "Saved" : "Save market"}</button></div></div>
          </div></div>
          <div className="market-side-panel"><h3 className="side-panel-heading">Available Markets ({filteredMarkets.length})</h3><div className="market-cards-scroller">{filteredMarkets.map((market) => { const selected = market.id === activeMarketId; return <motion.div key={market.id} className={`market-summary-card ${selected ? "selected-market" : ""}`} onClick={() => setActiveMarketId(market.id)} whileHover={{ scale: 1.01 }}><div className="market-card-top"><div className="market-icon-pin"><MapPin size={20} /></div><div className="market-meta-primary"><h4 className="market-title">{market.name}</h4><p className="market-address-line"><MapPin size={13} /> {market.city} • <span className="area-text">{market.area}</span></p></div></div><div className="market-stats-row"><div className="stat-pill"><Users size={13} /><span>{market.farmers} Farmers</span></div><div className="stat-pill"><Clock3 size={13} /><span>{market.timing}</span></div></div><div className="market-days-notice"><Calendar size={13} /><span>Schedule: <strong>{market.operatingDays}</strong></span></div><div className="market-card-actions"><button className="btn-select-location" onClick={(event) => { event.stopPropagation(); setSelectedDetailsMarket(market); }}><span>View Market</span><ExternalLink size={14} /></button></div></motion.div>; })}</div></div>
        </div>
        <PickupRouteDetails market={currentSelected} address={currentUser?.address} />
      </div></section>
      <AnimatePresence>{selectedDetailsMarket && <div className="modal-backdrop" onClick={() => setSelectedDetailsMarket(null)}><motion.div className="market-modal-box" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 25 }}><div className="modal-header"><div><span className="eyebrow">Community Market Guide</span><h2>{selectedDetailsMarket.name}</h2></div><button className="modal-close" onClick={() => setSelectedDetailsMarket(null)}>✕</button></div><div className="market-modal-body"><div className="modal-img-banner"><img src={selectedDetailsMarket.image} alt={selectedDetailsMarket.name} /><div className="market-pill-tag"><Clock3 size={14} /> Open {selectedDetailsMarket.operatingDays}</div></div><div className="market-info-grid"><div className="info-cell"><small>Full Address</small><strong>{selectedDetailsMarket.address}</strong></div><div className="info-cell"><small>Operating Hours</small><strong>{selectedDetailsMarket.timing}</strong></div><div className="info-cell"><small>Attending Farmers</small><strong>{selectedDetailsMarket.farmers} Registered Stalls</strong></div></div><div className="market-features-list"><h4>Market Facilities</h4><div className="features-tags">{selectedDetailsMarket.features.map((feature) => <span key={feature} className="feature-tag"><CheckCircle2 size={13} /> {feature}</span>)}</div></div><div className="participating-farmers-mini"><h4>Attending Farmers at this Market</h4><div className="farmers-pills-row">{farmers.filter((farmer) => String(farmer.location || "").toLowerCase().includes(String(selectedDetailsMarket.name).toLowerCase())).slice(0, 3).map((farmer) => <div className="attending-farmer-card" key={farmer.id}><Store size={14} /><div><strong>{farmer.name}</strong><small>{farmer.stall}</small></div></div>)}</div></div></div><div className="modal-footer"><button className="btn-secondary" onClick={() => setSelectedDetailsMarket(null)}>Close</button><a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(selectedDetailsMarket.name + " " + selectedDetailsMarket.address)} target="_blank" rel="noreferrer" className="btn-primary"><Navigation size={16} /> Open in Google Maps</a></div></motion.div></div>}</AnimatePresence>
    </AnimatedPage>
  );
}
