import { sanitize } from "./sanitize.js";

const VALID_TIMER_TYPES = new Set(["fixed", "evergreen"]);
const VALID_TARGET_TYPES = new Set(["all", "product", "collection"]);
const VALID_STATUSES = new Set(["active", "paused", "draft"]);
const VALID_POSITIONS = new Set(["top", "bottom"]);
const VALID_SIZES = new Set(["small", "medium", "large"]);
const VALID_URGENCY = new Set(["none", "color_pulse", "shake"]);
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function sanitizeHexColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
}

export function normalizeDesign(design = {}, existing = {}) {
  const src = design && typeof design === "object" ? design : {};
  return {
    color: sanitizeHexColor(src.color, existing.color || "#ffffff"),
    background: sanitizeHexColor(src.background, existing.background || "#000000"),
    position: VALID_POSITIONS.has(src.position) ? src.position : existing.position || "top",
    size: VALID_SIZES.has(src.size) ? src.size : existing.size || "medium",
    urgencyNotification: VALID_URGENCY.has(src.urgencyNotification)
      ? src.urgencyNotification
      : existing.urgencyNotification || "color_pulse",
  };
}

export function validateTimerPayload(body, { isUpdate = false, existing = null } = {}) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const data = {};

  if (!isUpdate || body.name !== undefined) {
    const cleanName = sanitize(body.name);
    if (!cleanName) {
      return { valid: false, error: "Timer name is required" };
    }
    data.name = cleanName.slice(0, 200);
  }

  if (!isUpdate || body.description !== undefined) {
    data.description = body.description !== undefined ? sanitize(body.description).slice(0, 500) : "";
  }

  if (!isUpdate || body.labelText !== undefined) {
    const cleanLabel = body.labelText !== undefined ? sanitize(body.labelText).slice(0, 150) : "";
    data.labelText = cleanLabel || (isUpdate ? "" : "YOUR SPECIAL OFFER ENDS IN");
  }

  const timerType = body.timerType ?? (isUpdate ? undefined : "fixed");
  if (timerType !== undefined) {
    if (!VALID_TIMER_TYPES.has(timerType)) {
      return { valid: false, error: "timerType must be 'fixed' or 'evergreen'" };
    }
    data.timerType = timerType;
  }

  if (body.startDate !== undefined) {
    if (body.startDate === null || body.startDate === "") {
      data.startDate = null;
    } else {
      const d = new Date(body.startDate);
      if (Number.isNaN(d.getTime())) {
        return { valid: false, error: "Invalid startDate" };
      }
      data.startDate = d;
    }
  }

  if (body.endDate !== undefined) {
    if (body.endDate === null || body.endDate === "") {
      data.endDate = null;
    } else {
      const d = new Date(body.endDate);
      if (Number.isNaN(d.getTime())) {
        return { valid: false, error: "Invalid endDate" };
      }
      data.endDate = d;
    }
  }

  const effectiveStartDate = data.startDate !== undefined ? data.startDate : existing?.startDate;
  const effectiveEndDate = data.endDate !== undefined ? data.endDate : existing?.endDate;
  if (effectiveStartDate && effectiveEndDate && new Date(effectiveEndDate) <= new Date(effectiveStartDate)) {
    return { valid: false, error: "End date must be after start date" };
  }

  const effectiveTimerType = data.timerType ?? existing?.timerType ?? "fixed";
  if (effectiveTimerType === "fixed" && (!isUpdate || data.timerType === "fixed")) {
    if (!effectiveEndDate) {
      return { valid: false, error: "End date is required for fixed timers" };
    }
  }

  if (body.durationHours !== undefined || (!isUpdate && data.timerType === "evergreen")) {
    const hours = Number(body.durationHours ?? 24);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 8760) {
      return { valid: false, error: "durationHours must be a positive number up to 8760" };
    }
    data.durationHours = hours;
  }

  const targetType = body.targetType ?? (isUpdate ? undefined : "all");
  if (targetType !== undefined) {
    if (!VALID_TARGET_TYPES.has(targetType)) {
      return { valid: false, error: "targetType must be 'all', 'product', or 'collection'" };
    }
    data.targetType = targetType;
  }

  if (body.targetIds !== undefined || data.targetType === "all") {
    if (data.targetType === "all") {
      data.targetIds = [];
    } else if (Array.isArray(body.targetIds)) {
      data.targetIds = body.targetIds
        .map((id) => sanitize(String(id)))
        .filter(Boolean);
    } else if (!isUpdate) {
      data.targetIds = [];
    }
  }

  const effectiveTargetType = data.targetType ?? existing?.targetType ?? "all";
  if (effectiveTargetType !== "all") {
    const effectiveTargetIds = data.targetIds !== undefined ? data.targetIds : existing?.targetIds;
    if (!Array.isArray(effectiveTargetIds) || effectiveTargetIds.length === 0) {
      return { valid: false, error: `At least one ${effectiveTargetType} ID is required` };
    }
  }

  if (!isUpdate || body.design !== undefined) {
    data.design = normalizeDesign(body.design, existing?.design || {});
  }

  const status = body.status ?? (isUpdate ? undefined : "active");
  if (status !== undefined) {
    if (!VALID_STATUSES.has(status)) {
      return { valid: false, error: "status must be 'active', 'paused', or 'draft'" };
    }
    data.status = status;
  }

  return { valid: true, data };
}
