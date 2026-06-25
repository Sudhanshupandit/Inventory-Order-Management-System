import React, { useMemo, useState } from 'react';
import { formatINR } from '../utils/currency';
import { IconRevenue } from './Icons';

/* Builds the last `days` calendar buckets (oldest -> newest). */
function buildBuckets(orders, days) {
  const buckets = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets.push({
      key: d.toDateString(),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: 0,
      count: 0,
    });
  }

  const index = new Map(buckets.map((b) => [b.key, b]));
  (orders || []).forEach((o) => {
    if (!o.created_at) return;
    const key = new Date(o.created_at).toDateString();
    const bucket = index.get(key);
    if (bucket) {
      bucket.revenue += Number(o.total_amount) || 0;
      bucket.count += 1;
    }
  });

  return buckets;
}

/* Smooth (Catmull-Rom -> cubic Bézier) path through normalized points. */
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const TOP = 12;     // top padding (% of plot)
const BOTTOM = 88;  // baseline (% of plot)

export default function RevenueChart({ orders = [], days = 7 }) {
  const [hover, setHover] = useState(null);

  const buckets = useMemo(() => buildBuckets(orders, days), [orders, days]);

  const maxRevenue = Math.max(...buckets.map((b) => b.revenue), 1);
  const totalRevenue = buckets.reduce((s, b) => s + b.revenue, 0);
  const totalOrders = buckets.reduce((s, b) => s + b.count, 0);
  const n = buckets.length;

  // Normalized 0..100 coordinate space (x = column, y = value).
  const points = buckets.map((b, i) => ({
    ...b,
    x: n === 1 ? 50 : (i / (n - 1)) * 100,
    y: BOTTOM - (b.revenue / maxRevenue) * (BOTTOM - TOP),
  }));

  const linePath = smoothPath(points);
  const areaPath = linePath
    ? `${linePath} L ${points[n - 1].x} 100 L ${points[0].x} 100 Z`
    : '';

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <span className="chart-icon"><IconRevenue size={18} /></span>
        <div>
          <h3 className="section-title">Revenue Trend</h3>
          <p className="chart-sub">Revenue and orders over the last {days} days.</p>
        </div>
        <div className="chart-totals">
          <div className="chart-total">
            <span className="chart-total-value">{formatINR(totalRevenue)}</span>
            <span className="chart-total-label">Revenue</span>
          </div>
          <div className="chart-total">
            <span className="chart-total-value">{totalOrders}</span>
            <span className="chart-total-label">Orders</span>
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>

          {[TOP, (TOP + BOTTOM) / 2, BOTTOM].map((y, i) => (
            <line
              key={i}
              className="chart-grid"
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {areaPath && <path d={areaPath} fill="url(#revArea)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#revLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* HTML overlay: guide line, crisp dots, hit areas — never distorted */}
        <div className="chart-overlay" style={{ display: totalOrders === 0 ? 'none' : 'block' }}>
          {active && <span className="chart-guide" style={{ left: `${active.x}%` }} />}

          {points.map((p, i) => (
            <span
              key={p.key}
              className={`chart-dot ${hover === i ? 'is-active' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            />
          ))}

          {points.map((p, i) => (
            <span
              key={`hit-${p.key}`}
              className="chart-hit"
              style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {active && (
            <div
              className={`chart-tooltip ${active.x > 75 ? 'align-right' : active.x < 25 ? 'align-left' : ''}`}
              style={{ left: `${active.x}%`, top: `${active.y}%` }}
            >
              <span className="chart-tooltip-rev">{formatINR(active.revenue)}</span>
              <span className="chart-tooltip-sub">
                <b>{active.count}</b> order{active.count === 1 ? '' : 's'} · {active.dateLabel}
              </span>
            </div>
          )}
        </div>

        <div className="chart-axis">
          {points.map((p) => (
            <span key={p.key} className={hover !== null && p.key === active?.key ? 'is-active' : ''}>
              {p.label}
            </span>
          ))}
        </div>

        {totalOrders === 0 && (
          <div className="chart-empty">No orders yet — your revenue trend will appear here.</div>
        )}
      </div>
    </div>
  );
}
