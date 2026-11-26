import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import Countdown from "./Countdown";

const API_TIMER_URL = "/api/public/timers";
const API_IMPRESSION_URL = "/api/analytics/impression";

function fetchWithRetry(url, options = {}, retries = 1) {
  return fetch(url, options).catch((err) => {
    if (retries > 0) return fetchWithRetry(url, options, retries - 1);
    throw err;
  });
}

const NGROK_HEADER = { "ngrok-skip-browser-warning": "1" };

function trackImpression(apiBase, timerId, shopDomain) {
  if (!timerId || !shopDomain) return;
  const url = apiBase.replace(/\/$/, "") + API_IMPRESSION_URL;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...NGROK_HEADER },
    body: JSON.stringify({ timerId, shopDomain }),
  }).catch(() => {});
}

function App({ apiBase, shopDomain, productId, collectionIds }) {
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = `${apiBase.replace(/\/$/, "")}${API_TIMER_URL}?shopDomain=${encodeURIComponent(shopDomain)}&productId=${encodeURIComponent(productId)}`;
    if (collectionIds) {
      url += `&collectionIds=${encodeURIComponent(collectionIds)}`;
    }
    fetchWithRetry(url, { headers: NGROK_HEADER })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error (${res.status})`);
        }
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!ct.includes("application/json")) {
          return res.text().then(() => {
            throw new Error("API returned non-JSON (check ngrok/API)");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.timer) {
          setTimer(data.timer);
          trackImpression(apiBase, data.timer.id, shopDomain);
        } else {
          setTimer(null);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load timer");
        setTimer(null);
      })
      .finally(() => setLoading(false));
  }, [apiBase, shopDomain, productId, collectionIds]);

  const handleExpired = () => setTimer(null);

  if (loading) {
    return (
      <div style={{ minHeight: "50px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true" />
    );
  }

  if (error || !timer) {
    return null;
  }

  return <Countdown timer={timer} onExpired={handleExpired} />;
}

function mount(rootElement) {
  if (!rootElement) return;
  const shop = rootElement.getAttribute("data-shop") || "";
  const productId = rootElement.getAttribute("data-product-id") || "";
  const collectionIds = rootElement.getAttribute("data-collection-ids") || "";
  const apiUrl = rootElement.getAttribute("data-api-url") || "";
  if (!apiUrl || !shop || !productId) {
    rootElement.style.display = "none";
    return;
  }
  render(
    <App
      apiBase={apiUrl}
      shopDomain={shop}
      productId={String(productId)}
      collectionIds={collectionIds}
    />,
    rootElement
  );
}

export { mount };
export default { mount };
