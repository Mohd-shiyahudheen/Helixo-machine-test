import {
  FormLayout,
  TextField,
  Select,
  BlockStack,
  Banner,
  Button,
  InlineStack,
  Tag,
  Text,
} from "@shopify/polaris";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchTimer, createTimer, updateTimer } from "../api/client";

const TIMER_TYPES = [
  { label: "Fixed (start/end dates)", value: "fixed" },
  { label: "Evergreen (duration per visitor)", value: "evergreen" },
];

const TARGET_TYPES = [
  { label: "All products", value: "all" },
  { label: "Specific products", value: "product" },
  { label: "Specific collections", value: "collection" },
];

const POSITIONS = [
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
];

const SIZES = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const URGENCY_OPTIONS = [
  { label: "Color pulse", value: "color_pulse" },
  { label: "Shake", value: "shake" },
  { label: "None", value: "none" },
];

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labelText, setLabelText] = useState("YOUR SPECIAL OFFER ENDS IN");
  const [timerType, setTimerType] = useState("fixed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState([]);
  const [manualIdsRaw, setManualIdsRaw] = useState("");
  const [design, setDesign] = useState({
    color: "#ffffff",
    background: "#000000",
    position: "top",
    size: "medium",
    urgencyNotification: "color_pulse",
  });
  const [status, setStatus] = useState("active");

  const hasResourcePicker =
    typeof window !== "undefined" && typeof window.shopify?.resourcePicker === "function";

  useEffect(() => {
    if (!isNew) {
      fetchTimer(id)
        .then((t) => {
          setName(t.name || "");
          setDescription(t.description || "");
          setLabelText(t.labelText || "YOUR SPECIAL OFFER ENDS IN");
          setTimerType(t.timerType || "fixed");
          setStartDate(toLocalDateTimeInput(t.startDate));
          setEndDate(toLocalDateTimeInput(t.endDate));
          setDurationHours(String(t.durationHours || 24));
          setTargetType(t.targetType || "all");
          const ids = Array.isArray(t.targetIds) ? t.targetIds : [];
          setTargetIds(ids);
          setManualIdsRaw(ids.join(", "));
          setDesign({
            color: t.design?.color || "#ffffff",
            background: t.design?.background || "#000000",
            position: t.design?.position || "top",
            size: t.design?.size || "medium",
            urgencyNotification: t.design?.urgencyNotification || "color_pulse",
          });
          setStatus(t.status || "active");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleOpenResourcePicker = async () => {
    if (!hasResourcePicker) return;
    try {
      const selected = await window.shopify.resourcePicker({
        type: targetType === "collection" ? "collection" : "product",
        multiple: true,
        selectionIds: targetIds.map((tid) => ({ id: tid })),
      });
      if (Array.isArray(selected)) {
        const nextIds = selected.map((item) => item.id).filter(Boolean);
        setTargetIds(nextIds);
        setManualIdsRaw(nextIds.join(", "));
      }
    } catch (e) {
      setError(e?.message || "Failed to open Shopify Resource Picker");
    }
  };

  const handleRemoveTargetId = (idToRemove) => {
    const next = targetIds.filter((tid) => tid !== idToRemove);
    setTargetIds(next);
    setManualIdsRaw(next.join(", "));
  };

  const handleManualIdsChange = (val) => {
    setManualIdsRaw(val);
    setTargetIds(
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);

    if (!name.trim()) {
      setError("Timer name is required.");
      return;
    }

    if (timerType === "fixed") {
      if (!endDate) {
        setError("End date is required for fixed timers.");
        return;
      }
      if (startDate && new Date(endDate) <= new Date(startDate)) {
        setError("End date must be after start date.");
        return;
      }
    } else {
      const hours = Number(durationHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        setError("Duration must be greater than 0 hours.");
        return;
      }
    }

    if (targetType !== "all" && targetIds.length === 0) {
      setError(`Please select at least one ${targetType}.`);
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      labelText: labelText.trim() || "YOUR SPECIAL OFFER ENDS IN",
      timerType,
      startDate: timerType === "fixed" && startDate ? new Date(startDate).toISOString() : undefined,
      endDate: timerType === "fixed" && endDate ? new Date(endDate).toISOString() : undefined,
      durationHours: timerType === "evergreen" ? Number(durationHours) || 24 : undefined,
      targetType,
      targetIds: targetType === "all" ? [] : targetIds,
      design,
      status,
    };

    try {
      if (isNew) {
        await createTimer(payload);
      } else {
        await updateTimer(id, payload);
      }
      navigate("/timers");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="admin-page-title">Edit Timer</div>
        <div className="admin-form-section">
          <p style={{ color: "#6d7175" }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "8px",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate("/timers")}
            style={{
              background: "none",
              border: "none",
              color: "#6d7175",
              fontSize: "14px",
              marginBottom: "8px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Timers
          </button>
          <div className="admin-page-title">{isNew ? "Create New Timer" : "Edit Timer"}</div>
          <div className="admin-page-subtitle">
            {isNew ? "Add a new countdown timer for your storefront." : "Update your timer settings."}
          </div>
        </div>
        <Button variant="primary" onClick={handleSubmit} loading={saving}>
          Save
        </Button>
      </div>

      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <div className="admin-form-section">
          <div className="admin-form-section-title">Basics</div>
          <FormLayout>
            <TextField
              label="Timer name"
              value={name}
              onChange={setName}
              requiredIndicator
              autoComplete="off"
              placeholder="e.g. Flash Sale Weekend"
            />
            <TextField
              label="Offer headline text"
              value={labelText}
              onChange={setLabelText}
              autoComplete="off"
              helpText="Displayed next to the countdown on the storefront."
            />
            <TextField
              label="Promotion description"
              value={description}
              onChange={setDescription}
              multiline={3}
              autoComplete="off"
              placeholder="Optional details shown under the timer"
            />
            <Select
              label="Timer type"
              options={TIMER_TYPES}
              value={timerType}
              onChange={setTimerType}
            />
            <Select
              label="Status"
              options={[
                { label: "Active", value: "active" },
                { label: "Paused", value: "paused" },
                { label: "Draft", value: "draft" },
              ]}
              value={status}
              onChange={setStatus}
            />
          </FormLayout>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">Schedule</div>
          <FormLayout>
            {timerType === "fixed" && (
              <>
                <TextField
                  type="datetime-local"
                  label="Start date & time"
                  value={startDate}
                  onChange={setStartDate}
                />
                <TextField
                  type="datetime-local"
                  label="End date & time"
                  value={endDate}
                  onChange={setEndDate}
                  requiredIndicator
                />
              </>
            )}
            {timerType === "evergreen" && (
              <TextField
                type="number"
                label="Duration (hours)"
                value={durationHours}
                onChange={setDurationHours}
                min={1}
              />
            )}
          </FormLayout>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">Targeting</div>
          <FormLayout>
            <Select
              label="Apply timer to"
              options={TARGET_TYPES}
              value={targetType}
              onChange={(val) => {
                setTargetType(val);
                if (val === "all") {
                  setTargetIds([]);
                  setManualIdsRaw("");
                }
              }}
            />
            {targetType !== "all" && (
              <BlockStack gap="300">
                <InlineStack gap="300" blockAlign="center">
                  {hasResourcePicker && (
                    <Button onClick={handleOpenResourcePicker}>
                      {targetType === "collection" ? "Select Collections" : "Select Products"}
                    </Button>
                  )}
                  <Text as="span" tone="subdued">
                    {targetIds.length} {targetType}(s) selected
                  </Text>
                </InlineStack>

                {targetIds.length > 0 && (
                  <InlineStack gap="200" wrap>
                    {targetIds.map((tid) => (
                      <Tag key={tid} onRemove={() => handleRemoveTargetId(tid)}>
                        {tid}
                      </Tag>
                    ))}
                  </InlineStack>
                )}

                <TextField
                  label={
                    hasResourcePicker
                      ? "Or enter IDs manually (comma-separated)"
                      : "Target IDs (comma-separated)"
                  }
                  value={manualIdsRaw}
                  onChange={handleManualIdsChange}
                  placeholder={
                    targetType === "collection"
                      ? "gid://shopify/Collection/123"
                      : "gid://shopify/Product/123, gid://shopify/Product/456"
                  }
                  helpText={
                    hasResourcePicker
                      ? "Use Shopify Resource Picker above or paste GID/numeric IDs."
                      : "Running outside Shopify Admin: enter Shopify GID or numeric IDs."
                  }
                  autoComplete="off"
                />
              </BlockStack>
            )}
          </FormLayout>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">Design & Urgency</div>
          <FormLayout>
            <InlineStack gap="400" wrap>
              <Select
                label="Timer size"
                options={SIZES}
                value={design.size}
                onChange={(v) => setDesign((d) => ({ ...d, size: v }))}
              />
              <Select
                label="Timer position"
                options={POSITIONS}
                value={design.position}
                onChange={(v) => setDesign((d) => ({ ...d, position: v }))}
              />
              <Select
                label="Urgency notification"
                options={URGENCY_OPTIONS}
                value={design.urgencyNotification}
                onChange={(v) => setDesign((d) => ({ ...d, urgencyNotification: v }))}
              />
            </InlineStack>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <TextField
                  label="Text color"
                  value={design.color}
                  onChange={(v) => setDesign((d) => ({ ...d, color: v }))}
                  type="color"
                  autoComplete="off"
                />
              </div>
              <div>
                <TextField
                  label="Background color"
                  value={design.background}
                  onChange={(v) => setDesign((d) => ({ ...d, background: v }))}
                  type="color"
                  autoComplete="off"
                />
              </div>
            </div>
          </FormLayout>
        </div>
      </BlockStack>
    </>
  );
}
