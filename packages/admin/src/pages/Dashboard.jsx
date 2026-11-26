import { Layout, Text, BlockStack, Button, Banner } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchTimers, fetchAnalytics } from "../api/client";
import { getEffectiveStatus } from "./TimerList";

export default function Dashboard() {
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [impressions, setImpressions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchTimers(),
      fetchAnalytics().catch(() => ({ analytics: [] })),
    ])
      .then(([timerData, analyticsData]) => {
        setTimers(timerData.timers || []);
        const total = (analyticsData.analytics || []).reduce(
          (sum, a) => sum + (a.impressions ?? 0),
          0
        );
        setImpressions(total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const activeCount = timers.filter((t) => getEffectiveStatus(t, now) === "active").length;
  const scheduledCount = timers.filter((t) => getEffectiveStatus(t, now) === "scheduled").length;

  return (
    <>
      <div className="admin-page-title">Countdown Timer Manager</div>
      <div className="admin-page-subtitle">
        Create and manage countdown timers for your promotions.
      </div>

      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        <Layout>
          <Layout.Section>
            <div
              className="admin-stat-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/timers")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/timers")}
              role="button"
              tabIndex={0}
            >
              <div className="admin-stat-card-value">
                {loading ? "—" : timers.length}
              </div>
              <div className="admin-stat-card-label">
                Total timers ({loading ? "—" : `${scheduledCount} scheduled`})
              </div>
              <div style={{ marginTop: "16px" }}>
                <Button
                  size="slim"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/timers");
                  }}
                >
                  View all
                </Button>
              </div>
            </div>
          </Layout.Section>
          <Layout.Section>
            <div
              className="admin-stat-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/timers")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/timers")}
              role="button"
              tabIndex={0}
            >
              <div className="admin-stat-card-value admin-stat-card-accent">
                {loading ? "—" : activeCount}
              </div>
              <div className="admin-stat-card-label">Active timers</div>
              <div style={{ marginTop: "16px" }}>
                <Button
                  variant="primary"
                  size="slim"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/timers/new");
                  }}
                >
                  + Create timer
                </Button>
              </div>
            </div>
          </Layout.Section>
          <Layout.Section>
            <div
              className="admin-stat-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/analytics")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/analytics")}
              role="button"
              tabIndex={0}
            >
              <div className="admin-stat-card-value">
                {loading ? "—" : impressions}
              </div>
              <div className="admin-stat-card-label">Total impressions</div>
              <div style={{ marginTop: "16px" }}>
                <Button
                  size="slim"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/analytics");
                  }}
                >
                  Open analytics
                </Button>
              </div>
            </div>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </>
  );
}
