import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoneyBillWave, FaUsers, FaWallet, FaChartLine } from "react-icons/fa";
import {
  Users,
  IndianRupee,
  Plus,
  Minus,
  Sparkles,
  Camera,
  Check,
  ChevronRight,
  Calculator,
  UserPlus
} from "lucide-react";
import {
  getGroups,
  createGroup,
  addExpense,
  getBalances,
  scanReceipt,
  reconcileReceipt,
  getAnalytics,
  updateGroup,
  getPendingInvitations,
  acceptInvitation,
  deleteGroup,
  getExpenses,
  getProfile,
  updateProfile,
  sendAiMessage,
  deleteAccount,
  sendPaymentReminderAPI,
  sendBulkRemindersAPI
} from "../services/api";

// Premium Subcomponents
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import ExpensePieChart from "../components/dashboard/ExpensePieChart";
import MonthlyChart from "../components/dashboard/MonthlyChart";
import InsightsCard from "../components/dashboard/InsightsCard";
import ManageGroupPanel from "../components/dashboard/ManageGroupPanel";
import NotificationPanel from "../components/dashboard/NotificationPanel";

export default function Dashboard() {
  const navigate = useNavigate();

  // Auth & Profile
  const [details, setDetails] = useState({ phone: "", currency: "INR", bio: "" });
  const [profile, setProfile] = useState({ name: "Sumant", email: "", phone: "", currency: "INR", bio: "", avatar: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // AI Chat Assistant State
  const [aiMessages, setAiMessages] = useState([
    { sender: "ai", text: "🤖 Hello! I am your SplitEase AI Financial Advisor. Ask me anything about your spending, simplified settlements, drafting reminders, or OCR scanner tips!" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Groups
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupBalances, setGroupBalances] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);

  // Form States
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmails, setNewGroupEmails] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Expense Form States
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expSplitType, setExpSplitType] = useState("equal");
  const [expGroup, setExpGroup] = useState("");
  const [expLoading, setExpLoading] = useState(false);

  // Scanning State
  const [ocrFile, setOcrFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [ocrError, setOcrError] = useState("");
  const [editableOcrItems, setEditableOcrItems] = useState([]);

  // Reconciliation State
  const [reconciliationData, setReconciliationData] = useState(null);
  const [ocrGrandTotal, setOcrGrandTotal] = useState(0);
  const [isReconciling, setIsReconciling] = useState(false);

  // UI Tabs
  const [activeTab, setActiveTab] = useState("groups"); // "groups", "add-expense", "ocr-scan", "analytics"
  const [statusMessage, setStatusMessage] = useState("");

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Group Invitations & Editing States
  const [pendingInvites, setPendingInvites] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMobile, setInviteMobile] = useState("");
  const [tempInvites, setTempInvites] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Notification States
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const savedDetails = localStorage.getItem("user_details");
      if (savedDetails) {
        setDetails(JSON.parse(savedDetails));
      }
    } catch (e) {
      console.log("Error parsing user details", e);
    }

    fetchUserProfile();
    fetchUserGroups();
    fetchAnalyticsData();
    fetchPendingInvites();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data) {
        setProfile(res.data);
        setDetails({
          phone: res.data.phone || "",
          currency: res.data.currency || "INR",
          bio: res.data.bio || ""
        });
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    }
  };

  const getMemberName = (userId) => {
    if (!activeGroup) return "Group Member";
    
    // Find in members list
    const member = activeGroup.members?.find((m) => String(m._id) === String(userId));
    if (member) return member.name;
    
    // Check if creator
    const creator = activeGroup.createdBy;
    if (creator && String(creator._id || creator) === String(userId)) {
      return creator.name || "Group Creator";
    }

    // Default to profile name if matches current user
    if (profile && String(profile._id || profile.id) === String(userId)) {
      return profile.name;
    }
    
    return "Group Member";
  };

  const handleAiChatSubmit = async (e, directText) => {
    if (e) e.preventDefault();
    const queryText = directText || aiInput;
    if (!queryText.trim()) return;

    // Append user message
    const userMsg = { sender: "user", text: queryText };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await sendAiMessage(queryText, activeGroup?._id || null);
      if (res.data && res.data.reply) {
        setAiMessages(prev => [...prev, { sender: "ai", text: res.data.reply }]);
      } else {
        setAiMessages(prev => [...prev, { sender: "ai", text: "🤖 Sorry, I could not fetch a response from my AI backend right now. Please try again!" }]);
      }
    } catch (error) {
      setAiMessages(prev => [...prev, { sender: "ai", text: "🤖 Sorry, I encountered a communication error. Please ensure the backend is running." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");

    try {
      const res = await updateProfile(profile);
      if (res.data && res.data.user) {
        setProfile(res.data.user);
        setDetails({
          phone: res.data.user.phone || "",
          currency: res.data.user.currency || "INR",
          bio: res.data.user.bio || ""
        });
        localStorage.setItem("user_details", JSON.stringify({
          phone: res.data.user.phone || "",
          currency: res.data.user.currency || "INR",
          bio: res.data.user.bio || ""
        }));
        setProfileMessage("Profile updated successfully! ✅");
        setTimeout(() => setProfileMessage(""), 4000);
      }
    } catch (error) {
      setProfileMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = window.confirm(
      "WARNING: Are you sure you want to permanently delete your SplitEase account?\n\nThis will permanently delete all expense groups you created and their expenses, and remove you from other groups. This action is irreversible!"
    );
    if (!doubleConfirm) return;

    setProfileLoading(true);
    setProfileMessage("");
    try {
      await deleteAccount();
      // Clear authentication and profile details
      localStorage.removeItem("token");
      localStorage.removeItem("user_details");
      // Redirect to landing page
      navigate("/");
    } catch (error) {
      setProfileMessage(error.response?.data?.message || "Failed to delete account. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileUploadAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const fetchPendingInvites = async () => {
    try {
      const res = await getPendingInvitations();
      setPendingInvites(res.data);
    } catch (error) {
      console.log("Error fetching pending invites:", error);
    }
  };

  const handleAcceptInvite = async (groupId) => {
    try {
      setStatusMessage("Accepting invitation...");
      const res = await acceptInvitation(groupId);
      if (res.data.success) {
        setStatusMessage("Joined group successfully!");
        fetchPendingInvites();
        fetchUserGroups();
      } else {
        setStatusMessage("Failed to accept invitation.");
      }
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage("Error accepting invitation.");
    }
  };



  const handleAddTempInvite = () => {
    if (!inviteEmail) {
      alert("Please enter a valid email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert("Please enter a valid email address format.");
      return;
    }
    if (inviteMobile && inviteMobile.length !== 10) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }
    
    // Check duplicates in tempInvites
    if (tempInvites.some(i => i.email.toLowerCase().trim() === inviteEmail.toLowerCase().trim())) {
      alert("This email is already in your invite list.");
      return;
    }
    // Check duplicates in activeGroup members
    if (activeGroup?.members?.some(m => m.email.toLowerCase().trim() === inviteEmail.toLowerCase().trim())) {
      alert("This user is already a member of this group.");
      return;
    }
    // Check duplicates in activeGroup invitations
    if (activeGroup?.invitations?.some(i => i.email.toLowerCase().trim() === inviteEmail.toLowerCase().trim() && i.status === "pending")) {
      alert("This user already has a pending invitation to this group.");
      return;
    }

    setTempInvites([
      ...tempInvites,
      {
        name: inviteName || inviteEmail.split("@")[0],
        email: inviteEmail.toLowerCase().trim(),
        mobile: inviteMobile || ""
      }
    ]);

    setInviteName("");
    setInviteEmail("");
    setInviteMobile("");
  };

  const handleRemoveTempInvite = (index) => {
    setTempInvites(tempInvites.filter((_, i) => i !== index));
  };

  const handleUpdateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!activeGroup) return;

    setUpdateLoading(true);
    setStatusMessage("");
    try {
      const payload = {
        name: editGroupName,
        newMembers: [...tempInvites]
      };
      
      // Fallback: If they typed an email but didn't click "+ Add Member" before hitting Submit
      if (inviteEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(inviteEmail)) {
          payload.newMembers.push({
            name: inviteName || inviteEmail.split("@")[0],
            email: inviteEmail.toLowerCase().trim(),
            mobile: inviteMobile || ""
          });
        }
      }

      const res = await updateGroup(activeGroup._id, payload);
      setActiveGroup(res.data);
      setEditGroupName(res.data.name);
      setInviteName("");
      setInviteEmail("");
      setInviteMobile("");
      setTempInvites([]);
      setStatusMessage("Group details updated and invitations sent successfully!");
      fetchUserGroups();
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to update group.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) return;
    try {
      setStatusMessage("Removing member...");
      const res = await updateGroup(activeGroup._id, { removeMemberId: memberId });
      setActiveGroup(res.data);
      setStatusMessage("Member removed successfully!");
      fetchUserGroups();
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleRemoveInvitation = async (email) => {
    if (!window.confirm("Are you sure you want to cancel this pending invitation?")) return;
    try {
      setStatusMessage("Cancelling invitation...");
      const res = await updateGroup(activeGroup._id, { removeInvitationEmail: email });
      setActiveGroup(res.data);
      setStatusMessage("Invitation cancelled successfully!");
      fetchUserGroups();
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to cancel invitation.");
    }
  };

  const handleDeleteGroupClick = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete this group and all its expenses permanently? This action CANNOT be undone!")) return;
    try {
      setStatusMessage("Deleting group...");
      const res = await deleteGroup(activeGroup._id);
      if (res.data.success) {
        setStatusMessage("Group deleted successfully!");
        setActiveGroup(null);
        setShowManageGroup(false);
        fetchUserGroups();
        fetchAnalyticsData();
      }
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to delete group.");
    }
  };

  const fetchGroupExpenses = async (groupId) => {
    try {
      const res = await getExpenses(groupId);
      setExpenses(res.data);
    } catch (error) {
      console.log("Error fetching group expenses:", error);
    }
  };

  const fetchUserGroups = async () => {
    setGroupLoading(true);
    try {
      const res = await getGroups();
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        handleSelectGroup(res.data[0]);
      }
    } catch (error) {
      console.log("Error fetching groups:", error);
    } finally {
      setGroupLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const res = await getAnalytics();
      setAnalyticsData(res.data);
    } catch (error) {
      console.log("Error fetching analytics:", error);
      setAnalyticsError("Failed to fetch spending insights. Try logging some expenses first!");
    } finally {
      setAnalyticsLoading(false);
    }
  };



  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    setEditGroupName(group.name);
    setExpGroup(group._id);
    setGroupBalances(null);
    setShowManageGroup(false);
    setTempInvites([]); // Clear the invite queue when switching groups!
    fetchGroupExpenses(group._id);
    try {
      const res = await getBalances(group._id);
      setGroupBalances(res.data);
    } catch (error) {
      console.log("Error fetching group balances:", error);
    }
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;

    setCreateLoading(true);
    setStatusMessage("");
    try {
      const emailsArray = newGroupEmails
        ? newGroupEmails
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.length > 0)
        : [];

      await createGroup({
        name: newGroupName,
        members: [],
        emails: emailsArray
      });

      setNewGroupName("");
      setNewGroupEmails("");
      setStatusMessage("Group created successfully and invitations sent!");
      fetchUserGroups();
      fetchAnalyticsData();
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Group creation failed.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount || !expGroup) return;

    setExpLoading(true);
    setStatusMessage("");
    try {
      const targetGroup = groups.find((g) => g._id === expGroup);
      const members = targetGroup ? targetGroup.members.map((m) => m._id) : [];

      if (targetGroup) {
        const creatorId = typeof targetGroup.createdBy === "object" ? targetGroup.createdBy._id || targetGroup.createdBy : targetGroup.createdBy;
        if (creatorId && !members.includes(creatorId)) {
          members.push(creatorId);
        }
      }

      if (members.length === 0) {
        members.push("650d1a498b3f1c001f3eef4a", "650d1a498b3f1c001f3eef4b");
      }

      await addExpense({
        title: expTitle,
        amount: Number(expAmount),
        group: expGroup,
        participants: members,
        splitType: expSplitType
      });

      setExpTitle("");
      setExpAmount("");
      setStatusMessage("Expense logged and split successfully!");
      
      // Clear OCR scan data so the scan tab starts fresh
      setOcrFile(null);
      setOcrResults(null);
      setEditableOcrItems([]);
      setOcrGrandTotal(0);
      setReconciliationData(null);
      setOcrError("");

      // Refresh the group that received the expense
      if (targetGroup) {
        handleSelectGroup(targetGroup);
      } else if (activeGroup) {
        handleSelectGroup(activeGroup);
      }

      // Refresh groups list and analytics
      fetchUserGroups();
      fetchAnalyticsData();
      
      setTimeout(() => {
        setStatusMessage("");
        setActiveTab("groups");
      }, 2000);
    } catch (error) {
      setStatusMessage(error.response?.data?.error || error.response?.data?.message || "Logging expense failed.");
    } finally {
      setExpLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setOcrFile(e.target.files[0]);
    setOcrResults(null);
    setOcrError("");
    setReconciliationData(null);
    setOcrGrandTotal(0);
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!ocrFile) return;

    setIsScanning(true);
    setOcrResults(null);
    setOcrError("");
    setReconciliationData(null);

    const formData = new FormData();
    formData.append("receipt", ocrFile);

    try {
      const res = await scanReceipt(formData);
      if (res.data.success) {
        setOcrResults(res.data);
        setEditableOcrItems(res.data.items || []);
        setOcrGrandTotal(res.data.grandTotal || 0);
        if (res.data.reconciliation) {
          setReconciliationData(res.data.reconciliation);
        }
      } else {
        setOcrError("OCR processing failed.");
      }
    } catch (error) {
      setOcrError(error.response?.data?.error || "Error scanning receipt. Verify backend status.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleReReconcile = async () => {
    if (editableOcrItems.length === 0) return;
    setIsReconciling(true);
    try {
      const res = await reconcileReceipt({
        items: editableOcrItems,
        grandTotal: ocrGrandTotal,
        charges: ocrResults?.charges || {}
      });
      if (res.data.success && res.data.reconciliation) {
        setReconciliationData(res.data.reconciliation);
      }
    } catch (error) {
      console.error("Re-reconcile failed:", error);
    } finally {
      setIsReconciling(false);
    }
  };

  const autofillFromOcr = (totalAmount, itemsText) => {
    const finalAmount = reconciliationData?.finalTotal || totalAmount;
    setExpAmount(finalAmount);
    setExpTitle(itemsText || "Scanned Receipt Expense");
    // Auto-select the active group if no group is currently selected
    if (!expGroup && activeGroup) {
      setExpGroup(activeGroup._id);
    } else if (!expGroup && groups.length > 0) {
      setExpGroup(groups[0]._id);
    }
    setActiveTab("add-expense");
  };

  // 🔔 Notification Handlers
  const handleSendReminder = async (toUserId, amount, channel) => {
    if (!activeGroup) return;
    setNotifLoading(true);
    setNotifMessage("");
    try {
      const res = await sendPaymentReminderAPI({
        groupId: activeGroup._id,
        toUserId,
        amount,
        channel
      });
      
      if (res.data.success) {
        // If WhatsApp link was returned, open it
        if (res.data.results?.whatsapp && res.data.results.whatsapp.startsWith("https://")) {
          window.open(res.data.results.whatsapp, "_blank");
        }
        setNotifMessage(res.data.message || "Reminder sent successfully! ✅");
        setStatusMessage(res.data.message || "Reminder sent! ✅");
      }
      setTimeout(() => { setNotifMessage(""); setStatusMessage(""); }, 4000);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to send reminder.";
      setNotifMessage(errMsg);
      setStatusMessage(errMsg);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSendBulkReminders = async (channel) => {
    if (!activeGroup) return;
    setNotifLoading(true);
    setNotifMessage("");
    try {
      const res = await sendBulkRemindersAPI({
        groupId: activeGroup._id,
        channel
      });

      if (res.data.success) {
        // If WhatsApp links were returned, open the first one
        if (res.data.results?.whatsappLinks?.length > 0) {
          // Open all WhatsApp links (browser may block popups for multiple)
          for (const waLink of res.data.results.whatsappLinks) {
            window.open(waLink.link, "_blank");
          }
        }
        setNotifMessage(res.data.message || "Bulk reminders sent! ✅");
        setStatusMessage(res.data.message || "Bulk reminders sent! ✅");
      }
      setTimeout(() => { setNotifMessage(""); setStatusMessage(""); }, 4000);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to send bulk reminders.";
      setNotifMessage(errMsg);
      setStatusMessage(errMsg);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_details");
    navigate("/");
  };

  // Helper values for Stats
  const totalExpensesLogged = analyticsData?.analytics?.totalSpent || 0;
  const groupsCount = groups.length;
  
  // Calculate a mock pending balance from simplified settlements
  const calculatedPendingBalance = groupBalances?.settlements?.reduce((sum, s) => sum + s.amount, 0) || 0;

  return (
    <div className="flex bg-[#F8F9FA] min-h-screen relative overflow-hidden">
      
      {/* Decorative meshes */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-200/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "analytics") fetchAnalyticsData();
        }}
        onLogout={handleLogout}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 p-3 pt-16 md:p-8 md:pt-8 pb-24 md:pb-8 flex flex-col gap-4 md:gap-6 max-h-screen overflow-y-auto relative z-10">
        
        {/* Topbar header info */}
        <Topbar 
          activeTab={activeTab} 
          currency={details.currency} 
          activeGroupName={activeGroup?.name || null}
          userName={profile.name}
          userAvatar={profile.avatar}
        />

        {/* Pending Group Invitations Banner */}
        {pendingInvites.length > 0 && (
          <div className="flex flex-col gap-3 p-5 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl animate-fadeIn shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </span>
              <span className="text-sm font-black text-[#27187E]">
                Pending Group Invitations ({pendingInvites.length})
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              {pendingInvites.map((group) => (
                <div key={group._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-indigo-100/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-[#27187E]">{group.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Invited by {group.createdBy?.name || "Group Creator"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAcceptInvite(group._id)}
                    className="h-9 px-4 rounded-lg border-0 bg-[#27187E] hover:bg-[#1f1368] text-xs font-black text-white cursor-pointer transition active:scale-[0.97]"
                  >
                    Accept Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global status alert messages */}
        {statusMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extrabold rounded-2xl flex items-center gap-2 animate-fadeIn shadow-sm">
            <Check className="h-4.5 w-4.5 shrink-0" />
            {statusMessage}
          </div>
        )}

        {/* TAB 1: GROUPS VIEW */}
        {activeTab === "groups" && (
          <div className="grid gap-4 md:gap-6 lg:grid-cols-12 items-start animate-fadeIn">
            
            {/* Left side: Group Selector */}
            <div className="lg:col-span-4 flex flex-col gap-4 md:gap-5">
              
              {/* Profile Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white flex items-center justify-center font-black text-base shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="m-0 text-sm font-black text-[#27187E] truncate">{profile.name || "User"}</h3>
                    <p className="m-0 text-[10px] font-bold text-gray-400 mt-0.5 tracking-wider uppercase truncate">{details.bio || "SplitEase Member"}</p>
                  </div>
                </div>
              </div>

              {/* Groups List */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">My Groups</span>
                  <span className="text-[10px] bg-[#758BFD]/10 text-[#27187E] px-2 py-0.5 rounded-full font-bold">{groups.length}</span>
                </div>

                {groupLoading ? (
                  <p className="text-xs text-gray-400 m-0 py-2">Loading...</p>
                ) : groups.length === 0 ? (
                  <div className="text-center py-4 bg-[#F7F7FF] rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 m-0">No groups yet. Create one below!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
                    {groups.map((group) => {
                      const isSelected = activeGroup && activeGroup._id === group._id;
                      return (
                        <button
                          key={group._id}
                          onClick={() => handleSelectGroup(group)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/60 border-[#27187E]/25 shadow-sm"
                              : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-[#27187E] text-white" : "bg-[#27187E]/5 text-[#27187E]"
                            }`}>
                              <Users className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-extrabold text-[#27187E] block truncate">{group.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold">{group.members?.length || 1} members</span>
                            </div>
                          </div>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? "text-[#27187E] translate-x-0.5" : "text-gray-300"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline create group */}
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <form onSubmit={handleCreateGroupSubmit} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="New group name..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                      className="h-10 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
                    />
                    <input
                      type="text"
                      placeholder="Friend emails (comma-separated)"
                      value={newGroupEmails}
                      onChange={(e) => setNewGroupEmails(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="h-10 w-full rounded-xl border-0 bg-[#27187E] text-xs font-extrabold text-white cursor-pointer hover:bg-[#1F1368] transition disabled:opacity-50"
                    >
                      {createLoading ? "Creating..." : "+ Create Group"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right side: Group Details */}
            <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">
              
              {activeGroup ? (
                <>
                  {/* Group Header */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-bl-full opacity-60 -z-10" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <h2 className="m-0 text-lg md:text-xl font-black text-[#27187E] tracking-tight truncate">{activeGroup.name}</h2>
                        <span className="text-[11px] text-gray-400 font-bold break-words">
                          {activeGroup.members?.map(m => m.name).join(" • ") || "Only You"}
                          {activeGroup.invitations?.some(i => i.status === "pending") && (
                            <span className="text-amber-500 ml-2">
                              +{activeGroup.invitations.filter(i => i.status === "pending").length} pending
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowManageGroup(true);
                          setEditGroupName(activeGroup.name);
                        }}
                        className="h-9 px-3 md:px-4 rounded-xl border border-[#27187E]/15 bg-white hover:bg-indigo-50 text-[#27187E] text-xs font-black cursor-pointer transition shrink-0 flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Balances & Settlements */}
                  <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
                    
                    {/* Net Balances */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
                      <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Net Balances</h3>
                      {groupBalances && Object.keys(groupBalances.balances || {}).length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {Object.entries(groupBalances.balances).map(([userId, balance]) => {
                            const isCreditor = balance > 0;
                            const isDebtor = balance < 0;
                            return (
                              <div key={userId} className="flex justify-between items-center bg-[#F8F9FA] p-2.5 rounded-xl border border-gray-100">
                                <span className="text-xs font-extrabold text-[#5C5783] truncate max-w-[120px]">
                                  {getMemberName(userId)}
                                </span>
                                <span className={`text-sm font-black ${
                                  isCreditor ? "text-emerald-600" : isDebtor ? "text-rose-600" : "text-slate-500"
                                }`}>
                                  {isCreditor ? "+" : ""}{balance.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-5 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-100">
                          <p className="text-xs font-bold text-gray-400 m-0">All settled! 🎉</p>
                        </div>
                      )}
                    </div>

                    {/* Settlements */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400">Settlements</h3>
                        {groupBalances?.settlements?.length > 0 && (
                          <button
                            onClick={() => handleSendBulkReminders("both")}
                            disabled={notifLoading}
                            className="h-7 px-2.5 rounded-lg border-0 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[9px] font-black cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                            title="Send reminders to all debtors via Email & WhatsApp"
                          >
                            🔔 Notify All
                          </button>
                        )}
                      </div>
                      {groupBalances && groupBalances.settlements?.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {groupBalances.settlements.map((settle, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-[#F8F9FA] p-2.5 rounded-xl border border-gray-100">
                              <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 text-xs shrink-0">
                                💸
                              </div>
                              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                                <div className="text-xs text-gray-500 font-bold truncate">
                                  <span className="text-[#27187E] font-black">{getMemberName(settle.from)}</span>
                                  {" → "}
                                  <span className="text-[#27187E] font-black">{getMemberName(settle.to)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-sm font-black text-rose-600">
                                    ₹{settle.amount.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => handleSendReminder(settle.from, settle.amount, "email")}
                                    disabled={notifLoading}
                                    className="h-6 w-6 rounded-md border-0 bg-indigo-50 hover:bg-indigo-100 text-[#27187E] text-[10px] cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                                    title="Send email reminder"
                                  >
                                    📧
                                  </button>
                                  <button
                                    onClick={() => handleSendReminder(settle.from, settle.amount, "whatsapp")}
                                    disabled={notifLoading}
                                    className="h-6 w-6 rounded-md border-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                                    title="Send WhatsApp reminder"
                                  >
                                    💬
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-100">
                          <p className="text-xs font-bold text-gray-400 m-0">No pending payments!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expense Feed */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="m-0 text-xs font-black uppercase tracking-wider text-gray-400">Recent Expenses</h3>
                      <span className="text-[10px] bg-indigo-50 text-[#27187E] px-2 py-0.5 rounded-full font-bold">
                        {expenses.length} total
                      </span>
                    </div>

                    {expenses.length === 0 ? (
                      <div className="text-center py-8 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs font-bold text-gray-400 m-0">No expenses yet. Scan a bill or add one!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                        {expenses.map((exp) => (
                          <div key={exp._id} className="flex items-center justify-between gap-3 p-3 bg-[#F8F9FA] rounded-xl border border-gray-100 transition hover:border-gray-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-[#27187E]/5 flex items-center justify-center text-[#27187E] font-black text-xs shrink-0">
                                {exp.category?.charAt(0) || "🛒"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-extrabold text-[#27187E] truncate">{exp.title}</span>
                                <span className="text-[10px] text-gray-400 font-bold">
                                  by {exp.paidBy?.name || "Member"} • {exp.splitType === "equal" ? "Equal" : "Custom"}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-black text-[#27187E] shrink-0">
                              ₹{exp.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
                  <Users className="h-10 w-10 text-[#AEB8FE] mx-auto mb-4" />
                  <h3 className="m-0 text-lg font-black text-[#27187E]">Welcome to SplitEase</h3>
                  <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto">
                    Select a group from the left to view balances and expenses, or create a new one!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

          {/* TAB 2: ADD GROUP EXPENSE */}
          {activeTab === "add-expense" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="h-6 w-6 text-[#27187E]" />
                <h3 className="m-0 text-lg font-black text-[#27187E]">Add New Group Expense</h3>
              </div>

              {groups.length === 0 ? (
                <div className="text-center py-8 bg-[#F8F9FA] rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm font-bold text-[#5C5783] m-0">You must create a group before logging shared expenses!</p>
                </div>
              ) : (
                <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-400" htmlFor="select-group">
                        Select Expense Group
                      </label>
                      <select
                        id="select-group"
                        value={expGroup}
                        onChange={(e) => setExpGroup(e.target.value)}
                        required
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-[#27187E] outline-none focus:border-[#758BFD] transition cursor-pointer"
                      >
                        <option value="">-- Choose Group --</option>
                        {groups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-400" htmlFor="expense-split">
                        Split Algorithm
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-1 rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setExpSplitType("equal")}
                          className={`py-2.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition ${
                            expSplitType === "equal"
                              ? "bg-[#27187E] text-white shadow-sm"
                              : "bg-transparent text-[#5C5783] hover:text-[#27187E]"
                          }`}
                        >
                          Equally (1/N)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpSplitType("unequal")}
                          className={`py-2.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition ${
                            expSplitType === "unequal"
                              ? "bg-[#27187E] text-white shadow-sm"
                              : "bg-transparent text-[#5C5783] hover:text-[#27187E]"
                          }`}
                        >
                          Unequally (%)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-400" htmlFor="exp-title">
                        Expense Description
                      </label>
                      <input
                        id="exp-title"
                        type="text"
                        placeholder="e.g. Cafe Mocha & Pizzas"
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        required
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-400" htmlFor="exp-amount">
                        Total Amount Paid
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#27187E]">{details.currency === "INR" ? "₹" : "$"}</span>
                        <input
                          id="exp-amount"
                          type="number"
                          placeholder="0.00"
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          required
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 text-sm font-bold text-[#27187E] outline-none focus:border-[#758BFD] transition"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={expLoading}
                    className="h-[52px] w-full rounded-xl border-0 bg-[#27187E] text-sm font-extrabold text-white cursor-pointer hover:bg-[#1F1368] transition shadow-md shadow-[#27187E]/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    {expLoading ? "Calculating Splits & Saving..." : "Publish & Split Expense"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: AI OCR RECEIPT SCANNING */}
          {activeTab === "ocr-scan" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#758BFD]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h3 className="m-0 text-lg font-black text-[#27187E]">AI OCR Receipt Auto-Scanner</h3>
                </div>
                <span className="text-[9px] font-black uppercase text-[#758BFD] bg-[#758BFD]/10 px-2 py-0.5 rounded">Tesseract AI Eng.</span>
              </div>

              <form onSubmit={handleScanSubmit} className="flex flex-col gap-6">
                <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center bg-[#F8F9FA] relative overflow-hidden flex flex-col items-center justify-center gap-4">
                  {isScanning && (
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#758BFD] to-transparent shadow-[0_0_6px_#758BFD] animate-scan-line z-20" />
                  )}
                  
                  <Camera className="h-10 w-10 text-[#AEB8FE]" />
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-extrabold text-[#27187E]">Upload receipt photo</span>
                    <span className="text-xs text-gray-400">Supports JPG, JPEG, and PNG images</span>
                  </div>

                  <input
                    key={ocrFile ? "has-file" : "no-file"}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="text-xs text-[#5C5783] cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isScanning || !ocrFile}
                  className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#27187E] to-[#5C4BD6] text-sm font-extrabold text-white cursor-pointer transition shadow-md shadow-[#27187E]/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isScanning ? "Processing AI OCR Engine..." : "Scan & Extract Bill details"}
                </button>
              </form>

              {ocrError && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                  {ocrError}
                </div>
              )}

              {ocrResults && (
                <div className="mt-6 p-5 bg-[#F8F9FA] border border-gray-100 rounded-2xl animate-fadeIn flex flex-col gap-4">
                  {/* Header with confidence badge */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black uppercase text-gray-400">Extracted & Editable Items</span>
                    <div className="flex items-center gap-2">
                      {reconciliationData?.confidence && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          reconciliationData.confidence.level === "high"
                            ? "text-emerald-700 bg-emerald-100"
                            : reconciliationData.confidence.level === "medium"
                            ? "text-amber-700 bg-amber-100"
                            : "text-rose-700 bg-rose-100"
                        }`}>
                          {reconciliationData.confidence.level === "high" ? "🟢" : reconciliationData.confidence.level === "medium" ? "🟡" : "🔴"}{" "}
                          {reconciliationData.confidence.score}% Confidence
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {editableOcrItems.length} items
                      </span>
                    </div>
                  </div>

                  {/* Reconciliation Status Bar */}
                  {reconciliationData && (
                    <div className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col gap-2 ${
                      reconciliationData.status === "verified"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : reconciliationData.status === "adjusted"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span>
                          {reconciliationData.status === "verified" ? "✅ Totals Match" 
                            : reconciliationData.status === "adjusted" ? "⚠️ Adjusted (Tax/Charges)" 
                            : "❌ Totals Mismatch"}
                        </span>
                        <span className="font-black">
                          Items: ₹{(editableOcrItems.reduce((s, x) => s + x.price, 0)).toFixed(2)}
                          {" → "}
                          Bill: ₹{ocrGrandTotal.toFixed(2)}
                        </span>
                      </div>
                      {reconciliationData.difference !== 0 && (
                        <span className="text-[10px] opacity-80">
                          Difference: ₹{Math.abs(reconciliationData.difference).toFixed(2)} 
                          {reconciliationData.difference > 0 ? " (bill higher — tax/charges)" : " (items higher — possible duplicates)"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Warnings & Suggestions */}
                  {reconciliationData?.warnings?.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {reconciliationData.warnings.map((w, idx) => (
                        <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-medium flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">⚠️</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {reconciliationData?.suggestions?.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {reconciliationData.suggestions.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 font-medium flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">💡</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {editableOcrItems.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {editableOcrItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100 animate-fadeIn">
                          <input
                            type="text"
                            value={item.item || ""}
                            onChange={(e) => {
                              const updated = [...editableOcrItems];
                              updated[idx].item = e.target.value;
                              setEditableOcrItems(updated);
                            }}
                            className="h-9 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-extrabold text-[#27187E] outline-none focus:border-[#758BFD] transition"
                            placeholder="Item Name"
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                            <input
                              type="number"
                              value={item.price || 0}
                              onChange={(e) => {
                                const updated = [...editableOcrItems];
                                updated[idx].price = Number(e.target.value) || 0;
                                setEditableOcrItems(updated);
                              }}
                              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-6 pr-2 text-xs font-black text-[#27187E] outline-none focus:border-[#758BFD] transition"
                              placeholder="Price"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditableOcrItems(editableOcrItems.filter((_, i) => i !== idx));
                            }}
                            className="h-9 w-9 rounded-lg border-0 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition cursor-pointer flex items-center justify-center shrink-0"
                            title="Delete item"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Detected Charges/Tax Breakdown */}
                      {ocrResults.charges && (ocrResults.charges.tax > 0 || ocrResults.charges.serviceCharge > 0 || ocrResults.charges.discount > 0) && (
                        <div className="mt-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Detected Charges</span>
                          <div className="flex flex-col gap-1 mt-2">
                            {ocrResults.charges.taxDetails?.map((t, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-[#27187E]">
                                <span className="font-medium">{t.name}</span>
                                <span className="font-black">₹{t.amount.toFixed(2)}</span>
                              </div>
                            ))}
                            {ocrResults.charges.discount > 0 && (
                              <div className="flex justify-between text-[11px] text-emerald-700">
                                <span className="font-medium">Discount</span>
                                <span className="font-black">-₹{ocrResults.charges.discount.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Add Custom Item + Re-reconcile Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditableOcrItems([...editableOcrItems, { item: "New Item", price: 0 }]);
                          }}
                          className="h-9 px-4 rounded-xl border border-dashed border-[#27187E]/20 bg-white hover:bg-indigo-50/20 text-[#27187E] text-xs font-bold transition cursor-pointer"
                        >
                          + Add Custom Item
                        </button>
                        <button
                          type="button"
                          onClick={handleReReconcile}
                          disabled={isReconciling}
                          className="h-9 px-4 rounded-xl border border-[#758BFD]/30 bg-white hover:bg-indigo-50/30 text-[#758BFD] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          {isReconciling ? "Checking..." : "🔄 Re-verify Totals"}
                        </button>
                      </div>

                      {/* Grand Total (editable) + Items Total Comparison + Autofill */}
                      {(() => {
                        const sum = editableOcrItems.reduce((s, x) => s + x.price, 0);
                        const diff = Math.abs(sum - ocrGrandTotal);
                        const isMatch = diff < 1;
                        return (
                          <div className="border-t border-gray-100 pt-4 mt-3 flex flex-col gap-3">
                            {/* Editable Grand Total */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400">Bill Grand Total (editable)</span>
                              <div className="relative w-32">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                                <input
                                  type="number"
                                  value={ocrGrandTotal || 0}
                                  onChange={(e) => setOcrGrandTotal(Number(e.target.value) || 0)}
                                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-6 pr-2 text-xs font-black text-[#27187E] outline-none focus:border-[#758BFD] transition"
                                />
                              </div>
                            </div>

                            {/* Totals Comparison */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black uppercase ${isMatch ? "text-emerald-700" : "text-amber-700"}`}>
                                  {isMatch ? "✅" : "⚠️"} Items Total
                                </span>
                                <span className="text-base font-black text-[#27187E]">₹{sum.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isMatch ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                }`}>
                                  {isMatch ? "Verified ✓" : `Diff: ₹${diff.toFixed(2)}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => autofillFromOcr(
                                    ocrGrandTotal > 0 ? ocrGrandTotal : sum,
                                    editableOcrItems.map(i => i.item).join(", ")
                                  )}
                                  className="h-9 px-4 rounded-lg border-0 bg-[#27187E] text-xs font-extrabold text-white cursor-pointer hover:bg-[#1F1368] transition active:scale-[0.98] w-full sm:w-auto"
                                >
                                  Autofill Add Expense
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs text-amber-700 bg-amber-50 p-3.5 rounded-xl border border-amber-200 m-0">
                        AI could not parse lines into structured item prices. Here is the raw text extracted:
                      </p>
                      <pre className="m-0 bg-white p-3.5 rounded-xl border text-xs font-mono max-h-[150px] overflow-auto text-left text-[#5C5783]">
                        {ocrResults.text}
                      </pre>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEditableOcrItems([{ item: "New Item", price: 0 }]);
                        }}
                        className="h-9 px-4 rounded-xl border border-dashed border-[#27187E]/20 bg-white hover:bg-indigo-50/20 text-[#27187E] text-xs font-bold transition cursor-pointer self-start"
                      >
                        + Create Manual List
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI SMART EXPENSE ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6 animate-fadeIn">

              {/* Analytics Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #6366F1, #EC4899)",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.25)"
                  }}>
                    <FaChartLine className="text-white text-lg" />
                  </span>
                  <div>
                    <h2 className="m-0 text-lg font-black text-[#27187E]">AI Smart Analytics</h2>
                    <p className="m-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Real-time financial intelligence
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard
                  title="Total Group Expenses"
                  value={totalExpensesLogged}
                  icon={FaMoneyBillWave}
                  colorClass="bg-indigo-50 text-[#27187E] border border-indigo-100"
                />
                <StatCard
                  title="Active Expense Groups"
                  value={groupsCount}
                  icon={FaUsers}
                  colorClass="bg-emerald-50 text-emerald-700 border border-emerald-100"
                />
                <StatCard
                  title="Optimal Settlements"
                  value={calculatedPendingBalance}
                  icon={FaWallet}
                  colorClass="bg-amber-50 text-amber-700 border border-amber-100"
                />
              </div>

              {/* Recharts Graphical Visuals Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpensePieChart data={analyticsData?.analytics?.categoryTotals} />
                <MonthlyChart data={analyticsData?.analytics?.categoryTotals} />
              </div>

              {/* AI Smart recommendation alerts */}
              <InsightsCard insights={analyticsData?.insights} />

            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & REMINDERS */}
          {activeTab === "notifications" && (
            <NotificationPanel
              groups={groups}
              activeGroup={activeGroup}
              groupBalances={groupBalances}
              getMemberName={getMemberName}
              profile={profile}
              onSendReminder={handleSendReminder}
              onSendBulkReminders={handleSendBulkReminders}
              notifLoading={notifLoading}
              notifMessage={notifMessage}
            />
          )}

          

          {/* TAB 6: MY PROFILE PROFILE PHOTO */}
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-6 animate-fadeIn max-w-2xl">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white">
                  👤
                </span>
                <div>
                  <h3 className="m-0 text-base font-black text-[#27187E]">My Account Profile</h3>
                  <p className="m-0 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Customize your profile photo & details</p>
                </div>
              </div>

              {profileMessage && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-[#27187E] text-xs font-bold rounded-xl animate-fadeIn">
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleProfileUpdateSubmit} className="flex flex-col gap-5">
                
                {/* Profile Photo selector */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100">
                  <div className="relative shrink-0">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt="Avatar Preview" 
                        className="h-20 w-20 rounded-full object-cover border-2 border-[#27187E]/25 animate-fadeIn"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white flex items-center justify-center text-3xl font-black">
                        {profile.name?.charAt(0).toUpperCase() || "S"}
                      </div>
                    )}
                    <label 
                      htmlFor="avatar-file-upload" 
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[#27187E] text-white flex items-center justify-center text-xs cursor-pointer shadow-md hover:bg-[#1F1368] transition"
                      title="Upload custom photo"
                    >
                      📷
                    </label>
                    <input 
                      type="file" 
                      id="avatar-file-upload" 
                      accept="image/*" 
                      onChange={handleFileUploadAvatar}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#27187E]">Choose Avatar Preset</span>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
                        "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Jude",
                        "https://api.dicebear.com/7.x/identicon/svg?seed=Vince",
                        "https://api.dicebear.com/7.x/identicon/svg?seed=Luna"
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfile(prev => ({ ...prev, avatar: preset }))}
                          className={`h-9 w-9 rounded-full border-2 overflow-hidden bg-white cursor-pointer transition ${
                            profile.avatar === preset ? "border-[#27187E]" : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold">Or click the camera icon to upload a custom profile picture!</span>
                  </div>
                </div>

                {/* Account details inputs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="profile-name">
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profile.name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="h-11 w-full rounded-lg border border-[#27187E]/20 bg-white px-3.5 text-xs font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="profile-phone">
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      pattern="\d{10}"
                      maxLength={10}
                      className="h-11 w-full rounded-lg border border-[#27187E]/20 bg-white px-3.5 text-xs font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="profile-currency">
                      Default Currency
                    </label>
                    <select
                      id="profile-currency"
                      value={profile.currency || "INR"}
                      onChange={(e) => setProfile(prev => ({ ...prev, currency: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-xs font-extrabold text-[#27187E] outline-none focus:border-[#758BFD] transition cursor-pointer"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="profile-email">
                      Email Address (Read-only)
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email || ""}
                      disabled
                      className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-xs font-bold text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="profile-bio">
                    Short Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio || ""}
                    rows="2"
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-lg border border-[#27187E]/20 bg-white p-3 text-xs font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="h-11 w-full rounded-xl border-0 bg-[#27187E] hover:bg-[#1F1368] text-xs font-extrabold text-white cursor-pointer transition shadow-md shadow-[#27187E]/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {profileLoading ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </form>

              {/* Danger Zone */}
              <div className="mt-8 border-t border-rose-100 pt-6">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      ⚠️ Danger Zone
                    </span>
                    <span className="text-[11px] text-[#7F1D1D]/70 font-semibold max-w-md mt-1 leading-relaxed">
                      Permanently delete your SplitEase account and all associated groups/expenses. This action is irreversible.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={profileLoading}
                    onClick={handleDeleteAccount}
                    className="h-10 px-5 rounded-xl border border-[#EF4444]/35 bg-white text-xs font-black text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer transition active:scale-[0.98] disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    {profileLoading ? "Processing..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          )}


      </div>

      {/* Manage Group Slide-Out Panel */}
      <ManageGroupPanel
        isOpen={showManageGroup}
        onClose={() => setShowManageGroup(false)}
        activeGroup={activeGroup}
        editGroupName={editGroupName}
        setEditGroupName={setEditGroupName}
        inviteName={inviteName}
        setInviteName={setInviteName}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteMobile={inviteMobile}
        setInviteMobile={setInviteMobile}
        tempInvites={tempInvites}
        onAddTempInvite={handleAddTempInvite}
        onRemoveTempInvite={handleRemoveTempInvite}
        onRemoveMember={handleRemoveMember}
        onRemoveInvitation={handleRemoveInvitation}
        onSubmit={handleUpdateGroupSubmit}
        onDeleteGroup={handleDeleteGroupClick}
        updateLoading={updateLoading}
      />
    </div>
  );
}
