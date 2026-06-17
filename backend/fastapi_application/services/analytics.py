"""Analytics business logic for financial charts and business plans."""

from __future__ import annotations

from datetime import date as date_type

from core.models import FinancialChart


def compute_chart_analytics(chart: FinancialChart, *, include_series: bool = True) -> dict:
    points = sorted(chart.chart_points, key=lambda p: p.date)  # type: ignore[arg-type,return-value]
    income_total = sum(float(p.amount) for p in points if p.type == "income")
    expense_total = sum(float(p.amount) for p in points if p.type == "expense")
    net_total = income_total - expense_total

    first_point_at: date_type | None = points[0].date if points else None  # type: ignore[assignment]
    last_point_at: date_type | None = points[-1].date if points else None  # type: ignore[assignment]
    days_span = 0
    if first_point_at and last_point_at:
        days_span = max(1, (last_point_at - first_point_at).days or 1)

    series: list[dict] = []
    if include_series:
        cumulative = 0.0
        for point in points:
            amount = float(point.amount)
            net = amount if point.type == "income" else -amount
            cumulative += net
            series.append(
                {
                    "date": point.date,
                    "income": amount if point.type == "income" else 0.0,
                    "expense": amount if point.type == "expense" else 0.0,
                    "net": net,
                    "cumulative": cumulative,
                }
            )

    average_point_net = net_total / len(points) if points else 0.0
    average_daily_net = net_total / days_span if days_span else net_total

    return {
        "chart_id": chart.id,
        "currency_code": chart.currency.code,
        "points_count": len(points),
        "income_total": income_total,
        "expense_total": expense_total,
        "net_total": net_total,
        "average_daily_net": average_daily_net,
        "average_point_net": average_point_net,
        "first_point_at": first_point_at,
        "last_point_at": last_point_at,
        "series": series,
    }
