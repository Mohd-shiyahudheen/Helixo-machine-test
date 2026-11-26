import { DataTable, BlockStack, Banner, TextField, Button, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { fetchAnalytics } from "../api/client";

export default function Analytics() {
  const [data, setData] = useState({ analytics: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = () => {
    setLoading(true);
    fetchAnalytics(from || undefined, to || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const analytics = data.analytics || [];
  const totalImpressions = analytics.reduce((sum, a) => sum + (a.impressions ?? 0), 0);

  const rows = analytics.map((a) => [
    a.timerId?.name || a.timerId || "-",
    a.date ? new Date(a.date).toLocaleDateString() : "-",
    a.impressions ?? 0,
  ]);

  return (
    <>
      <div className="admin-page-title">Analytics</div>
      <div className="admin-page-subtitle">
        View timer impressions and performance over time.
      </div>

      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Date range</div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ width: "180px" }}>
              <TextField
                label="From"
                type="date"
                value={from}
                onChange={setFrom}
                autoComplete="off"
              />
            </div>
            <div style={{ width: "180px" }}>
              <TextField label="To" type="date" value={to} onChange={setTo} autoComplete="off" />
            </div>
            <Button variant="primary" onClick={load} loading={loading}>
              Apply
            </Button>
          </div>
        </div>

        {analytics.length > 0 && (
          <div className="admin-stat-card" style={{ maxWidth: "240px" }}>
            <div className="admin-stat-card-value admin-stat-card-accent">{totalImpressions}</div>
            <div className="admin-stat-card-label">Total impressions</div>
          </div>
        )}

        <div className="admin-form-section" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #e1e3e5" }}>
            <Text as="h2" variant="headingMd">Impressions by timer</Text>
          </div>
          <DataTable
            columnContentTypes={["text", "text", "numeric"]}
            headings={["Timer", "Date", "Impressions"]}
            rows={rows}
            loading={loading}
          />
        </div>
      </BlockStack>
    </>
  );
}
