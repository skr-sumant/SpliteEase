import { useState } from "react";
import { FaUserCircle, FaBell, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaUsers } from "react-icons/fa";

export default function Topbar({ activeTab, currency, activeGroupName, userName, userAvatar, notifications = [] }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifs, setReadNotifs] = useState(new Set());

  // Default dashboard updates if notifications list is empty
  const defaultUpdates = [
    {
      id: "n1",
      title: "Group Settlement Alert",
      text: "You have pending settlements in active groups. Send 1-click email reminders on the group page!",
      time: "Just now",
      icon: FaUsers,
      color: "text-[#758BFD] bg-indigo-50"
    },
    {
      id: "n2",
      title: "Monthly Spend Limit Tracker",
      text: "Keep track of your personal monthly budget limit right on your Personal Expenses feed.",
      time: "2h ago",
      icon: FaMoneyBillWave,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      id: "n3",
      title: "AI Receipt Scanner Ready",
      text: "Scan any restaurant or shopping receipt with OCR to auto-extract item prices into splits.",
      time: "1d ago",
      icon: FaCheckCircle,
      color: "text-amber-600 bg-amber-50"
    }
  ];

  const displayList = notifications.length > 0 ? notifications : defaultUpdates;
  const unreadCount = displayList.filter(n => !readNotifs.has(n.id || n._id)).length;

  const markAllRead = () => {
    const allIds = new Set(displayList.map(n => n.id || n._id));
    setReadNotifs(allIds);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "personal":
        return "Personal Expenses";
      case "groups":
        return "Trip & Group Splits";
      case "ocr-scan":
        return "Receipt Scanner";
      case "analytics":
        return "AI Financial Analytics";
      case "profile":
        return "My Account Profile";
      case "ai-advisor":
        return "SplitEase AI Advisor";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="bg-white border-b border-gray-200/80 px-4 py-3 md:px-6 md:py-4 rounded-2xl flex justify-between items-center shadow-sm relative z-30">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          <span>SplitEase</span>
          <span>/</span>
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-[#758BFD] font-extrabold">{getTabTitle()}</span>
          {activeGroupName && activeTab === "groups" && (
            <>
              <span>/</span>
              <span className="text-[#27187E] font-black truncate max-w-[80px] sm:max-w-[120px]">{activeGroupName}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="m-0 text-base md:text-xl font-black text-[#27187E] tracking-tight truncate pl-10 md:pl-0">
          {getTabTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        {currency && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#27187E]/5 px-3 py-1 text-xs font-bold text-[#27187E]">
            {currency}
          </span>
        )}

        {/* NOTIFICATION BELL ICON WITH DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#27187E] border-0 cursor-pointer flex items-center justify-center relative transition"
            title="Dashboard Updates & Notifications"
          >
            <FaBell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION POPUP DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl z-50 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#27187E]">Dashboard Updates</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-[#758BFD] hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {displayList.map((item, idx) => {
                  const idKey = item.id || item._id || idx;
                  const isRead = readNotifs.has(idKey);
                  const IconComp = item.icon || FaBell;

                  return (
                    <div
                      key={idKey}
                      onClick={() => {
                        setReadNotifs(prev => new Set(prev).add(idKey));
                      }}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
                        isRead ? "bg-white border-gray-100 opacity-65" : "bg-indigo-50/40 border-indigo-100"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${item.color || "text-[#27187E] bg-indigo-50"}`}>
                        <IconComp />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#27187E] truncate">{item.title || item.senderName || "Update"}</span>
                          <span className="text-[9px] font-bold text-gray-400">{item.time || "Recently"}</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 m-0 leading-snug line-clamp-2">
                          {item.text || item.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* USER AVATAR */}
        <div className="flex items-center gap-2 text-[#27187E]">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="Avatar" 
              className="h-8 w-8 rounded-full object-cover border border-[#27187E]/20"
            />
          ) : (
            <FaUserCircle className="h-7 w-7 text-[#758BFD]" />
          )}
          <span className="text-sm font-extrabold hidden md:inline">{userName || "User"} 👋</span>
        </div>
      </div>
    </div>
  );
}
