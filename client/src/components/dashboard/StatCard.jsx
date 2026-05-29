import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const num = typeof target === "number" ? target : parseFloat(String(target).replace(/[^0-9.-]/g, "")) || 0;
    if (num === 0) { setValue(0); return; }

    let start = prevTarget.current;
    const diff = num - start;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTarget.current = num;
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

export default function StatCard({ title, value, icon: Icon, colorClass = "bg-[#758BFD]/10 text-[#27187E]" }) {
  // Detect if the value is numeric for animation
  const isNumeric = typeof value === "number" || (typeof value === "string" && /^[\u20b9$\u00a3\u20ac]?\s*[\d,.]+$/.test(value));
  const numericValue = isNumeric
    ? (typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, "")))
    : 0;
  const prefix = typeof value === "string" ? value.match(/^([\u20b9$\u00a3\u20ac])/)?.[1] || "" : "";

  const animatedValue = useCountUp(numericValue);

  const displayValue = isNumeric
    ? `${prefix}${Math.round(animatedValue).toLocaleString("en-IN")}`
    : value;

  // Parse color from colorClass for gradient
  const gradientMap = {
    "#758BFD": "linear-gradient(135deg, #6366F1, #818CF8)",
    "#27187E": "linear-gradient(135deg, #27187E, #4338CA)",
    "#10B981": "linear-gradient(135deg, #10B981, #34D399)",
    "#F59E0B": "linear-gradient(135deg, #F59E0B, #FBBF24)",
    "#F43F5E": "linear-gradient(135deg, #F43F5E, #FB7185)",
    "#EC4899": "linear-gradient(135deg, #EC4899, #F472B6)"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between overflow-hidden cursor-default"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #fafaff 100%)" }}
    >
      {/* Subtle gradient accent in corner */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07]"
        style={{ background: gradientMap["#758BFD"] || gradientMap["#27187E"] }}
      />

      <div className="flex flex-col relative z-10">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {title}
        </span>
        <span className="text-2xl font-black mt-1.5 text-[#27187E] tracking-tight">
          {displayValue}
        </span>
      </div>

      {Icon && (
        <div
          className="relative z-10 h-11 w-11 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
          }}
        >
          <Icon className="h-5 w-5" style={{ color: "#fff" }} />
        </div>
      )}
    </motion.div>
  );
}
