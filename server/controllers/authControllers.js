import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import { sendOTP } from "../utils/email.js";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;

const createToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const redirectWithToken = (res, token) => {
    res.redirect(`${CLIENT_URL}/auth?token=${encodeURIComponent(token)}`);
};

const getOAuthConfig = (provider) => {
    if (provider === "google") {
        return {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_CALLBACK_URL
        };
    }

    return {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_CALLBACK_URL
    };
};

const assertOAuthConfig = (res, config, provider) => {
    if (!config.clientId || !config.clientSecret) {
        res.status(501).json({
            message: `${provider} OAuth is not configured`
        });
        return false;
    }

    return true;
};

const findOrCreateOAuthUser = async ({ name, email, authProvider, providerId, avatar }) => {
    if (!email) {
        throw new Error("OAuth account did not provide an email address");
    }

    let user = await User.findOne({ email });

    if (user) {
        user.authProvider = user.authProvider || authProvider;
        user.providerId = user.providerId || providerId;
        user.avatar = avatar || user.avatar;
        await user.save();
        return user;
    }

    user = await User.create({
        name: name || email.split("@")[0],
        email,
        authProvider,
        providerId,
        avatar
    });

    return user;
};

export const registerUser = async(req,res)=>{
    try{
        const {name,email,password} = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        // Require at least 6 characters for password
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        const userExists = await User.findOne({email: email.toLowerCase().trim()});

        if(userExists){
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashPassword = await bcrypt.hash(password,10);

        const user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashPassword,
            authProvider: "local"
        });

        const token = createToken(user._id);

        res.status(201).json({
            message: "User registered Successfully",
            userId: user._id,
            token
        });
    }catch(error){
        console.error("Register Error:", error);
        res.status(500).json({
            message: error.message,
            error: error.message
        });
    }
};

export const loginUser = async(req,res)=>{
    try{
        const{email,password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({email: email.toLowerCase().trim()});

        if(!user){
            return res.status(400).json({
                message: "User not found. Please register first."
            });
        }

        if (!user.password) {
            return res.status(400).json({
                message: `Please continue with ${user.authProvider} login`
            });
        }

        const isMatch  = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = createToken(user._id);

        res.status(200).json({
            message: "Login Successful",
            token
        });
    }
    catch(error){
        console.error("Login Error:", error);
        res.status(500).json({
            message: error.message,
            error: error.message
        });
    }
};

// 🔥 Firebase Social Auth Sync (Google & GitHub)
export const firebaseAuthSync = async (req, res) => {
  try {
    const { email, name, provider, providerId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for Firebase auth sync" });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Update provider details if missing
      user.authProvider = user.authProvider || provider || "firebase";
      user.providerId = user.providerId || providerId;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    } else {
      // Create new user in MongoDB
      user = await User.create({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        authProvider: provider || "firebase",
        providerId: providerId || "fb_" + Date.now(),
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`
      });
    }

    const token = createToken(user._id);

    res.status(200).json({
      message: "Firebase auth synced successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency || "INR"
      }
    });
  } catch (error) {
    console.error("Firebase Auth Sync Error:", error);
    res.status(500).json({
      message: error.message,
      error: error.message
    });
  }
};

export const startGoogleOAuth = (req, res) => {
    const config = getOAuthConfig("google");

    if (!assertOAuthConfig(res, config, "Google")) return;

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account"
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

export const handleGoogleOAuth = async (req, res) => {
    try {
        const config = getOAuthConfig("google");

        if (!config.clientId || !config.clientSecret) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("Google OAuth is not configured on the server")}`);
        }

        const { code } = req.query;

        if (!code) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("Google authorization was cancelled or failed")}`);
        }

        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            grant_type: "authorization_code"
        });

        const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });

        const profile = profileResponse.data;
        const user = await findOrCreateOAuthUser({
            name: profile.name,
            email: profile.email,
            authProvider: "google",
            providerId: profile.id,
            avatar: profile.picture
        });

        redirectWithToken(res, createToken(user._id));
    } catch (error) {
        console.error("Google OAuth error:", error.message);
        res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("Google login failed. Please try again.")}`);
    }
};

export const startGitHubOAuth = (req, res) => {
    const config = getOAuthConfig("github");

    if (!assertOAuthConfig(res, config, "GitHub")) return;

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "read:user user:email"
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const handleGitHubOAuth = async (req, res) => {
    try {
        const config = getOAuthConfig("github");

        if (!config.clientId || !config.clientSecret) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("GitHub OAuth is not configured on the server")}`);
        }

        const { code } = req.query;

        if (!code) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("GitHub authorization was cancelled or failed")}`);
        }

        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("GitHub did not return an access token. Please try again.")}`);
        }

        const [profileResponse, emailsResponse] = await Promise.all([
            axios.get("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }),
            axios.get("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        ]);

        const profile = profileResponse.data;
        const primaryEmail = emailsResponse.data.find((item) => item.primary)?.email || profile.email;

        if (!primaryEmail) {
            return res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("GitHub account does not have a public email. Please set one in your GitHub settings.")}`);
        }

        const user = await findOrCreateOAuthUser({
            name: profile.name || profile.login,
            email: primaryEmail,
            authProvider: "github",
            providerId: String(profile.id),
            avatar: profile.avatar_url
        });

        redirectWithToken(res, createToken(user._id));
    } catch (error) {
        console.error("GitHub OAuth error:", error.message);
        res.redirect(`${CLIENT_URL}/auth?error=${encodeURIComponent("GitHub login failed. Please try again.")}`);
    }
};

// 🔑 Forgot Password - Generate & Send OTP
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ message: "User with this email not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiry in 10 minutes
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send Email
        await sendOTP(user.email, user.name, otp);

        res.status(200).json({ message: "OTP sent to your email successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔑 Reset Password - Verify OTP & Update Password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify OTP & Expiry
        if (!user.resetOTP || user.resetOTP !== otp || user.resetOTPExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP code" });
        }

        // Enforce password constraints: min 8 chars, 1 num, 1 upper, 1 lower, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)."
            });
        }

        // Hash new password
        const hashPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashPassword;
        
        // Clear OTP fields
        user.resetOTP = undefined;
        user.resetOTPExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔑 Update User Profile
export const updateProfile = async (req, res) => {
    try {
        const { name, phone, currency, bio, avatar, monthlyBudget } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (currency) user.currency = currency;
        if (bio) user.bio = bio;
        if (avatar) user.avatar = avatar; // Base64 avatar or Image URL
        if (monthlyBudget !== undefined) user.monthlyBudget = Number(monthlyBudget) || 10000;

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                currency: user.currency,
                bio: user.bio,
                avatar: user.avatar,
                monthlyBudget: user.monthlyBudget
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔑 Get User Profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 🤖 AI Budget Advisor Chat
export const aiChat = async (req, res) => {
    try {
        const { message, groupId } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Get group context if groupId is passed
        let groupContext = "";
        if (groupId) {
            const Group = (await import("../models/Group.js")).default;
            const Expense = (await import("../models/Expense.js")).default;
            
            const group = await Group.findById(groupId).populate("members", "name email");
            if (group) {
                const expenses = await Expense.find({ group: groupId }).populate("paidBy", "name");
                const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
                const membersStr = group.members.map(m => m.name).join(", ");
                const expensesListStr = expenses.slice(0, 10).map(e => `- ${e.title}: ₹${e.amount} paid by ${e.paidBy?.name || "Member"}`).join("\n");
                
                groupContext = `Context: Group "${group.name}". Members: ${membersStr}. Total spent: ₹${totalSpent.toFixed(2)}.\nRecent Expenses:\n${expensesListStr || "None"}\n`;
            }
        }

        // 1. Try Google Gemini API if GEMINI_API_KEY is configured in server/.env
        if (process.env.GEMINI_API_KEY) {
            try {
                const apiKey = process.env.GEMINI_API_KEY.trim();
                const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"];
                const promptText = `You are SplitEase AI, an expert financial advisor specializing in expense tracking, group bill splitting, budgeting, and debt settlement. Provide helpful, concise advice using markdown formatting.\n${groupContext}\nUser question: ${message}`;

                let lastError = null;

                for (const modelName of modelsToTry) {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                    const geminiRes = await fetch(geminiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                    });

                    const geminiData = await geminiRes.json();
                    const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiReply) {
                        return res.status(200).json({ reply: aiReply, response: aiReply, message: aiReply });
                    }
                    if (geminiData.error) {
                        console.error(`Gemini API (${modelName}) error response:`, JSON.stringify(geminiData.error));
                        lastError = geminiData.error.message || JSON.stringify(geminiData.error);
                    }
                }

                if (lastError) {
                    const errReply = `⚠️ **Gemini API Key Error:** ${lastError}\n\nPlease check your key in \`server/.env\`. Get a free API Key from **[Google AI Studio](https://aistudio.google.com/app/apikey)** (valid keys start with \`AIzaSy...\`).`;
                    return res.status(200).json({ reply: errReply, response: errReply, message: errReply });
                }
            } catch (apiErr) {
                console.error("Gemini API Exception:", apiErr);
            }
        }

        

        // 3. Fallback Built-in Smart Financial Rule Engine
        const cleanMsg = message.toLowerCase().trim();
        let reply = "";

        if (cleanMsg.includes("settle") || cleanMsg.includes("debt") || cleanMsg.includes("pay back") || cleanMsg.includes("owe")) {
            reply = ` SplitEase AI Financial Settle Advisor: \n\nOptimizing your group's balances reduces multiple small transactions into the minimum number of payments possible. \n\n*  To settle debts optimally: \n  1. Go to your active workspace's  Group Net Balances .\n  2. Check the  Simplified Settlements  view.\n  3. Directly execute the suggested transactions (e.g. "Member A pays Member B ₹X").\n\nThis simple math algorithm prevents circular payments and saves bank transfer efforts! Let me know if you want me to write a reminder message to send to your group.`;
        } else if (cleanMsg.includes("habit") || cleanMsg.includes("spending") || cleanMsg.includes("summary") || cleanMsg.includes("insight")) {
            reply = ` SplitEase AI Budget Analyzer Summary: \n\nI scanned your group expense workspace context. Here's my intelligent breakdown of your current spending dynamics:\n\n* 📈  Workspace Summary:  ${groupContext ? "Your group has registered items in different categories." : "Try logging some expenses in a group first!"}\n* 💡  Efficiency Tip:  Make sure to scan physical bills using our  AI OCR Receipt Scanner  to save manual typing effort. This classifies items into categories automatically!\n* 🎯  Smart Budget Nudge:  High-spending categories like *Food* and *Entertainment* usually account for 60%+ of group splits. Encourage roommates to cook together or share bulk transport rides to cut down!`;
        } else if (cleanMsg.includes("reminder") || cleanMsg.includes("nudge") || cleanMsg.includes("text") || cleanMsg.includes("message")) {
            reply = ` AI Generated Settle Reminders: \n\nHere are 3 distinct templates you can copy and customize to remind group members politely:\n\n💬  Option 1 (Friendly & Direct): \n> "Hey everyone! Just did a quick update of our expenses on  SplitEase AI . When you get a moment, please check your outstanding simplified balance and settle up. No immediate rush! Thanks! 🙌"\n\n💬  Option 2 (Casual): \n> "Hey! Hope you're having a good day. Just a friendly nudge about our group workspace. Whenever it's convenient, you can clear your pending balance on SplitEase. Cheers! ☕"\n\n💬  Option 3 (Roommate Rent/Groceries): \n> "Hi guys! Our shared bills for this month have been calculated and split on  SplitEase . Please check the dashboard to see your balance and transfer when you can so we remain completely settled! 🏡"`;
        } else if (cleanMsg.includes("ocr") || cleanMsg.includes("scan") || cleanMsg.includes("camera") || cleanMsg.includes("bill")) {
            reply = ` AI OCR Bill Scanner Tips: \n\nOur scanner uses high-performance Tesseract OCR algorithms. To ensure 100% accurate results:\n\n1. 📸  Lighting:  Capture receipt photos in well-lit environments (avoid harsh shadows).\n2. 📐  Angle:  Align receipt text horizontally relative to your camera lens.\n3. 🔍  Resolution:  Zoom in so individual character lines are clearly visible.\n\nOnce scanned, our engine parses line prices, sums them up, and gives you a single-click  Autofill Add Expense  button! Try it under the  Receipt Scanner  tab.`;
        } else {
            reply = ` Hello! I am your SplitEase AI Financial Advisor. \n\nI can analyze your group's shared expense workspace, optimize settlements, draft reminder messages, or help you debug your budget!\n\nHere are some things you can ask me:\n* 💡 *"Give me a summary of our group's spending habits."*\n* 💸 *"How can we settle our group debts optimally?"*\n* 💬 *"Can you write a polite reminder message I can send to people who owe me money?"*\n* 📸 *"How does the AI OCR Receipt Scanner work?"*\n\nFeel free to type any budget or settlement query and I will help you track and save!`;
        }

        res.status(200).json({ reply, response: reply, message: reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 👤 Delete User Account and Associated Data
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all groups created by this user
        const groupsToDestroy = await Group.find({ createdBy: userId });
        const groupIds = groupsToDestroy.map(g => g._id);

        // 2. Delete all expenses under the groups created by the user
        await Expense.deleteMany({ group: { $in: groupIds } });

        // 3. Delete the groups created by the user
        await Group.deleteMany({ _id: { $in: groupIds } });

        // 4. Remove this user from any other groups they are a member of
        await Group.updateMany(
            { members: userId },
            { $pull: { members: userId } }
        );

        // 5. Delete the User record itself
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: "Account and all associated groups/expenses deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
