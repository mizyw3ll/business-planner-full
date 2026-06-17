import { useEffect, useState } from "react";
import { getChartPointsBatchApi, type PlanBlock, type ChartPoint } from "../api";

export function useChartEmbedPoints(blocks: PlanBlock[]) {
  const [chartPointsById, setChartPointsById] = useState<Record<number, ChartPoint[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const chartIds = [
      ...new Set(blocks.filter((b) => b.block_type === "chart_embed").flatMap((b) => b.linked_financial_chart_ids)),
    ];
    if (chartIds.length === 0) {
      setChartPointsById({}); // eslint-disable-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getChartPointsBatchApi(chartIds)
      .then((data) => {
        if (!cancelled) setChartPointsById(data);
      })
      .catch(() => {
        if (!cancelled) setChartPointsById({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blocks]);

  return { chartPointsById, chartPointsLoading: loading };
}
