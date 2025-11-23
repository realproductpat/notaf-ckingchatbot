import express from "express";
import prisma from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from "../config";

const router = express.Router();

// Helper to parse expiration time (e.g., "15m", "7d") to milliseconds
function parseExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}

// Helper to generate tokens
async function generateTokens(userId: number, email: string) {
  const accessToken = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + parseExpiration(JWT_REFRESH_EXPIRES_IN));
  
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt
    }
  });
  
  return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "User exists" });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });
  
  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
  
  res.json({ 
    token: accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name } 
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  
  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
  
  res.json({ 
    token: accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name } 
  });
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
  
  const tokenRecord = await prisma.refreshToken.findUnique({ 
    where: { token: refreshToken },
    include: { user: true }
  });
  
  if (!tokenRecord) return res.status(401).json({ error: "Invalid refresh token" });
  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    return res.status(401).json({ error: "Refresh token expired" });
  }
  
  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    tokenRecord.user.id, 
    tokenRecord.user.email
  );
  
  // Delete old refresh token
  await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
  
  res.json({ 
    token: accessToken,
    refreshToken: newRefreshToken 
  });
});

// Logout endpoint - invalidate refresh token
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ success: true });
});

export default router;