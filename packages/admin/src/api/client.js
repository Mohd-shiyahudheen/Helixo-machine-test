const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getShopDomain() {
  const params = new URLSearchParams(window.location.search);
  return params.get("shop") || "shiyageneralstore.myshopify.com";
}

export async function fetchTimers() {
  const shopDomain = getShopDomain();
  const res = await fetch(`${API_BASE}/timers?shopDomain=${encodeURIComponent(shopDomain)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTimer(id) {
  const shopDomain = getShopDomain();
  const res = await fetch(`${API_BASE}/timers/${id}?shopDomain=${encodeURIComponent(shopDomain)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTimer(data) {
  const shopDomain = getShopDomain();
  const res = await fetch(`${API_BASE}/timers?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateTimer(id, data) {
  const shopDomain = getShopDomain();
  const res = await fetch(`${API_BASE}/timers/${id}?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteTimer(id) {
  const shopDomain = getShopDomain();
  const res = await fetch(`${API_BASE}/timers/${id}?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchAnalytics(from, to) {
  const shopDomain = getShopDomain();
  let url = `${API_BASE}/analytics?shopDomain=${encodeURIComponent(shopDomain)}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
