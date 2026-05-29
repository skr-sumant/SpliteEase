import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, TrendingUp, Star, Sparkles, Flame, Target, Zap } from "lucide-react";

const getInsightMeta = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("⚠") || lower.includes("high") || lower.includes("exceeded") || lower.includes("critical") || lower.includes("🚨")) {
    return {
      icon: AlertTriangle,
      gradient: "linear-gradient(135deg, #F43F5E, #FB923C)",
      bgColor: "rgba(244,63,94,0.06)",
      borderColor: "rgba(244,63,94,0.15)",
      iconColor: "#F43F5E"
    };
  }
  if (lower.includes("💡") || lower.includes("consider") || lower.includes("moderate") || lower.includes("tip")) {
    return {
      icon: Lightbulb,
      gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
      bgColor: "rgba(245,158,11,0.06)",
      borderColor: "rgba(245,158,11,0.15)",
      iconColor: "#F59E0B"
    };
  }
  if (lower.includes("🔥") || lower.includes("saved") || lower.includes("great")) {
    return {
      icon: Flame,
      gradient: "linear-gradient(135deg, #10B981, #34D399)",
      bgColor: "rgba(16,185,129,0.06)",
      borderColor: "rgba(16,185,129,0.15)",
      iconColor: "#10B981"
    };
  }
  if (lower.includes("✨") || lower.includes("budget") || lower.includes("normal") || lower.includes("excellent") || lower.includes("🎉")) {
    return {
      icon: Star,
      gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)",
      bgColor: "rgba(99,102,241,0.06)",
      borderColor: "rgba(99,102,241,0.15)",
      iconColor: "#6366F1"
    };
  }
  return {
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    bgColor: "rgba(99,102,241,0.06)",
    borderColor: "rgba(99,102,241,0.15)",
    iconColor: "#6366F1"
  };
};

// Strip emoji prefixes from insight text for cleaner display
const cleanText = (text) => {
  return text.replace(/^[⚠💡🔥✨🚨🎉]\s*/u, "").trim();
};

export default function InsightsCard({ insights }) {
  const defaultInsights = [
    "⚠ High food spending this month",
    "💡 Transport costs increased",
    "🔥 You saved 20% this week",
    "✨ Great job! Your overall budget is currently within normal limits."
  ];

  const list = insights && insights.length > 0 ? insights : defaultInsights;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)" }}
    >
      <div className="flex flex-col gap-0.5 mb-5">
        <h3 className="m-0 text-base font-black text-[#27187E] tracking-tight flex items-center gap-2">
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #6366F1, #EC4899)",
          }}>
            <Zap size={14} color="#fff" strokeWidth={2.5} />
          </span>
          AI Smart Insights
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[36px]">
          Personalized recommendations
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {list.map((item, index) => {
          const meta = getInsightMeta(item);
          const IconComp = meta.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="relative p-4 rounded-xl flex items-start gap-3 overflow-hidden transition-all duration-200"
              style={{
                background: meta.bgColor,
                border: `1px solid ${meta.borderColor}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${meta.borderColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Gradient left bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ background: meta.gradient }}
              />

              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: meta.gradient }}
              >
                <IconComp size={15} color="#fff" strokeWidth={2.5} />
              </div>

              <p className="m-0 text-[12px] font-bold text-[#27187E] leading-relaxed flex-1">
                {cleanText(item)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
