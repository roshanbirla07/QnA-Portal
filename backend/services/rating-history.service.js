// Keep only dated source ratings; never generate a baseline or interpolate contests.
export const normalizeRatingHistory = (entries) => {
  if (!Array.isArray(entries)) return null;
  const points = entries.filter((item) => item && Number.isFinite(item.rating) && item.rating >= 0 &&
    Number.isFinite(item.timestamp) && item.timestamp > 0 &&
    Number.isFinite(new Date(item.timestamp * 1000).getTime()))
    .map((item) => ({ rating: item.rating, date: new Date(item.timestamp * 1000).toISOString(), contest: item.contest || "Contest" }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return entries.length && !points.length ? null : points;
};
