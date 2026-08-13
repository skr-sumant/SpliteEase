import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import { motion } from "framer-motion";

const COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#F43F5E", // Rose
  "#3B82F6"  // Blue
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        background: "rgba(17, 12, 46, 0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }}>
        <p style={{ margin: 0, color: "#fff", fontSize: "12px", fontWeight: 800 }}>
          {data.name}
        </p>
        <p style={{ margin: "4px 0 0", color: data.payload.fill, fontSize: "14px", fontWeight: 900 }}>
          ₹{data.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const renderActiveLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: "11px", fontWeight: 800 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function ExpensePieChart({ data }) {
  const chartData = data && Object.keys(data).length > 0
    ? Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0)
    : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const [animatedTotal, setAnimatedTotal] = useState(0);
  useEffect(() => {
    if (total === 0) return;
    let start = 0;
    const duration = 1200;
    const step = total / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= total) { start = total; clearInterval(timer); }
      setAnimatedTotal(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-full min-h-[400px]"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)" }}
    >
      <div className="flex flex-col gap-0.5 mb-3">
        <h3 className="m-0 text-base font-black text-[#27187E] tracking-tight flex items-center gap-2">
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          </span>
          Expense Breakdown
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[36px]">
          Spending by category
        </span>
      </div>

      {total > 0 ? (
        <>
          <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                  label={renderActiveLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
              <span className="text-xl font-black text-[#27187E]">
                ₹{animatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {chartData.map((item, idx) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-[11px] font-bold text-[#27187E] truncate flex-1">{item.name}</span>
                  <span className="text-[10px] font-extrabold text-gray-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <p className="text-xs font-bold text-gray-400 m-0">No spending data yet. Start logging expenses!</p>
        </div>
      )}
    </motion.div>
  );
}
