import { useEffect, useState } from "react";
import { Clock3, ExternalLink, LocateFixed, Map, Navigation } from "lucide-react";
import { getRouteOrigin, googleDirectionsUrl, openStreetMapDirectionsUrl, routeToMarket } from "../utils/routing";

export default function PickupRouteDetails({ market, address = "", initialRoute = null, onRoute, compact = false }) {
  const [route, setRoute] = useState(initialRoute);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setRoute(initialRoute), [initialRoute]);

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const origin = await getRouteOrigin(address);
      const result = await routeToMarket(origin, market);
      setRoute(result);
      onRoute?.(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pickup-route-panel ${compact ? "compact" : ""}`}>
      <div className="pickup-route-head">
        <div><Navigation size={17} /><span><strong>Route-friendly pickup</strong><small>Routing and map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></small></span></div>
        {!route && <button type="button" onClick={calculate} disabled={loading}><LocateFixed size={15} /> {loading ? "Calculating..." : "Calculate route"}</button>}
      </div>
      {error && <p className="pickup-route-error">{error}</p>}
      {!route && (
        <div className="pickup-route-actions">
          <a href={openStreetMapDirectionsUrl(market)} target="_blank" rel="noreferrer"><Map size={14} /> View on OpenStreetMap <ExternalLink size={12} /></a>
          <a href={googleDirectionsUrl(market)} target="_blank" rel="noreferrer">Google Maps <ExternalLink size={12} /></a>
        </div>
      )}
      {route && (
        <>
          <div className="pickup-route-metrics">
            <span><Map size={15} /><strong>{route.distanceKm.toFixed(1)} km</strong><small>{route.origin.fromAddress ? "From saved address" : route.estimated ? "Estimated distance" : "Driving distance"}</small></span>
            <span><Clock3 size={15} /><strong>{route.durationMinutes} min</strong><small>Estimated drive</small></span>
          </div>
          <div className="pickup-route-actions">
            <a href={openStreetMapDirectionsUrl(market, route.origin)} target="_blank" rel="noreferrer"><Navigation size={14} /> OpenStreetMap route <ExternalLink size={12} /></a>
            <a href={googleDirectionsUrl(market, route.origin)} target="_blank" rel="noreferrer">Google Maps <ExternalLink size={12} /></a>
            <button type="button" onClick={calculate} disabled={loading}><LocateFixed size={14} /> Refresh</button>
          </div>
        </>
      )}
    </div>
  );
}
