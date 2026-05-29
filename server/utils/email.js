import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create nodemailer transport from environment variables
const createTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false // Bypasses self-signed certificate / TLS issues in typical dev and host settings
      }
    });
  }
  
  return null;
};

// 📧 Helper to send email
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransport();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'SplitEase AI'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[SMTP] Email successfully sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error("[SMTP] Error sending email via SMTP:", error);
    }
  }

  // Failover: Log to terminal so it's easily accessible in dev environments!
  console.log("\n=================== 📧 DEV EMAIL SIMULATOR ===================");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("----------------------- CONTENT -----------------------");
  console.log(text || html.replace(/<[^>]*>/g, ""));
  console.log("==============================================================\n");
  return true;
};

// 📧 Send Forgot Password OTP
export const sendOTP = async (email, name, otp) => {
  const subject = "SplitEase AI — Password Reset OTP";
  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(39, 24, 126, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Top accent bar -->
        <div style="background: linear-gradient(135deg, #27187E 0%, #758BFD 100%); height: 8px;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Header / Brand -->
          <div style="margin-bottom: 30px; text-align: center;">
            <span style="font-size: 28px; font-weight: 900; color: #27187E; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
              💸 <span style="margin-left: 8px;">SplitEase</span><span style="color: #758BFD; font-weight: 300;">AI</span>
            </span>
          </div>

          <!-- Heading -->
          <h2 style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 0 0 15px 0; text-align: center;">Reset Your Password</h2>
          
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
            Hello <strong>${name}</strong>,<br>
            We received a request to reset your password. Use the secure 6-digit verification code below to authorize your reset. This code is valid for exactly <strong>10 minutes</strong>.
          </p>

          <!-- Code Box -->
          <div style="background: #f5f6ff; border: 2px dashed #758BFD; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #758BFD; margin-bottom: 8px;">Verification Security Code</div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #27187E; font-family: monospace; display: inline-block;">${otp}</div>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 30px 0; text-align: center;">
            If you did not initiate this password reset, please ignore this email or reach out to our security support if you have concerns.
          </p>

          <!-- Divider -->
          <div style="border-top: 1px solid #f1f5f9; margin-bottom: 25px;"></div>

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; margin: 0 0 5px 0;">SplitEase AI, Inc. — Elegant Group Expense Management</p>
            <p style="font-size: 9px; color: #cbd5e1; margin: 0;">This is an automated security transmission. Please do not reply.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = `Hello ${name},\n\nWe received a request to reset your password. Use the verification code below to complete your reset. This code is valid for 10 minutes:\n\n${otp}\n\nIf you did not make this request, you can safely ignore this email.`;

  return sendEmail({ to: email, subject, html, text });
};

// 📧 Send Group Invite Email
export const sendInvite = async (email, inviterName, groupName) => {
  const subject = `Join ${inviterName} on SplitEase AI!`;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(39, 24, 126, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Top accent bar -->
        <div style="background: linear-gradient(135deg, #27187E 0%, #758BFD 100%); height: 8px;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Header / Brand -->
          <div style="margin-bottom: 35px; text-align: center;">
            <span style="font-size: 28px; font-weight: 900; color: #27187E; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
              💸 <span style="margin-left: 8px;">SplitEase</span><span style="color: #758BFD; font-weight: 300;">AI</span>
            </span>
          </div>

          <!-- Invitation Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 15px;">👥</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #1e1b4b; margin: 0 0 10px 0;">You are Invited!</h3>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
              <strong>${inviterName}</strong> has invited you to join the expense group:<br>
              <span style="display: inline-block; background: #e0e7ff; color: #27187E; font-weight: 900; font-size: 16px; padding: 6px 16px; border-radius: 99px; margin-top: 10px;">${groupName}</span>
            </p>
          </div>

          <!-- Feature highlights -->
          <div style="margin-bottom: 30px;">
            <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #758BFD; margin: 0 0 12px 0; letter-spacing: 1.2px;">What makes SplitEase AI Standout?</h4>
            <div style="font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
              <span style="color: #27187E; font-weight: 900; margin-right: 6px;">✓</span> <strong>AI OCR receipt Auto-Scanning:</strong> Automatically extract itemized prices from bill images.
            </div>
            <div style="font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
              <span style="color: #27187E; font-weight: 900; margin-right: 6px;">✓</span> <strong>Debt Simplification Calculations:</strong> Minimize awkward conversations by splitting net balances perfectly.
            </div>
            <div style="font-size: 13px; color: #475569; line-height: 1.4;">
              <span style="color: #27187E; font-weight: 900; margin-right: 6px;">✓</span> <strong>Spending Charts & Analytics:</strong> Know exactly where your group funds are going each month.
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 35px;">
            <a href="${clientUrl}/auth" style="background: linear-gradient(135deg, #27187E 0%, #5C4BD6 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 900; display: inline-block; box-shadow: 0 8px 20px rgba(39, 24, 126, 0.15);">
              Accept Invitation & Join Group
            </a>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px solid #f1f5f9; margin-bottom: 25px;"></div>

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; margin: 0 0 5px 0;">SplitEase AI — Making group finances transparent, fair, and fun.</p>
            <p style="font-size: 9px; color: #cbd5e1; margin: 0;">You received this because you were invited to an expense group on SplitEase. If this wasn't you, you can safely ignore this email.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = `Hello,\n\n${inviterName} has invited you to join the expense group "${groupName}" on SplitEase AI!\n\nUse the link below to sign up or log in to view bills and settle balances:\n\n${clientUrl}/auth`;

  return sendEmail({ to: email, subject, html, text });
};

// 📧 Send Payment Reminder Email
export const sendPaymentReminder = async (email, fromName, toName, amount, groupName, currency = "INR") => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const subject = `💸 Payment Reminder — You owe ${symbol}${Number(amount).toFixed(2)} in "${groupName}"`;
  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(39, 24, 126, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Top accent bar -->
        <div style="background: linear-gradient(135deg, #27187E 0%, #758BFD 100%); height: 8px;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Header / Brand -->
          <div style="margin-bottom: 30px; text-align: center;">
            <span style="font-size: 28px; font-weight: 900; color: #27187E; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
              💸 <span style="margin-left: 8px;">SplitEase</span><span style="color: #758BFD; font-weight: 300;">AI</span>
            </span>
          </div>

          <!-- Reminder Card -->
          <div style="background: linear-gradient(135deg, #FFF7ED, #FEF3C7); border: 1px solid #FDE68A; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 15px;">⏰</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #92400E; margin: 0 0 10px 0;">Payment Reminder</h3>
            <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">
              Hey <strong>${toName}</strong>,<br>
              You owe <strong style="font-size: 18px; color: #B45309;">${symbol}${Number(amount).toFixed(2)}</strong> to <strong>${fromName}</strong> in the group:
            </p>
            <span style="display: inline-block; background: #FEF3C7; color: #92400E; font-weight: 900; font-size: 16px; padding: 6px 16px; border-radius: 99px; margin-top: 10px; border: 1px solid #FDE68A;">${groupName}</span>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 35px;">
            <a href="${clientUrl}/auth" style="background: linear-gradient(135deg, #27187E 0%, #5C4BD6 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 900; display: inline-block; box-shadow: 0 8px 20px rgba(39, 24, 126, 0.15);">
              Settle Up Now →
            </a>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px solid #f1f5f9; margin-bottom: 25px;"></div>

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; margin: 0 0 5px 0;">SplitEase AI — Making group finances transparent, fair, and fun.</p>
            <p style="font-size: 9px; color: #cbd5e1; margin: 0;">This is an automated reminder. You received this because you are part of an expense group on SplitEase.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = `Hey ${toName},\n\nThis is a friendly reminder that you owe ${symbol}${Number(amount).toFixed(2)} to ${fromName} in the group "${groupName}".\n\nPlease settle up at your earliest convenience!\n\n${clientUrl}/auth`;

  return sendEmail({ to: email, subject, html, text });
};

// 📧 Send New Expense Notification Email
export const sendExpenseNotification = async (email, memberName, expenseTitle, amount, paidByName, groupName, currency = "INR") => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const subject = `📝 New Expense "${expenseTitle}" added to "${groupName}" — ${symbol}${Number(amount).toFixed(2)}`;
  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(39, 24, 126, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Top accent bar -->
        <div style="background: linear-gradient(135deg, #27187E 0%, #758BFD 100%); height: 8px;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Header / Brand -->
          <div style="margin-bottom: 30px; text-align: center;">
            <span style="font-size: 28px; font-weight: 900; color: #27187E; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
              💸 <span style="margin-left: 8px;">SplitEase</span><span style="color: #758BFD; font-weight: 300;">AI</span>
            </span>
          </div>

          <!-- Expense Card -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 15px;">🧾</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #166534; margin: 0 0 10px 0;">New Expense Added!</h3>
            <p style="font-size: 14px; color: #15803d; line-height: 1.6; margin: 0 0 10px 0;">
              Hey <strong>${memberName}</strong>, a new expense was just logged in your group:
            </p>
            <div style="background: #ffffff; border-radius: 12px; padding: 15px; margin-top: 10px; border: 1px solid #dcfce7;">
              <div style="font-size: 16px; font-weight: 900; color: #27187E; margin-bottom: 5px;">${expenseTitle}</div>
              <div style="font-size: 24px; font-weight: 900; color: #166534;">${symbol}${Number(amount).toFixed(2)}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Paid by <strong>${paidByName}</strong> • Group: <strong>${groupName}</strong></div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 35px;">
            <a href="${clientUrl}/auth" style="background: linear-gradient(135deg, #27187E 0%, #5C4BD6 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 900; display: inline-block; box-shadow: 0 8px 20px rgba(39, 24, 126, 0.15);">
              View Expense Details →
            </a>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px solid #f1f5f9; margin-bottom: 25px;"></div>

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; margin: 0 0 5px 0;">SplitEase AI — Making group finances transparent, fair, and fun.</p>
            <p style="font-size: 9px; color: #cbd5e1; margin: 0;">You received this because you are part of the expense group "${groupName}" on SplitEase.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = `Hey ${memberName},\n\nA new expense "${expenseTitle}" of ${symbol}${Number(amount).toFixed(2)} was added to your group "${groupName}" by ${paidByName}.\n\nLog in to view your updated balance:\n${clientUrl}/auth`;

  return sendEmail({ to: email, subject, html, text });
};

// 📧 Send Balance Summary Email
export const sendBalanceSummary = async (email, memberName, groupName, settlements, currency = "INR") => {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const subject = `📊 Balance Summary for "${groupName}" — SplitEase AI`;

  let settlementRows = `<div style="text-align: center; padding: 15px; color: #16a34a; font-weight: 700; font-size: 14px;">✅ All settled — no pending payments!</div>`;
  if (settlements && settlements.length > 0) {
    settlementRows = settlements.map(s => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #ffffff; border-radius: 10px; border: 1px solid #e5e7eb; margin-bottom: 6px;">
        <span style="font-size: 13px; color: #27187E; font-weight: 600;">${s.fromName || "Member"} → ${s.toName || "Member"}</span>
        <span style="font-size: 14px; font-weight: 900; color: #dc2626;">${symbol}${Number(s.amount).toFixed(2)}</span>
      </div>
    `).join("");
  }

  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(39, 24, 126, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Top accent bar -->
        <div style="background: linear-gradient(135deg, #27187E 0%, #758BFD 100%); height: 8px;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Header / Brand -->
          <div style="margin-bottom: 30px; text-align: center;">
            <span style="font-size: 28px; font-weight: 900; color: #27187E; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
              💸 <span style="margin-left: 8px;">SplitEase</span><span style="color: #758BFD; font-weight: 300;">AI</span>
            </span>
          </div>

          <!-- Summary Card -->
          <div style="background: #f5f6ff; border: 1px solid #e0e7ff; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
            <div style="text-align: center; margin-bottom: 15px;">
              <div style="font-size: 40px; margin-bottom: 10px;">📊</div>
              <h3 style="font-size: 18px; font-weight: 800; color: #27187E; margin: 0 0 5px 0;">Balance Summary</h3>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                Hey <strong>${memberName}</strong>, here's the latest for <strong>"${groupName}"</strong>
              </p>
            </div>

            <div style="margin-top: 15px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #758BFD; margin-bottom: 10px;">Pending Settlements</div>
              ${settlementRows}
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 35px;">
            <a href="${clientUrl}/auth" style="background: linear-gradient(135deg, #27187E 0%, #5C4BD6 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 900; display: inline-block; box-shadow: 0 8px 20px rgba(39, 24, 126, 0.15);">
              View Full Breakdown →
            </a>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px solid #f1f5f9; margin-bottom: 25px;"></div>

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; margin: 0 0 5px 0;">SplitEase AI — Making group finances transparent, fair, and fun.</p>
            <p style="font-size: 9px; color: #cbd5e1; margin: 0;">You received this summary because you are part of "${groupName}" on SplitEase.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = `Hey ${memberName},\n\nHere's the latest balance summary for "${groupName}":\n\n${settlements && settlements.length > 0 ? settlements.map(s => `${s.fromName} owes ${s.toName}: ${symbol}${Number(s.amount).toFixed(2)}`).join("\n") : "All settled — no pending payments!"}\n\nView full details: ${clientUrl}/auth`;

  return sendEmail({ to: email, subject, html, text });
};
