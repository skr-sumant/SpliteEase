import jwt from "jsonwebtoken";
import User from "../models/User.js";

// In-memory cache for user lookups (TTL: 5 minutes)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId) => {
  const entry = userCache.get(userId);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.user;
  }
  userCache.delete(userId);
  return null;
};

const setCachedUser = (userId, user) => {
  // Limit cache size to prevent memory leaks
  if (userCache.size > 500) {
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(userId, { user, ts: Date.now() });
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid authorization header"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT secret is not configured"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check cache first to avoid DB query on every request
    let user = getCachedUser(decoded.userId);

    if (!user) {
      // Use .lean() for faster read-only query and only select needed fields
      user = await User.findById(decoded.userId)
        .select("_id name email phone currency bio avatar monthlyBudget")
        .lean();

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      setCachedUser(decoded.userId, user);
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token is not valid"
    });
  }
};

export default protect;
