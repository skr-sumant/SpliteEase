import { FaUserCircle } from "react-icons/fa";

export default function Topbar({ activeTab, currency, activeGroupName, userName, userAvatar }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case "groups":
        return "Expense Groups";
      case "add-expense":
        return "Add Expense";
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
    <div className="bg-white border-b border-gray-200/80 px-4 py-3 md:px-6 md:py-4 rounded-2xl flex justify-between items-center shadow-sm relative z-20">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {/* Breadcrumb — hide on very small screens */}
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

        {/* Title — smaller on mobile, with left padding for hamburger */}
        <h2 className="m-0 text-base md:text-xl font-black text-[#27187E] tracking-tight truncate pl-10 md:pl-0">
          {getTabTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {currency && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#27187E]/5 px-3 py-1 text-xs font-bold text-[#27187E]">
            {currency}
          </span>
        )}
        <div className="flex items-center gap-2 text-[#27187E]">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="Avatar" 
              className="h-7 w-7 rounded-full object-cover border border-[#27187E]/20"
            />
          ) : (
            <FaUserCircle className="h-6 w-6 text-[#758BFD]" />
          )}
          <span className="text-sm font-extrabold hidden md:inline">{userName || "User"} 👋</span>
        </div>
      </div>
    </div>
  );
}
