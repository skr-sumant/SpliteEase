import Group from "../models/Group.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import { sendPaymentReminder, sendExpenseNotification, sendBalanceSummary } from "../utils/email.js";
import { generateWhatsAppLink, buildPaymentReminderMessage, buildExpenseNotificationMessage, buildBalanceSummaryMessage } from "../utils/whatsapp.js";
import { calculateBalances, simplifyDebts } from "../utils/balanceCalculator.js";

// 🔔 Send Payment Reminder to a specific member
export const sendPaymentReminderNotification = async (req, res) => {
  try {
    const { groupId, toUserId, amount, channel } = req.body;
    // channel: "email", "whatsapp", "both"

    const group = await Group.findById(groupId).populate("members", "name email phone");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const fromUser = req.user;
    const toUser = group.members.find(m => String(m._id) === String(toUserId));
    if (!toUser) return res.status(404).json({ message: "Member not found in this group" });

    const results = { email: null, whatsapp: null };

    // Send Email
    if (channel === "email" || channel === "both") {
      if (toUser.email) {
        sendPaymentReminder(
          toUser.email,
          fromUser.name,
          toUser.name,
          amount,
          group.name,
          fromUser.currency || "INR"
        ).catch(err => console.error("[Notification] Email error:", err));
        results.email = "sent";
      } else {
        results.email = "no_email";
      }
    }

    // Generate WhatsApp link
    if (channel === "whatsapp" || channel === "both") {
      const phone = toUser.phone;
      if (phone) {
        const message = buildPaymentReminderMessage({
          fromName: fromUser.name,
          toName: toUser.name,
          amount,
          groupName: group.name,
          currency: fromUser.currency || "INR"
        });
        const waLink = generateWhatsAppLink(phone, message);
        results.whatsapp = waLink || "invalid_phone";
      } else {
        results.whatsapp = "no_phone";
      }
    }

    res.json({
      success: true,
      message: `Payment reminder sent to ${toUser.name}!`,
      results
    });
  } catch (error) {
    console.error("[Notification] sendPaymentReminder error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔔 Send Expense Update Notification to all group members
export const sendExpenseUpdateNotification = async (req, res) => {
  try {
    const { groupId, expenseTitle, amount, channel } = req.body;

    const group = await Group.findById(groupId).populate("members", "name email phone");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const paidByName = req.user.name;
    const results = { emailsSent: 0, whatsappLinks: [] };

    for (const member of group.members) {
      // Don't notify the person who added the expense
      if (String(member._id) === String(req.user._id)) continue;

      // Send Email
      if (channel === "email" || channel === "both") {
        if (member.email) {
          sendExpenseNotification(
            member.email,
            member.name,
            expenseTitle,
            amount,
            paidByName,
            group.name,
            req.user.currency || "INR"
          ).catch(err => console.error(`[Notification] Email to ${member.email} error:`, err));
          results.emailsSent++;
        }
      }

      // Generate WhatsApp links
      if (channel === "whatsapp" || channel === "both") {
        if (member.phone) {
          const message = buildExpenseNotificationMessage({
            memberName: member.name,
            expenseTitle,
            amount,
            paidByName,
            groupName: group.name,
            currency: req.user.currency || "INR"
          });
          const waLink = generateWhatsAppLink(member.phone, message);
          if (waLink) {
            results.whatsappLinks.push({ name: member.name, link: waLink });
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Expense update notifications sent to group members!`,
      results
    });
  } catch (error) {
    console.error("[Notification] sendExpenseUpdate error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔔 Send Bulk Reminders to all members who owe money in a group
export const sendBulkReminders = async (req, res) => {
  try {
    const { groupId, channel } = req.body;

    const group = await Group.findById(groupId).populate("members", "name email phone");
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Calculate settlements
    const expenses = await Expense.find({ group: groupId });
    const balances = calculateBalances(expenses);
    const settlements = simplifyDebts(balances);

    if (!settlements || settlements.length === 0) {
      return res.json({
        success: true,
        message: "No pending settlements — all balanced! 🎉",
        results: { emailsSent: 0, whatsappLinks: [] }
      });
    }

    const results = { emailsSent: 0, whatsappLinks: [] };

    // Build enriched settlements with names for the summary email
    const enrichedSettlements = settlements.map(s => {
      const fromMember = group.members.find(m => String(m._id) === String(s.from));
      const toMember = group.members.find(m => String(m._id) === String(s.to));
      return {
        ...s,
        fromName: fromMember?.name || "Member",
        toName: toMember?.name || "Member",
        fromEmail: fromMember?.email || null,
        fromPhone: fromMember?.phone || null,
        toEmail: toMember?.email || null,
        toPhone: toMember?.phone || null
      };
    });

    // Send individual payment reminders to debtors
    for (const settlement of enrichedSettlements) {
      // Email reminder to the debtor
      if (channel === "email" || channel === "both") {
        if (settlement.fromEmail) {
          sendPaymentReminder(
            settlement.fromEmail,
            settlement.toName,
            settlement.fromName,
            settlement.amount,
            group.name,
            req.user.currency || "INR"
          ).catch(err => console.error(`[Notification] Bulk email error:`, err));
          results.emailsSent++;
        }
      }

      // WhatsApp link for the debtor
      if (channel === "whatsapp" || channel === "both") {
        if (settlement.fromPhone) {
          const message = buildPaymentReminderMessage({
            fromName: settlement.toName,
            toName: settlement.fromName,
            amount: settlement.amount,
            groupName: group.name,
            currency: req.user.currency || "INR"
          });
          const waLink = generateWhatsAppLink(settlement.fromPhone, message);
          if (waLink) {
            results.whatsappLinks.push({
              name: settlement.fromName,
              owesTo: settlement.toName,
              amount: settlement.amount,
              link: waLink
            });
          }
        }
      }
    }

    // Also send a full balance summary to ALL members
    if (channel === "email" || channel === "both") {
      for (const member of group.members) {
        sendBalanceSummary(
          member.email,
          member.name,
          group.name,
          enrichedSettlements,
          req.user.currency || "INR"
        ).catch(err => console.error(`[Notification] Summary email error:`, err));
      }
    }

    res.json({
      success: true,
      message: `Bulk reminders sent to ${enrichedSettlements.length} settlement(s)!`,
      results
    });
  } catch (error) {
    console.error("[Notification] sendBulkReminders error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔔 Generate WhatsApp deep link (for client-side redirect)
export const getWhatsAppLink = async (req, res) => {
  try {
    const { phone, messageType, data } = req.body;

    let message = "";

    switch (messageType) {
      case "payment_reminder":
        message = buildPaymentReminderMessage(data);
        break;
      case "expense_notification":
        message = buildExpenseNotificationMessage(data);
        break;
      case "balance_summary":
        message = buildBalanceSummaryMessage(data);
        break;
      default:
        message = data?.customMessage || "Hey! Check your SplitEase AI dashboard for updates.";
    }

    const link = generateWhatsAppLink(phone, message);

    if (!link) {
      return res.status(400).json({ message: "Invalid phone number. Please ensure the member has a valid phone number." });
    }

    res.json({ success: true, link });
  } catch (error) {
    console.error("[Notification] getWhatsAppLink error:", error);
    res.status(500).json({ error: error.message });
  }
};
