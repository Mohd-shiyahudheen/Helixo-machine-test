import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

function getApiBase() {
  // eslint-disable-next-line no-undef
  return (process.env.API_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getEffectiveStatus(timer, now = new Date()) {
  if (!timer) return "draft";
  if (timer.status === "paused") return "paused";
  if (timer.status === "draft") return "draft";
  if (timer.timerType === "fixed") {
    if (timer.startDate && new Date(timer.startDate) > now) return "scheduled";
    if (timer.endDate && new Date(timer.endDate) < now) return "expired";
  }
  return "active";
}

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const apiBase = getApiBase();
  const shopDomain = session.shop;

  try {
    const [timersRes, analyticsRes] = await Promise.all([
      fetch(`${apiBase}/api/timers?shopDomain=${encodeURIComponent(shopDomain)}`),
      fetch(`${apiBase}/api/analytics?shopDomain=${encodeURIComponent(shopDomain)}`),
    ]);

    const timersData = timersRes.ok ? await timersRes.json() : { timers: [] };
    const analyticsData = analyticsRes.ok ? await analyticsRes.json() : { analytics: [] };

    return {
      shopDomain,
      timers: timersData.timers || [],
      analytics: analyticsData.analytics || [],
      apiError: timersRes.ok ? null : `API returned ${timersRes.status}`,
    };
  } catch (err) {
    return {
      shopDomain,
      timers: [],
      analytics: [],
      apiError: err?.message || "Could not reach countdown API server",
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const apiBase = getApiBase();
  const shopDomain = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "delete") {
      const id = formData.get("id");
      const res = await fetch(
        `${apiBase}/api/timers/${encodeURIComponent(id)}?shopDomain=${encodeURIComponent(shopDomain)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error || "Failed to delete timer" };
      }
      return { ok: true, message: "Timer deleted" };
    }

    let parsedTargetIds = [];
    try {
      parsedTargetIds = JSON.parse(formData.get("targetIds") || "[]");
    } catch {
      return { error: "Invalid targetIds format" };
    }

    const payload = {
      name: formData.get("name"),
      description: formData.get("description") || "",
      labelText: formData.get("labelText") || "YOUR SPECIAL OFFER ENDS IN",
      timerType: formData.get("timerType") || "fixed",
      startDate: formData.get("startDate") || undefined,
      endDate: formData.get("endDate") || undefined,
      durationHours: Number(formData.get("durationHours") || 24),
      targetType: formData.get("targetType") || "all",
      targetIds: parsedTargetIds,
      status: formData.get("status") || "active",
      design: {
        color: formData.get("color") || "#ffffff",
        background: formData.get("background") || "#000000",
        position: formData.get("position") || "top",
        size: formData.get("size") || "medium",
        urgencyNotification: formData.get("urgencyNotification") || "color_pulse",
      },
    };

    const id = formData.get("id");
    const isUpdate = intent === "update" && id;
    const url = isUpdate
      ? `${apiBase}/api/timers/${encodeURIComponent(id)}?shopDomain=${encodeURIComponent(shopDomain)}`
      : `${apiBase}/api/timers?shopDomain=${encodeURIComponent(shopDomain)}`;

    const res = await fetch(url, {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Failed to save timer" };
    }

    return { ok: true, message: isUpdate ? "Timer updated" : "Timer created" };
  } catch (err) {
    return { error: err?.message || "Could not reach countdown API server" };
  }
};

export default function Index() {
  const { timers, analytics, apiError } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labelText, setLabelText] = useState("YOUR SPECIAL OFFER ENDS IN");
  const [timerType, setTimerType] = useState("fixed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState([]);
  const [status, setStatus] = useState("active");
  const [color, setColor] = useState("#ffffff");
  const [background, setBackground] = useState("#000000");
  const [position, setPosition] = useState("top");
  const [size, setSize] = useState("medium");
  const [urgencyNotification, setUrgencyNotification] = useState("color_pulse");

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show(fetcher.data.message || "Saved");
      setShowForm(false);
      setEditingId(null);
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setLabelText("YOUR SPECIAL OFFER ENDS IN");
    setTimerType("fixed");
    setStartDate("");
    setEndDate("");
    setDurationHours("24");
    setTargetType("all");
    setTargetIds([]);
    setStatus("active");
    setColor("#ffffff");
    setBackground("#000000");
    setPosition("top");
    setSize("medium");
    setUrgencyNotification("color_pulse");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setName(t.name || "");
    setDescription(t.description || "");
    setLabelText(t.labelText || "YOUR SPECIAL OFFER ENDS IN");
    setTimerType(t.timerType || "fixed");
    setStartDate(toLocalDateTimeInput(t.startDate));
    setEndDate(toLocalDateTimeInput(t.endDate));
    setDurationHours(String(t.durationHours || 24));
    setTargetType(t.targetType || "all");
    setTargetIds(Array.isArray(t.targetIds) ? t.targetIds : []);
    setStatus(t.status || "active");
    setColor(t.design?.color || "#ffffff");
    setBackground(t.design?.background || "#000000");
    setPosition(t.design?.position || "top");
    setSize(t.design?.size || "medium");
    setUrgencyNotification(t.design?.urgencyNotification || "color_pulse");
    setShowForm(true);
  };

  const handleResourcePicker = async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: targetType === "collection" ? "collection" : "product",
        multiple: true,
        selectionIds: targetIds.map((id) => ({ id })),
      });
      if (Array.isArray(selected)) {
        setTargetIds(selected.map((item) => item.id).filter(Boolean));
      }
    } catch (err) {
      shopify.toast.show(err?.message || "Could not open Resource Picker", { isError: true });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (targetType !== "all" && targetIds.length === 0) {
      shopify.toast.show(`Please select at least one ${targetType}.`, { isError: true });
      return;
    }
    const fd = new FormData();
    fd.set("intent", editingId ? "update" : "create");
    if (editingId) fd.set("id", editingId);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("labelText", labelText);
    fd.set("timerType", timerType);
    if (timerType === "fixed" && startDate) fd.set("startDate", new Date(startDate).toISOString());
    if (timerType === "fixed" && endDate) fd.set("endDate", new Date(endDate).toISOString());
    fd.set("durationHours", durationHours);
    fd.set("targetType", targetType);
    fd.set("targetIds", JSON.stringify(targetType === "all" ? [] : targetIds));
    fd.set("status", status);
    fd.set("color", color);
    fd.set("background", background);
    fd.set("position", position);
    fd.set("size", size);
    fd.set("urgencyNotification", urgencyNotification);
    fetcher.submit(fd, { method: "POST" });
  };

  const handleDelete = (id) => {
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("id", id);
    fetcher.submit(fd, { method: "POST" });
  };

  const impressionsByTimer = useMemo(() => {
    const map = {};
    for (const a of analytics) {
      const tid = a.timerId?._id || a.timerId;
      if (tid) map[tid] = (map[tid] || 0) + (a.impressions ?? 0);
    }
    return map;
  }, [analytics]);

  const filteredTimers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const list = timers.filter((t) => {
      const eff = getEffectiveStatus(t, now);
      if (statusFilter !== "all" && eff !== statusFilter) return false;
      if (q && !(t.name || "").toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "startDate") {
        return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [timers, search, statusFilter, sortBy]);

  const totalImpressions = analytics.reduce((sum, a) => sum + (a.impressions ?? 0), 0);

  return (
    <s-page heading="Countdown Timer Manager">
      <s-button slot="primary-action" onClick={openCreate}>
        + Create timer
      </s-button>

      {apiError && (
        <s-section>
          <s-banner tone="warning">
            Backend API connection notice: {apiError}. Ensure `packages/api` is running.
          </s-banner>
        </s-section>
      )}

      <s-section heading="Overview">
        <s-stack direction="inline" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-text>Total Timers: {timers.length}</s-text>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-text>Total Impressions: {totalImpressions}</s-text>
          </s-box>
        </s-stack>
      </s-section>

      {showForm && (
        <s-section heading={editingId ? "Edit Timer" : "Create New Timer"}>
          <form onSubmit={handleSave} style={{ display: "grid", gap: "12px", maxWidth: "640px" }}>
            <label>
              Timer name *
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </label>
            <label>
              Offer headline text
              <input
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </label>
            <label>
              Promotion description
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label>
                Timer type
                <select value={timerType} onChange={(e) => setTimerType(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }}>
                  <option value="fixed">Fixed</option>
                  <option value="evergreen">Evergreen</option>
                </select>
              </label>
              <label>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
            {timerType === "fixed" ? (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <label>
                  Start date &amp; time
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }} />
                </label>
                <label>
                  End date &amp; time *
                  <input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }} />
                </label>
              </div>
            ) : (
              <label>
                Duration (hours)
                <input type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }} />
              </label>
            )}
            <div>
              <label>
                Apply timer to
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    if (e.target.value === "all") setTargetIds([]);
                  }}
                  style={{ display: "block", padding: "8px", marginTop: "4px" }}
                >
                  <option value="all">All products</option>
                  <option value="product">Specific products</option>
                  <option value="collection">Specific collections</option>
                </select>
              </label>
              {targetType !== "all" && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <s-button type="button" onClick={handleResourcePicker}>
                    Select {targetType === "collection" ? "Collections" : "Products"}
                  </s-button>
                  <span>{targetIds.length} selected</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label>
                Size
                <select value={size} onChange={(e) => setSize(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <label>
                Position
                <select value={position} onChange={(e) => setPosition(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }}>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
              <label>
                Urgency notification
                <select value={urgencyNotification} onChange={(e) => setUrgencyNotification(e.target.value)} style={{ display: "block", padding: "8px", marginTop: "4px" }}>
                  <option value="color_pulse">Color pulse</option>
                  <option value="shake">Shake</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label>
                Text color
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ display: "block", marginTop: "4px" }} />
              </label>
              <label>
                Background
                <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ display: "block", marginTop: "4px" }} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <s-button type="submit" variant="primary">Save Timer</s-button>
              <s-button type="button" onClick={() => setShowForm(false)}>Cancel</s-button>
            </div>
          </form>
        </s-section>
      )}

      <s-section heading="Timers">
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search timers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px", minWidth: "220px" }}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px" }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px" }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A-Z)</option>
            <option value="startDate">Start date</option>
          </select>
        </div>

        {filteredTimers.length === 0 ? (
          <s-paragraph>No countdown timers found. Click &ldquo;+ Create timer&rdquo; to get started.</s-paragraph>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {filteredTimers.map((t) => {
              const eff = getEffectiveStatus(t);
              return (
                <div
                  key={t._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    border: "1px solid #e1e3e5",
                    borderRadius: "8px",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    {t.description && <div style={{ fontSize: "13px", color: "#6d7175" }}>{t.description}</div>}
                    <div style={{ fontSize: "12px", color: "#6d7175", marginTop: "4px" }}>
                      Type: {t.timerType} · Target: {t.targetType} · Status: <strong>{eff}</strong> · Impressions: <strong>{impressionsByTimer[t._id] ?? 0}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <s-button onClick={() => openEdit(t)}>Edit</s-button>
                    <s-button tone="critical" onClick={() => handleDelete(t._id)}>Delete</s-button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
