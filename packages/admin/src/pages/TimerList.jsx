import {
  DataTable,
  Button,
  Badge,
  BlockStack,
  useIndexResourceState,
  Banner,
  EmptyState,
  TextField,
  Select,
  InlineStack,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { fetchTimers, deleteTimer, fetchAnalytics } from "../api/client";

export function getEffectiveStatus(timer, now = new Date()) {
  if (!timer) return "draft";
  if (timer.status === "paused") return "paused";
  if (timer.status === "draft") return "draft";
  if (timer.timerType === "fixed") {
    if (timer.startDate && new Date(timer.startDate) > now) return "scheduled";
    if (timer.endDate && new Date(timer.endDate) < now) return "expired";
  }
  return "active";
}

function statusBadge(effectiveStatus) {
  switch (effectiveStatus) {
    case "active":
      return <Badge tone="success">Active</Badge>;
    case "scheduled":
      return <Badge tone="info">Scheduled</Badge>;
    case "expired":
      return <Badge tone="critical">Expired</Badge>;
    case "paused":
      return <Badge tone="warning">Paused</Badge>;
    default:
      return <Badge>Draft</Badge>;
  }
}

export default function TimerList() {
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [impressionsByTimer, setImpressionsByTimer] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchTimers(),
      fetchAnalytics().catch(() => ({ analytics: [] })),
    ])
      .then(([timerData, analyticsData]) => {
        setTimers(timerData.timers || []);
        const map = {};
        for (const a of analyticsData.analytics || []) {
          const tid = a.timerId?._id || a.timerId;
          if (tid) map[tid] = (map[tid] || 0) + (a.impressions ?? 0);
        }
        setImpressionsByTimer(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredTimers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const list = timers.filter((t) => {
      const effective = getEffectiveStatus(t, now);
      if (statusFilter !== "all" && effective !== statusFilter) return false;
      if (q) {
        const matchName = (t.name || "").toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
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

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(filteredTimers, { resourceIdResolver: (t) => t._id });

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedResources) {
        await deleteTimer(id);
      }
      clearSelection();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const rows = filteredTimers.map((t) => {
    const effective = getEffectiveStatus(t);
    const startLabel = t.startDate
      ? new Date(t.startDate).toLocaleDateString()
      : t.timerType === "evergreen"
        ? `${t.durationHours || 24}h evergreen`
        : "Immediate";
    return [
      <div>
        <div style={{ fontWeight: 600 }}>{t.name}</div>
        {t.description ? (
          <div style={{ fontSize: "12px", color: "#6d7175" }}>{t.description}</div>
        ) : null}
      </div>,
      t.timerType,
      t.targetType === "all" ? "All products" : `${t.targetType} (${t.targetIds?.length || 0})`,
      startLabel,
      statusBadge(effective),
      impressionsByTimer[t._id] ?? 0,
      <Button size="slim" onClick={() => navigate(`/timers/${t._id}`)}>
        Edit
      </Button>,
    ];
  });

  return (
    <>
      <div className="admin-page-title">Countdown Timer Manager</div>
      <div className="admin-page-subtitle">
        Create and manage countdown timers for your promotions
      </div>

      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        <div className="admin-form-section" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e1e3e5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <InlineStack gap="300" wrap blockAlign="end">
              <div style={{ minWidth: "220px" }}>
                <TextField
                  label="Search timers"
                  labelHidden
                  placeholder="Search timers..."
                  value={search}
                  onChange={setSearch}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearch("")}
                />
              </div>
              <Select
                label="Status"
                labelHidden
                options={[
                  { label: "All statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Scheduled", value: "scheduled" },
                  { label: "Expired", value: "expired" },
                  { label: "Paused", value: "paused" },
                  { label: "Draft", value: "draft" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <Select
                label="Sort"
                labelHidden
                options={[
                  { label: "Newest first", value: "newest" },
                  { label: "Oldest first", value: "oldest" },
                  { label: "Name (A-Z)", value: "name" },
                  { label: "Start date", value: "startDate" },
                ]}
                value={sortBy}
                onChange={setSortBy}
              />
            </InlineStack>
            <Button variant="primary" onClick={() => navigate("/timers/new")}>
              + Create timer
            </Button>
          </div>
          {filteredTimers.length === 0 && !loading ? (
            <div style={{ padding: "48px 24px" }}>
              <EmptyState
                heading={timers.length === 0 ? "No timers yet" : "No matching timers"}
                action={{
                  content: timers.length === 0 ? "+ Create timer" : "Clear filters",
                  onAction: () => {
                    if (timers.length === 0) {
                      navigate("/timers/new");
                    } else {
                      setSearch("");
                      setStatusFilter("all");
                    }
                  },
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                {timers.length === 0
                  ? "Create a countdown timer to show on product pages."
                  : "Try adjusting your search or status filter."}
              </EmptyState>
            </div>
          ) : (
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text", "numeric", "text"]}
              headings={["Name", "Type", "Target", "Start", "Status", "Impressions", "Actions"]}
              rows={rows}
              selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              loading={loading}
              selectable
              promotedBulkActions={[
                { content: "Delete", onAction: handleBulkDelete, destructive: true },
              ]}
            />
          )}
        </div>
      </BlockStack>
    </>
  );
}
