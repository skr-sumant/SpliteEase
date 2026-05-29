import { useState } from "react";
import {
  FaChartLine,
  FaUsers,
  FaMoneyBillWave,
  FaCameraRetro,
  FaSignOutAlt,
  FaRobot,
  FaUserCog,
  FaBell
} from "react-icons/fa";
import { Sparkles, House, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: "groups", name: "My Groups", icon: FaUsers },
    { id: "add-expense", name: "Add Expense", icon: FaMoneyBillWave },
    { id: "ocr-scan", name: "AI OCR Scanner", icon: FaCameraRetro },
    { id: "analytics", name: "AI Analytics", icon: FaChartLine },
    { id: "notifications", name: "Reminders", icon: FaBell },
    { id: "profile", name: "My Profile", icon: FaUserCog }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div>
        {/* Brand logo */}
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </span>
          <span className="text-2xl font-black tracking-tight text-white">
            Split<span className="text-[#758BFD]">Ease</span>
          </span>
        </div>

      

        {/* Navigation list */}
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-0 text-sm font-bold text-left cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#27187E] to-[#5C4BD6] text-white shadow-md shadow-[#27187E]/30"
                    : "bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout button at bottom */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-0 text-sm font-bold text-left cursor-pointer bg-red-950/20 text-[#FF5D73] hover:bg-[#FFECEF] hover:text-[#FF5D73] transition duration-200"
      >
        <FaSignOutAlt className="h-4 w-4 shrink-0" />
        <span>Logout</span>
      </button>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-xl bg-[#111827] text-white border-0 flex items-center justify-center cursor-pointer shadow-lg shadow-black/20"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex w-64 bg-[#111827] text-white p-6 flex-col justify-between h-full min-h-screen relative z-30 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-in sidebar */}
          <div
            className="absolute top-0 left-0 bottom-0 w-72 bg-[#111827] text-white p-6 flex flex-col justify-between overflow-y-auto"
            style={{
              animation: "slideInLeft 0.25s ease-out"
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-gray-800 text-gray-400 border-0 flex items-center justify-center cursor-pointer hover:bg-gray-700 hover:text-white transition"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar — fixed at bottom on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-gray-800 px-2 py-1.5 flex items-center justify-around safe-bottom">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border-0 cursor-pointer transition-all duration-200 min-w-0 ${
                isActive
                  ? "bg-[#27187E]/30 text-[#758BFD]"
                  : "bg-transparent text-gray-500"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[8px] font-bold truncate max-w-[48px]">
                {item.id === "add-expense" ? "Add" : item.id === "ocr-scan" ? "Scan" : item.id === "ai-advisor" ? "AI" : item.id === "analytics" ? "Stats" : item.id === "notifications" ? "Notify" : item.id === "profile" ? "Profile" : "Groups"}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
