const PREFIX = "helixo_timer_";

export function getEvergreenStart(timerId) {
  if (!timerId) return null;
  try {
    const raw = localStorage.getItem(PREFIX + timerId + "_start");
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setEvergreenStart(timerId) {
  if (!timerId) return;
  try {
    localStorage.setItem(PREFIX + timerId + "_start", String(Date.now()));
  } catch (_) {}
}

export function getEvergreenEndTime(timerId, durationHours) {
  const start = getEvergreenStart(timerId);
  if (start == null) return null;
  return start + durationHours * 60 * 60 * 1000;
}

export function ensureEvergreenEndTime(timerId, durationHours) {
  const existingEnd = getEvergreenEndTime(timerId, durationHours);
  if (existingEnd != null && existingEnd > Date.now()) {
    return existingEnd;
  }
  setEvergreenStart(timerId);
  return getEvergreenEndTime(timerId, durationHours);
}
