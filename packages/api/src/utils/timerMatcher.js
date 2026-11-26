export function normalizeProductIds(productId) {
  const id = String(productId).trim();
  if (!id) return [];
  if (id.startsWith("gid://")) {
    const numeric = id.split("/").pop();
    return numeric ? [id, numeric] : [id];
  }
  return [id, `gid://shopify/Product/${id}`];
}

export function normalizeCollectionIds(rawCollectionIds) {
  if (!rawCollectionIds) return [];
  const items = Array.isArray(rawCollectionIds)
    ? rawCollectionIds
    : String(rawCollectionIds).split(",");
  const set = new Set();
  for (const raw of items) {
    const id = String(raw).trim();
    if (!id) continue;
    set.add(id);
    if (id.startsWith("gid://")) {
      const numeric = id.split("/").pop();
      if (numeric) set.add(numeric);
    } else {
      set.add(`gid://shopify/Collection/${id}`);
    }
  }
  return Array.from(set);
}

export function isTimerCurrentlyActive(timer, now = new Date()) {
  if (!timer || timer.status !== "active") return false;
  if (timer.timerType === "fixed") {
    if (timer.startDate && new Date(timer.startDate) > now) return false;
    if (timer.endDate && new Date(timer.endDate) < now) return false;
  }
  return true;
}

const TARGET_PRIORITY = { product: 3, collection: 2, all: 1 };

export function selectBestMatchingTimer(timers, productCandidates, collectionCandidates, now = new Date()) {
  const productSet = new Set(productCandidates);
  const collectionSet = new Set(collectionCandidates);

  const matching = (timers || []).filter((t) => {
    if (!isTimerCurrentlyActive(t, now)) return false;
    if (t.targetType === "product") {
      return (t.targetIds || []).some((id) => productSet.has(String(id)));
    }
    if (t.targetType === "collection") {
      return (t.targetIds || []).some((id) => collectionSet.has(String(id)));
    }
    if (t.targetType === "all") {
      return true;
    }
    return false;
  });

  if (matching.length === 0) return null;

  matching.sort((a, b) => {
    const pa = TARGET_PRIORITY[a.targetType] || 0;
    const pb = TARGET_PRIORITY[b.targetType] || 0;
    if (pb !== pa) return pb - pa;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return matching[0];
}
