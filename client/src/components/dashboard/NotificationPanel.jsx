import { useState } from "react";
import { FaBell, FaWhatsapp, FaEnvelope, FaPaperPlane } from "react-icons/fa";
import { Sparkles, Send, Users, Zap, ExternalLink } from "lucide-react";

export default function NotificationPanel({
  groups,
  activeGroup,
  groupBalances,
  getMemberName,
  profile,
  onSendReminder,
  onSendBulkReminders,
  notifLoading,
  notifMessage,
}) {
  const [selectedChannel, setSelectedChannel] = useState("both");
  const [selectedGroup, setSelectedGroup] = useState(activeGroup?._id || "");

  const channels = [
    { id: "both", label: "Both", icon: <Zap className="h-3.5 w-3.5" />, desc: "Email + WhatsApp" },
    { id: "email", label: "Email", icon: <FaEnvelope className="h-3.5 w-3.5" />, desc: "SMTP Email" },
    { id: "whatsapp", label: "WhatsApp", icon: <FaWhatsapp className="h-3.5 w-3.5" />, desc: "wa.me Link" },
  ];

  const settlements = groupBalances?.settlements || [];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #F59E0B, #EF4444)",
            boxShadow: "0 4px 14px rgba(245,158,11,0.25)"
          }}>
            <FaBell className="text-white text-lg" />
          </span>
          <div>
            <h2 className="m-0 text-lg font-black text-[#27187E]">Reminders & Notifications</h2>
            <p className="m-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Send via Email & WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {notifMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extrabold rounded-2xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <Sparkles className="h-4 w-4 shrink-0" />
          {notifMessage}
        </div>
      )}

      {/* Channel Toggle */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Notification Channel</h3>
        <div className="grid grid-cols-3 gap-2 bg-[#F8F9FA] p-1.5 rounded-xl border border-gray-200">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-0 cursor-pointer transition-all duration-200 ${
                selectedChannel === ch.id
                  ? "bg-[#27187E] text-white shadow-md shadow-[#27187E]/20"
                  : "bg-transparent text-[#5C5783] hover:text-[#27187E] hover:bg-white"
              }`}
            >
              {ch.icon}
              <span className="text-[11px] font-extrabold">{ch.label}</span>
              <span className={`text-[8px] font-bold ${selectedChannel === ch.id ? "text-white/70" : "text-gray-400"}`}>
                {ch.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Quick Remind Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400">Quick Remind — Individual</h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
              {settlements.length} settlement{settlements.length !== 1 ? "s" : ""}
            </span>
          </div>

          {!activeGroup ? (
            <div className="text-center py-8 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-200">
              <Users className="h-8 w-8 text-[#AEB8FE] mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-400 m-0">Select a group from "My Groups" tab to see pending settlements</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm font-extrabold text-emerald-700 m-0">All Settled!</p>
              <p className="text-[10px] font-bold text-emerald-500 m-0 mt-1">
                No pending payments in "{activeGroup.name}"
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
              {settlements.map((settle, idx) => {
                const fromName = getMemberName(settle.from);
                const toName = getMemberName(settle.to);
                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-[#FEFCE8] to-[#FFF7ED] rounded-xl border border-amber-100 transition hover:shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-sm shrink-0">
                        💸
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-gray-500 font-bold">
                          <span className="text-[#27187E] font-black">{fromName}</span>
                          {" owes "}
                          <span className="text-[#27187E] font-black">{toName}</span>
                        </span>
                        <span className="text-sm font-black text-rose-600">₹{settle.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Email button */}
                      {(selectedChannel === "email" || selectedChannel === "both") && (
                        <button
                          onClick={() => onSendReminder(settle.from, settle.amount, "email")}
                          disabled={notifLoading}
                          className="h-8 px-3 rounded-lg border-0 bg-indigo-50 hover:bg-indigo-100 text-[#27187E] text-[10px] font-black cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Send email reminder"
                        >
                          <FaEnvelope className="h-3 w-3" />
                          Email
                        </button>
                      )}
                      {/* WhatsApp button */}
                      {(selectedChannel === "whatsapp" || selectedChannel === "both") && (
                        <button
                          onClick={() => onSendReminder(settle.from, settle.amount, "whatsapp")}
                          disabled={notifLoading}
                          className="h-8 px-3 rounded-lg border-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Send WhatsApp reminder"
                        >
                          <FaWhatsapp className="h-3 w-3" />
                          WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Notify Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-4">
          <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400">Bulk Notify — Entire Group</h3>

          {!activeGroup ? (
            <div className="text-center py-8 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400 m-0">Select a group first</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Active Group Card */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                <div className="h-10 w-10 rounded-lg bg-[#27187E] text-white flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-black text-[#27187E] block truncate">{activeGroup.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{activeGroup.members?.length || 1} members</span>
                </div>
              </div>

              {/* Channel info */}
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-100 text-[11px] text-gray-500 font-medium leading-relaxed">
                <span className="font-black text-[#27187E]">📨 Channel:</span>{" "}
                {selectedChannel === "both"
                  ? "Email + WhatsApp — Emails will be sent to all members. WhatsApp links will open for members with phone numbers."
                  : selectedChannel === "email"
                  ? "Email — Reminder and balance summary emails will be sent to all group members."
                  : "WhatsApp — Deep links will be generated for all members with phone numbers registered."
                }
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => onSendBulkReminders(selectedChannel)}
                  disabled={notifLoading || settlements.length === 0}
                  className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-extrabold text-white cursor-pointer hover:from-amber-600 hover:to-orange-600 transition shadow-md shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {notifLoading ? "Sending Reminders..." : `Send Reminders to All Debtors (${settlements.length})`}
                </button>

                <p className="text-[10px] text-gray-400 font-bold m-0 text-center">
                  Sends payment reminders to debtors + balance summary to all members
                </p>
              </div>

              {/* Members list with contact info */}
              <div className="mt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 block">Group Members</span>
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                  {activeGroup.members?.map((member) => (
                    <div key={member._id} className="flex items-center justify-between p-2.5 bg-[#F8F9FA] rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-md bg-[#27187E]/10 text-[#27187E] flex items-center justify-center text-[10px] font-black shrink-0">
                          {member.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-extrabold text-[#27187E] truncate">{member.name}</span>
                          <span className="text-[9px] text-gray-400 font-medium truncate">{member.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">📧</span>
                        {member.phone && (
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">📱</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400 mb-4">How Notifications Work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <FaEnvelope className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[11px] font-black text-[#27187E] block">Email</span>
              <span className="text-[10px] text-gray-500 leading-relaxed">
                Beautifully styled reminder emails sent instantly via SMTP to member's inbox.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <FaWhatsapp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] font-black text-emerald-700 block">WhatsApp</span>
              <span className="text-[10px] text-gray-500 leading-relaxed">
                Opens WhatsApp with a pre-filled message. Member must have a phone number saved.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-700 block">Both</span>
              <span className="text-[10px] text-gray-500 leading-relaxed">
                Sends email + generates WhatsApp link simultaneously for maximum reach.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
