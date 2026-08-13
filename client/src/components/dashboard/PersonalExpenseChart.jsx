import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList
} from "recharts";
import { motion } from "framer-motion";

const COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#F43F5E",
  "#3B82F6"
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(17, 12, 46, 0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }}>
        <p style={{ margin: 0, color: "#a5b4fc", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <p style={{ margin: "4px 0 0", color: "#fff", fontSize: "16px", fontWeight: 900 }}>
          ₹{payload[0].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle"
      style={{ fontSize: "10px", fontWeight: 800, fill: "#6366F1" }}>
      ₹{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
    </text>
  );
};

export default function PersonalExpenseChart({ data }) {
  const chartData = data && Object.keys(data).length > 0
    ? Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0)
    : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-full min-h-[400px]"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="m-0 text-base font-black text-[#27187E] tracking-tight flex items-center gap-2">
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #10B981, #6366F1)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            Personal Expenditure
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[36px]">
            Your spending by category
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total</span>
          <span className="text-sm font-black text-[#27187E]">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="flex-grow min-h-[240px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={10}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList content={<CustomBarLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-xs font-bold text-gray-400 m-0">No personal spending data yet. Add a personal expense to see your breakdown!</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
