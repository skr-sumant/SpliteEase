import axios from "axios";

if (!import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL environment variable is missing! API requests will fall back to relative paths, which may fail on live deployments.");
}

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// 🔐 Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth APIs
export const syncFirebaseAuth = (data) => API.post("/auth/firebase-sync", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getOAuthUrl = (provider) => `${API.defaults.baseURL}/auth/${provider}`;
export const getProfile = () => API.get("/auth/profile");
export const updateProfile = (data) => API.put("/auth/profile", data);
export const deleteAccount = () => API.delete("/auth/profile");
export const sendAiMessage = (message, groupId) => API.post("/auth/ai-chat", { message, groupId });

// Group APIs
export const createGroup = (data) => API.post("/groups/create", data);
export const getGroups = () => API.get("/groups");
export const updateGroup = (groupId, data) => API.put(`/groups/${groupId}`, data);
export const getPendingInvitations = () => API.get("/groups/pending-invites");
export const acceptInvitation = (groupId) => API.post("/groups/accept-invite", { groupId });

// Expense APIs
export const addExpense = (data) => API.post("/expenses/add", data);

// Balance APIs
export const getBalances = (groupId) => API.get(`/balances/${groupId}`);

// OCR APIs
export const scanReceipt = (formData) => {
  return API.post("/ocr/scan", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const scanReceiptPublic = (formData) => {
  return API.post("/ocr/scan-public", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

// Reconcile user-edited items against the grand total
export const reconcileReceipt = (data) => API.post("/ocr/reconcile", data);


// Analytics APIs
export const getAnalytics = () => API.get("/analytics");

// Forgot / Reset Password APIs
export const forgotPassword = (email) => API.post("/auth/forgot-password", { email });
export const resetPassword = (email, otp, newPassword) => API.post("/auth/reset-password", { email, otp, newPassword });

// Group Additional APIs
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);

// Expense Additional APIs
export const getExpenses = (groupId) => API.get(`/expenses/group/${groupId}`);

// Personal Expense APIs
export const addPersonalExpense = (data) => API.post("/expenses/personal", data);
export const getPersonalExpenses = () => API.get("/expenses/personal");
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// Notification APIs
export const sendPaymentReminderAPI = (data) => API.post("/notifications/payment-reminder", data);
export const sendExpenseUpdateAPI = (data) => API.post("/notifications/expense-update", data);
export const sendBulkRemindersAPI = (data) => API.post("/notifications/bulk-reminders", data);
export const getWhatsAppLinkAPI = (data) => API.post("/notifications/whatsapp-link", data);

export default API;
