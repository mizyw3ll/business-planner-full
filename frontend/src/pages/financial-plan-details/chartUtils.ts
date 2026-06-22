import type { ChartPoint } from "../../api";

export function getLocalDateTimeWithSeconds(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

export type Timeframe = "1W" | "1M" | "3M" | "1Y";

type TimeframeConfig = {
  rangeMs: number;
  bucket: "day" | "week" | "month";
};

export type AggregatedPoint = {
  date: string;
  timestamp: number;
  income: number;
  expense: number;
  total: number;
};

const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  "1W": { rangeMs: 7 * 24 * 60 * 60 * 1000, bucket: "day" },
  "1M": { rangeMs: 30 * 24 * 60 * 60 * 1000, bucket: "day" },
  "3M": { rangeMs: 90 * 24 * 60 * 60 * 1000, bucket: "week" },
  "1Y": { rangeMs: 365 * 24 * 60 * 60 * 1000, bucket: "month" },
};

function getBucketDate(date: Date, bucket: TimeframeConfig["bucket"]) {
  if (bucket === "day") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  if (bucket === "week") {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.getFullYear(), date.getMonth(), diff);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getBucketLabel(date: Date, bucket: TimeframeConfig["bucket"]) {
  if (bucket === "day") {
    return date.toLocaleDateString();
  }
  if (bucket === "week") {
    const weekStart = new Date(date);
    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }
  return date.toLocaleString([], { month: "long", year: "numeric" });
}

export function buildChartData(points: ChartPoint[], timeframe: Timeframe): AggregatedPoint[] {
  const now = Date.now();
  const { rangeMs, bucket } = TIMEFRAME_CONFIG[timeframe];
  const threshold = rangeMs > 0 ? now - rangeMs : 0;

  const filteredPoints = rangeMs > 0 ? points.filter((point) => new Date(point.date).getTime() >= threshold) : points;
  const sortedPoints = filteredPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const aggregated = new Map<number, AggregatedPoint>();
  let runningTotal = 0;

  sortedPoints.forEach((point) => {
    const pointDate = new Date(point.date);
    const bucketDate = getBucketDate(pointDate, bucket);
    const bucketTimestamp = bucketDate.getTime();
    const amount = Number(point.amount);

    if (point.type === "income") {
      runningTotal += amount;
    } else {
      runningTotal -= amount;
    }

    const existing = aggregated.get(bucketTimestamp);
    if (existing) {
      if (point.type === "income") existing.income += amount;
      else existing.expense += amount;
      existing.total = runningTotal;
    } else {
      aggregated.set(bucketTimestamp, {
        date: getBucketLabel(bucketDate, bucket),
        timestamp: bucketTimestamp,
        income: point.type === "income" ? amount : 0,
        expense: point.type === "expense" ? amount : 0,
        total: runningTotal,
      });
    }
  });

  return Array.from(aggregated.values()).sort((a, b) => a.timestamp - b.timestamp);
}
