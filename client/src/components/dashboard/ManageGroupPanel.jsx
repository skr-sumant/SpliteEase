import { useState } from "react";
import { X, Users, UserPlus, Settings, Trash2, Mail, Phone, Edit3 } from "lucide-react";

export default function ManageGroupPanel({
  isOpen,
  onClose,
  activeGroup,
  editGroupName,
  setEditGroupName,
  inviteName, setInviteName,
  inviteEmail, setInviteEmail,
  inviteMobile, setInviteMobile,
  tempInvites,
  onAddTempInvite,
  onRemoveTempInvite,
  onRemoveMember,
  onRemoveInvitation,
  onSubmit,
  onDeleteGroup,
  updateLoading
}) {
  if (!isOpen || !activeGroup) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] md:w-[480px] bg-white z-[80] shadow-2xl overflow-y-auto flex flex-col"
        style={{ animation: "slideInRight 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            }}>
              <Settings size={16} color="#fff" strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="m-0 text-base font-black text-[#27187E]">Manage Group</h3>
              <p className="m-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Settings & Members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 border-0 flex items-center justify-center cursor-pointer transition"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 px-5 py-5 flex flex-col gap-5 overflow-y-auto">

            {/* Section 1: Group Name */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Edit3 size={14} className="text-[#758BFD]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#27187E]">Group Name</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Goa Trip 2026"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-4 text-sm font-bold text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Section 2: Members List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#758BFD]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#27187E]">
                    Members ({activeGroup.members?.length || 0})
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                {activeGroup.members?.map((member) => {
                  const creatorId = typeof activeGroup.createdBy === "object"
                    ? (activeGroup.createdBy?._id || activeGroup.createdBy)
                    : activeGroup.createdBy;
                  const isCreator = String(creatorId) === String(member._id);
                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white flex items-center justify-center text-xs font-black shrink-0">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#27187E] truncate flex items-center gap-1.5">
                            {member.name}
                            {isCreator && (
                              <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                            )}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">{member.email}</span>
                        </div>
                      </div>
                      {!isCreator && (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member._id)}
                          className="h-7 px-2.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[10px] font-bold text-rose-600 cursor-pointer transition shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Pending Invitations */}
            {activeGroup.invitations && activeGroup.invitations.some(i => i.status === "pending") && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-600">
                      Pending Invites ({activeGroup.invitations.filter(i => i.status === "pending").length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                    {activeGroup.invitations.filter(i => i.status === "pending").map((invite) => (
                      <div key={invite.email} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-amber-800 truncate">{invite.name}</span>
                          <span className="text-[10px] text-amber-600 truncate">{invite.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveInvitation(invite.email)}
                          className="h-7 px-2.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[10px] font-bold text-rose-600 cursor-pointer transition shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Section 4: Invite New Member */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <UserPlus size={14} className="text-[#758BFD]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#27187E]">Invite New Member</span>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Neha Sharma)"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-4 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
                />
                <input
                  type="email"
                  placeholder="Email Address (e.g. neha@gmail.com)"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-4 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (10 digits)"
                  value={inviteMobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setInviteMobile(val.slice(0, 10));
                  }}
                  pattern="\d{10}"
                  maxLength={10}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-4 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={onAddTempInvite}
                  className="h-10 w-full rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/50 text-[#27187E] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus size={14} />
                  Add to Invite Queue
                </button>
              </div>

              {/* Queued invites */}
              {tempInvites.length > 0 && (
                <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    Queued ({tempInvites.length})
                  </span>
                  {tempInvites.map((member, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100/50 text-xs">
                      <div className="flex flex-col min-w-0 truncate">
                        <span className="font-bold text-[#27187E] truncate">{member.name || "Guest"}</span>
                        <span className="text-[10px] text-gray-400 truncate">{member.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveTempInvite(index)}
                        className="h-6 px-2 rounded border-0 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold cursor-pointer transition shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="h-px bg-gray-100" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <Trash2 size={12} /> Danger Zone
              </span>
              <button
                type="button"
                onClick={onDeleteGroup}
                className="h-10 w-full rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Delete Group Permanently
              </button>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
            <button
              type="submit"
              disabled={updateLoading}
              className="h-12 w-full rounded-xl border-0 bg-[#27187E] text-sm font-extrabold text-white cursor-pointer hover:bg-[#1F1368] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#27187E]/15"
            >
              {updateLoading ? "Saving..." : "Save Changes & Send Invites"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
