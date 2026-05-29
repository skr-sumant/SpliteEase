import dotenv from "dotenv";

dotenv.config();

// ────────────────────────────────────────────
// 📱 WhatsApp Deep Link Generator
// Uses wa.me links (free, no API key required)
// Opens WhatsApp with pre-filled message
// ────────────────────────────────────────────

/**
 * Normalize phone number to international format.
 * Handles Indian numbers (10 digits → +91), or numbers already prefixed with country code.
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");

  // If it's exactly 10 digits, assume India (+91)
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    cleaned = `91${cleaned}`;
  }

  // Must be all digits at this point
  if (!/^\d{10,15}$/.test(cleaned)) return null;

  return cleaned;
};

/**
 * Generate a WhatsApp deep link (wa.me) with a pre-filled message.
 * @param {string} phone - Phone number (10-digit Indian or international with country code)
 * @param {string} message - The message body to pre-fill
 * @returns {string|null} The wa.me URL or null if phone is invalid
 */
export const generateWhatsAppLink = (phone, message) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
};

// ────────────────────────────────────────────
// 📝 WhatsApp Message Templates
// Clean, emoji-rich formatting for WhatsApp
// ────────────────────────────────────────────

/**
 * Payment reminder message template
 */
export const buildPaymentReminderMessage = ({ fromName, toName, amount, groupName, currency = "INR" }) => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  return [
    `💸 *SplitEase AI — Payment Reminder*`,
    ``,
    `Hey *${toName}*! 👋`,
    ``,
    `This is a friendly reminder that you owe *${symbol}${Number(amount).toFixed(2)}* to *${fromName}* in the group *"${groupName}"*.`,
    ``,
    `Please settle up at your earliest convenience! 🙏`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `💡 _Manage your expenses easily on SplitEase AI_`,
    `🔗 ${process.env.CLIENT_URL || "http://localhost:5173"}`
  ].join("\n");
};

/**
 * New expense notification message template
 */
export const buildExpenseNotificationMessage = ({ memberName, expenseTitle, amount, paidByName, groupName, currency = "INR" }) => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  return [
    `📝 *SplitEase AI — New Expense Added*`,
    ``,
    `Hey *${memberName}*! 👋`,
    ``,
    `A new expense has been added to your group *"${groupName}"*:`,
    ``,
    `📌 *${expenseTitle}*`,
    `💰 Amount: *${symbol}${Number(amount).toFixed(2)}*`,
    `👤 Paid by: *${paidByName}*`,
    ``,
    `Log in to SplitEase to view your updated balance and splits.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `🔗 ${process.env.CLIENT_URL || "http://localhost:5173"}`
  ].join("\n");
};

/**
 * Balance summary message template
 */
export const buildBalanceSummaryMessage = ({ memberName, groupName, settlements, currency = "INR" }) => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  let settlementLines = "✅ All settled — no pending payments!";
  if (settlements && settlements.length > 0) {
    settlementLines = settlements
      .map((s) => `  • ${s.fromName || "Member"} → ${s.toName || "Member"}: *${symbol}${Number(s.amount).toFixed(2)}*`)
      .join("\n");
  }

  return [
    `📊 *SplitEase AI — Balance Summary*`,
    ``,
    `Hey *${memberName}*! Here's the latest settlement status for *"${groupName}"*:`,
    ``,
    `*Pending Settlements:*`,
    settlementLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `💡 _View detailed breakdown on SplitEase AI_`,
    `🔗 ${process.env.CLIENT_URL || "http://localhost:5173"}`
  ].join("\n");
};
