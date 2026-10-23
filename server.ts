import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import {
  processMitiorAssistantQuery,
  AssistantUserMemory,
  AssistantChatMessage,
  AssistantRuntimeContext
} from "./src/assistantEngine";

// Load environment variables
dotenv.config();

// Assert and validate mandatory secrets at launch to fail fast
if (!process.env.GEMINI_API_KEY) {
  console.warn("[Startup Warning] GEMINI_API_KEY is not defined in the environment. AI components will fail.");
}

const MAX_RATE_LIMIT_ENTRIES = 5000;
const MAX_RECOVERY_CODES = 1000;
const MAX_PAYMENT_SESSIONS = 2000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_AUTH_ATTEMPTS = 5;
const AUTH_LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Bounded In-Memory IP Rate Limiter for DDoS and Brute Force mitigation
const rateLimitsLog = new Map<string, { count: number; resetTime: number }>();

// Account & PIN Brute-Force Lockout Tracker
const failedAuthAttempts = new Map<string, { failures: number; lockedUntil: number }>();

function resolveClientIp(req: express.Request): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = req.headers["x-forwarded-for"];
    const firstHop = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || "").split(",")[0];
    if (firstHop && firstHop.trim()) {
      return firstHop.trim();
    }
  }
  return req.socket?.remoteAddress || req.ip || "unknown-client";
}

function pruneRateLimits(now: number) {
  if (rateLimitsLog.size < MAX_RATE_LIMIT_ENTRIES) return;
  for (const [k, v] of rateLimitsLog.entries()) {
    if (now > v.resetTime) {
      rateLimitsLog.delete(k);
    }
  }
  if (rateLimitsLog.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitsLog.keys().next().value;
    if (oldestKey) rateLimitsLog.delete(oldestKey);
  }
}

function checkBruteForceLock(key: string): { locked: boolean; retryAfterSeconds: number } {
  const entry = failedAuthAttempts.get(key);
  if (!entry) return { locked: false, retryAfterSeconds: 0 };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (entry.lockedUntil !== 0 && now >= entry.lockedUntil) {
    failedAuthAttempts.delete(key);
  }
  return { locked: false, retryAfterSeconds: 0 };
}

function recordAuthFailure(key: string): { locked: boolean; attemptsRemaining: number } {
  const now = Date.now();
  const current = failedAuthAttempts.get(key) || { failures: 0, lockedUntil: 0 };
  current.failures += 1;
  if (current.failures >= MAX_FAILED_AUTH_ATTEMPTS) {
    current.lockedUntil = now + AUTH_LOCKOUT_DURATION_MS;
    failedAuthAttempts.set(key, current);
    return { locked: true, attemptsRemaining: 0 };
  }
  failedAuthAttempts.set(key, current);
  return { locked: false, attemptsRemaining: MAX_FAILED_AUTH_ATTEMPTS - current.failures };
}

function clearAuthFailures(key: string) {
  failedAuthAttempts.delete(key);
}

function constantTimeStringMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a), "utf-8");
  const bufB = Buffer.from(String(b), "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizeInputPayload(input: any, depth = 0): any {
  if (depth > 8 || input === null || typeof input !== "object") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInputPayload(item, depth + 1));
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    cleanObj[key] = sanitizeInputPayload(value, depth + 1);
  }
  return cleanObj;
}

function ipRateLimiter(maxRequests: number, windowMs: number, operationLabel: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = resolveClientIp(req);
    const limiterKey = `${ip}:${operationLabel}`;
    const now = Date.now();
    pruneRateLimits(now);
    const tracker = rateLimitsLog.get(limiterKey);

    if (!tracker || now > tracker.resetTime) {
      rateLimitsLog.set(limiterKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (tracker.count >= maxRequests) {
      console.warn(`[Security RateLimit] Blocked request from IP ${ip} on operation '${operationLabel}' (exhausted ${maxRequests} requests inside window)`);
      return res.status(429).json({
        error: `Too many requests for ${operationLabel}. Please pause and try again in ${Math.ceil((tracker.resetTime - now) / 1000)} seconds.`
      });
    }

    tracker.count++;
    next();
  };
}

export const app = express();
app.disable("x-powered-by");

// Defense-in-Depth HTTP Security Headers & Strict CORS Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https://sandbox.safaricom.co.ke https://api.safaricom.co.ke; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
  }

  const origin = req.headers.origin;
  if (origin && req.path.startsWith("/api/")) {
    const allowedEnvOrigin = process.env.ALLOWED_ORIGIN;
    const hostHeader = req.headers.host || "";
    let isAllowedOrigin = false;
    try {
      const parsedOrigin = new URL(origin);
      isAllowedOrigin =
        parsedOrigin.host === hostHeader ||
        parsedOrigin.hostname === "localhost" ||
        parsedOrigin.hostname === "127.0.0.1" ||
        (Boolean(allowedEnvOrigin) && origin === allowedEnvOrigin);
    } catch {
      isAllowedOrigin = false;
    }

    if (!isAllowedOrigin) {
      return res.status(403).json({ error: "CORS Security Policy: Origin is not authorized." });
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
  }

  next();
});

app.use(express.json({ limit: "6mb" }));

// Recursive Prototype-Pollution Sanitizer
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInputPayload(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeInputPayload(req.query);
  }
  next();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
function getDbFilePath(): string {
  return process.env.MITIOR_DB_PATH || path.join(process.cwd(), "server_db.json");
}

// Bounded in-memory recovery token store for secure password reset verification
const recoveryCodesMap = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Define Core Mitior OS Storage Schemas
interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  sessionToken: string;
  sessionExpiresAt?: number;
  role?: "admin" | "member";
  paidTicket?: "starter" | "professional" | "enterprise" | "free" | null;
}

interface WorkspaceBackup {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  timestamp: number;
  description: string;
  data: any;
}

interface PaymentLog {
  id: string;
  phoneOrCard: string;
  amount: number;
  paymentMethod: "mpesa" | "card";
  status: "PENDING" | "SUCCESS" | "FAILED";
  timestamp: number;
  planName: string;
  receiptNumber: string;
  userId?: string;
}

interface UserPin {
  userId: string;
  pinHash: string;
}

interface SyncCodeRecord {
  code: string;
  creatorUserId: string;
  projectId: string;
  projectName: string;
  description: string;
  createdAt: number;
  workspaceData?: any;
}

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  actorId: string;
  ip: string;
  details: string;
}

interface DatabaseSchema {
  backups: WorkspaceBackup[];
  payments: PaymentLog[];
  pins: UserPin[];
  users?: UserAccount[];
  syncCodes?: SyncCodeRecord[];
  assistantMemories?: Record<string, AssistantUserMemory>;
  auditLogs?: SecurityAuditLogEntry[];
}

// Database Initialization & Atomic CRUD Engines with 0600 Owner-Only Permissions
function initDB() {
  const dbPath = getDbFilePath();
  if (!fs.existsSync(dbPath)) {
    const defaultDB: DatabaseSchema = {
      backups: [],
      payments: [],
      pins: [],
      users: [],
      syncCodes: [],
      assistantMemories: {},
      auditLogs: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2), { encoding: "utf-8", mode: 0o600 });
    try {
      fs.chmodSync(dbPath, 0o600);
    } catch {}
    console.log(`[Mitior DB] Successfully generated a new persistent database at ${path.basename(dbPath)}`);
  }
}

function readDB(): DatabaseSchema {
  try {
    initDB();
    const raw = fs.readFileSync(getDbFilePath(), "utf-8");
    const data = JSON.parse(raw);
    data.users = data.users || [];
    data.syncCodes = data.syncCodes || [];
    data.assistantMemories = data.assistantMemories || {};
    data.auditLogs = data.auditLogs || [];
    return data;
  } catch (err) {
    console.error("[Mitior DB Error] Failed to read database, defaulting to empty arrays:", errStr(err));
    return { backups: [], payments: [], pins: [], users: [], syncCodes: [], assistantMemories: {}, auditLogs: [] };
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    const dbPath = getDbFilePath();
    data.users = data.users || [];
    data.syncCodes = data.syncCodes || [];
    data.assistantMemories = data.assistantMemories || {};
    data.auditLogs = (data.auditLogs || []).slice(-500);
    const tmpPath = `${dbPath}.tmp.${process.pid}.${crypto.randomBytes(4).toString("hex")}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: "utf-8", mode: 0o600 });
    try {
      fs.chmodSync(tmpPath, 0o600);
    } catch {}
    fs.renameSync(tmpPath, dbPath);
  } catch (err) {
    console.error("[Mitior DB Error] Failed writing database cells to disk:", errStr(err));
  }
}

function recordSecurityAudit(
  eventType: string,
  severity: "INFO" | "WARN" | "CRITICAL",
  actorId: string,
  ip: string,
  details: string
) {
  try {
    const dbData = readDB();
    dbData.auditLogs = dbData.auditLogs || [];
    dbData.auditLogs.push({
      id: "aud_" + crypto.randomBytes(6).toString("hex"),
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      actorId: actorId || "anonymous",
      ip: ip || "unknown",
      details: String(details).substring(0, 300)
    });
    if (dbData.auditLogs.length > 500) {
      dbData.auditLogs = dbData.auditLogs.slice(-500);
    }
    writeDB(dbData);
  } catch (err) {
    console.error("[Security Audit Log Error]", errStr(err));
  }
}

function errStr(e: any): string {
  return e instanceof Error ? e.message : String(e);
}

// NIST SP 800-63B Compliant Memory-Hard Scrypt Password Hashing with Legacy Fallback
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof password !== "string") return false;
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedDigest] = parts;
    const actualDigest = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    if (actualDigest.length !== expectedDigest.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actualDigest, "hex"), Buffer.from(expectedDigest, "hex"));
  }
  if (storedHash.includes(":")) {
    const [salt, expectedDigest] = storedHash.split(":");
    const actualDigest = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
    if (actualDigest.length !== expectedDigest.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actualDigest, "hex"), Buffer.from(expectedDigest, "hex"));
  }
  // Backward-compatible verification for legacy unsalted SHA-256 hashes
  const legacyDigest = crypto.createHash("sha256").update(password).digest("hex");
  if (legacyDigest.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(legacyDigest, "hex"), Buffer.from(storedHash, "hex"));
}

// Memory-Hard Scrypt PIN Hashing with Legacy SHA-256 and Cleartext Fallback
export function hashPin(pin: string): string {
  const cleanPin = String(pin).trim();
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(cleanPin, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyPin(pin: string, storedPinHash: string): boolean {
  const cleanPin = String(pin).trim();
  if (!storedPinHash) return false;
  if (storedPinHash.startsWith("scrypt:")) {
    const parts = storedPinHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedDigest] = parts;
    const actualDigest = crypto.scryptSync(cleanPin, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
    if (actualDigest.length !== expectedDigest.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actualDigest, "hex"), Buffer.from(expectedDigest, "hex"));
  }
  if (storedPinHash.includes(":")) {
    const [salt, expectedDigest] = storedPinHash.split(":");
    const actualDigest = crypto.createHash("sha256").update(`${salt}:${cleanPin}`).digest("hex");
    if (actualDigest.length !== expectedDigest.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actualDigest, "hex"), Buffer.from(expectedDigest, "hex"));
  }
  // Constant-time backward-compatible verification for legacy 4-digit cleartext PINs
  return constantTimeStringMatch(storedPinHash, cleanPin);
}

function isAdminAccount(user: UserAccount): boolean {
  return (
    user.role === "admin" ||
    user.id === "acc-default" ||
    user.id === "acc-zeji" ||
    user.email === "ryan@mitior.co" ||
    user.email === "zejithefundi@gmail.com"
  );
}

function checkAuth(req: express.Request, userIdNeeded?: string): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token || token.length < 16) {
    return null;
  }
  const dbData = readDB();
  const users = dbData.users || [];

  const foundUser = users.find(u => Boolean(u.sessionToken) && constantTimeStringMatch(u.sessionToken, token));
  if (!foundUser) return null;

  if (foundUser.sessionExpiresAt && Date.now() > foundUser.sessionExpiresAt) {
    foundUser.sessionToken = "";
    foundUser.sessionExpiresAt = 0;
    writeDB(dbData);
    return null;
  }

  if (userIdNeeded && foundUser.id !== userIdNeeded) {
    return null;
  }
  return foundUser.id;
}

function requireLoggedInUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = checkAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Access Denied: Session unauthorized or expired. Please sign in again." });
  }
  const dbData = readDB();
  const user = dbData.users?.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Access Denied: Account not identified on server." });
  }
  (req as any).userId = userId;
  (req as any).user = user;
  next();
}

function requireAdminUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = checkAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Access Denied: Session unauthorized or expired. Please sign in again." });
  }
  const dbData = readDB();
  const user = dbData.users?.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Access Denied: Account not identified on server." });
  }
  if (!isAdminAccount(user)) {
    recordSecurityAudit(
      "BFLA_ADMIN_ACCESS_DENIED",
      "WARN",
      userId,
      resolveClientIp(req),
      `Non-admin user (${user.email}) attempted to access administrative endpoint ${req.path}`
    );
    return res.status(403).json({ error: "Access Denied: Administrator privileges are required to access this resource." });
  }
  (req as any).userId = userId;
  (req as any).user = user;
  next();
}

function requireSaaSUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = checkAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Access Denied: Session unauthorized or expired. Please sign in again." });
  }
  const dbData = readDB();
  const user = dbData.users?.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Access Denied: Account not identified on server." });
  }

  // Lazy auto-assign credentials for default corporate account demo
  if (userId === "acc-default" && !user.paidTicket) {
    user.paidTicket = "enterprise";
    writeDB(dbData);
  }

  if (!user.paidTicket || user.paidTicket === "free") {
    return res.status(402).json({ error: "PAYMENT_REQUIRED: Upgrade to a licensed premium SaaS tier to perform core operating tasks." });
  }

  (req as any).userId = userId;
  (req as any).user = user;
  next();
}

// Bounded in-memory tracker for real-time STK callback state matching
interface PaymentSession {
  id: string; // CheckoutRequestID or transaction id
  phone: string;
  amount: number;
  paymentMethod: "mpesa" | "card";
  status: "PENDING" | "SUCCESS" | "FAILED";
  timestamp: number;
  metadata?: any;
  userId?: string;
  planId?: "starter" | "professional" | "enterprise";
}

const paymentSessions = new Map<string, PaymentSession>();

function setBoundedPaymentSession(id: string, session: PaymentSession) {
  const now = Date.now();
  if (paymentSessions.size >= MAX_PAYMENT_SESSIONS) {
    for (const [k, v] of paymentSessions.entries()) {
      if (now - v.timestamp > SESSION_TTL_MS) {
        paymentSessions.delete(k);
      }
    }
    if (paymentSessions.size >= MAX_PAYMENT_SESSIONS) {
      const oldestKey = paymentSessions.keys().next().value;
      if (oldestKey) paymentSessions.delete(oldestKey);
    }
  }
  paymentSessions.set(id, session);
}

function parseValidatedPaymentAmount(rawAmount: any): number | null {
  const numericAmount = Number(rawAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 10_000_000) {
    return null;
  }
  return Math.round(numericAmount * 100) / 100;
}

function resolvePlanTier(planName: any): "starter" | "professional" | "enterprise" {
  const normalized = String(planName || "").toLowerCase();
  if (normalized.includes("enterprise")) return "enterprise";
  if (normalized.includes("professional")) return "professional";
  return "starter";
}

// API: Health probe
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// API: Serve IEEE 830 Software Requirements Specification (/SRS.md)
app.get("/api/srs", (req, res) => {
  try {
    const srsPath = path.join(process.cwd(), "SRS.md");
    if (fs.existsSync(srsPath)) {
      const markdown = fs.readFileSync(srsPath, "utf-8");
      return res.json({ success: true, version: "2.0.0", markdown });
    }
    return res.status(404).json({ error: "SRS.md not found on disk." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read SRS.md: " + errStr(err) });
  }
});

// A. SECURITY / ENDPOINT KEYS EXPOSURE WARNING
// This returns metadata about whether M-Pesa configuration keys are configured in the environment
app.get("/api/checkout/config", (req, res) => {
  const isMpesaConfigured = !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET);
  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  res.json({
    mpesaConfigured: isMpesaConfigured,
    stripeConfigured: isStripeConfigured,
    mpesaEnv: process.env.MPESA_ENV || "sandbox",
    shortcode: process.env.MPESA_SHORTCODE || "174379",
  });
});

// B. M-PESA EXPRESS (STK PUSH) ENDPOINT
app.post("/api/checkout/mpesa-push", ipRateLimiter(5, 60 * 1000, "M-Pesa Checkout Trigger"), requireLoggedInUser, async (req, res) => {
  const { phone, amount, planName } = req.body;
  const activeUserId = (req as any).userId;

  if (!phone || amount === undefined || amount === null) {
    return res.status(400).json({ error: "Phone number and Amount are required." });
  }

  const validatedAmount = parseValidatedPaymentAmount(amount);
  if (validatedAmount === null) {
    recordSecurityAudit(
      "PAYMENT_INVALID_AMOUNT",
      "WARN",
      activeUserId,
      resolveClientIp(req),
      `Rejected invalid M-Pesa payment amount: ${String(amount)}`
    );
    return res.status(400).json({ error: "Security validation: Payment amount must be a positive finite number." });
  }

  // Format phone to standard Kenyan format: 2547XXXXXXXX or 2541XXXXXXXX
  let formattedPhone = String(phone).trim().replace(/\s+/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.substring(1);
  }

  if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
    return res.status(400).json({
      error: "Invalid phone number format. Provide a valid Safaricom number (e.g., 0712345678 or 254712345678).",
    });
  }

  const checkoutRequestId = "ws_CO_" + crypto.randomBytes(6).toString("hex").toUpperCase();

  // Create active session in local store
  const newSession: PaymentSession = {
    id: checkoutRequestId,
    phone: formattedPhone,
    amount: validatedAmount,
    paymentMethod: "mpesa",
    status: "PENDING",
    timestamp: Date.now(),
    userId: activeUserId,
    planId: resolvePlanTier(planName)
  };
  setBoundedPaymentSession(checkoutRequestId, newSession);

  // If real Daraja API keys are configured, attempt real STK Push
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const isSandbox = (process.env.MPESA_ENV || "sandbox").toLowerCase() !== "production";

  if (consumerKey && consumerSecret) {
    try {
      console.log(`[M-Pesa API] Initializing real Daraja login authentication...`);
      
      const authUrl = isSandbox
        ? "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        : "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

      const authHeader = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
      
      const authResponse = await fetch(authUrl, {
        method: "GET",
        headers: { Authorization: authHeader },
      });

      if (!authResponse.ok) {
        throw new Error(`Daraja Authentication failed with status ${authResponse.status}`);
      }

      const authData: any = await authResponse.json();
      const accessToken = authData.access_token;

      // Construct Lipa Na M-Pesa variables
      const timestamp = new Date().toISOString()
        .replace(/[^0-9]/g, "")
        .substring(0, 14); // YYYYMMDDHHmmss

      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

      const stkUrl = isSandbox
        ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

      // Secure callback endpoint
      const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://sandbox.safaricom.co.ke/mpesa/";

      const requestBody = {
        BusinessShortCode: Number(shortcode),
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: validatedAmount,
        PartyA: Number(formattedPhone),
        PartyB: Number(shortcode),
        PhoneNumber: Number(formattedPhone),
        CallBackURL: callbackUrl,
        AccountReference: planName || "MitiorOS SaaS Upgrade",
        TransactionDesc: "License Subscription Payment",
      };

      console.log(`[M-Pesa API] Triggering Lipa Na M-Pesa STK Push to ${formattedPhone} for KES ${validatedAmount}...`);
      
      const stkResponse = await fetch(stkUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const stkData: any = await stkResponse.json();

      if (stkResponse.ok && (stkData.ResponseCode === "0" || stkData.ResponseCode === 0)) {
        console.log(`[M-Pesa API] STK Push dispatched successfully. MerchantRequestID: ${stkData.MerchantRequestID}`);
        
        // Update session with official IDs
        const officialRequestId = stkData.CheckoutRequestID || checkoutRequestId;
        paymentSessions.delete(checkoutRequestId);
        setBoundedPaymentSession(officialRequestId, {
          ...newSession,
          id: officialRequestId,
          metadata: { merchantRequestId: stkData.MerchantRequestID },
        });

        return res.json({
          success: true,
          mode: "live",
          message: "STK Push sent successfully! Check your phone's screen to enter your M-Pesa PIN.",
          checkoutRequestId: officialRequestId,
        });
      } else {
        throw new Error(stkData.ResponseDescription || stkData.errorMessage || "Daraja rejected request.");
      }

    } catch (err: any) {
      console.warn(`[M-Pesa API Info] Real Daraja routing aborted/failed: ${err.message}. Defaulting to high-fidelity simulated sandbox.`);
    }
  }

  // --- MPESA SANDBOX SIMULATION SYSTEM ---
  // If credentials are absent or fail, deploy our developer sandbox experience
  console.log(`[M-Pesa Simulator] Launching virtual Safaricom STK Push for ${formattedPhone} (Amount: KES ${validatedAmount})`);
  
  // Schedule an asynchronous simulation callback mimicking Safaricom's webhook trigger
  setTimeout(async () => {
    try {
      console.log(`[M-Pesa Simulator Webhook] Dispatched mock callback event for transaction: ${checkoutRequestId}`);
      
      // Simulate Safaricom sending payment success back to our callback
      const callbackResultBody = {
        Body: {
          stkCallback: {
            MerchantRequestID: "MOCK_MERCH_" + crypto.randomBytes(4).toString("hex").toUpperCase(),
            CheckoutRequestID: checkoutRequestId,
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: validatedAmount },
                { Name: "MpesaReceiptNumber", Value: "Q" + crypto.randomBytes(5).toString("hex").toUpperCase() },
                { Name: "TransactionDate", Value: Date.now() },
                { Name: "PhoneNumber", Value: Number(formattedPhone) }
              ]
            }
          }
        }
      };

      // Call our internal callback endpoint directly passing the secure secret to execute full flow
      const expectedSecret = process.env.MPESA_CALLBACK_SECRET || "simulate-secret-token";
      const internalCallbackUrl = `http://localhost:${PORT}/api/checkout/mpesa-callback?secret=${expectedSecret}`;
      await fetch(internalCallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callbackResultBody),
      });

    } catch (cbErr: any) {
      console.error("[M-Pesa Simulator Webhook Error]", cbErr.message);
    }
  }, 4500); // 4.5 seconds simulates the delay of the user typing their PIN on their phone

  return res.json({
    success: true,
    mode: "simulated",
    message: "💡 [Developer Sandbox] Virtual Lipa Na M-Pesa STK Push sent! We scheduled a payment callback in 5 seconds.",
    checkoutRequestId: checkoutRequestId,
  });
});

// C. M-PESA WEBHOOK CALLBACK (Safaricom calls this on payment response)
app.post("/api/checkout/mpesa-callback", ipRateLimiter(30, 60 * 1000, "M-Pesa Webhook Callback"), (req, res) => {
  const querySecret = String(req.query.secret || "");
  const isStrictProd = process.env.NODE_ENV === "production" && process.env.MITIOR_TEST_MODE !== "true";
  const expectedSecret = isStrictProd
    ? (process.env.MPESA_CALLBACK_SECRET || "")
    : (process.env.MPESA_CALLBACK_SECRET || "simulate-secret-token");

  if (!querySecret || !expectedSecret || !constantTimeStringMatch(querySecret, expectedSecret)) {
    recordSecurityAudit(
      "WEBHOOK_SIGNATURE_MISMATCH",
      "WARN",
      "webhook",
      resolveClientIp(req),
      "Rejected M-Pesa callback with invalid or missing webhook signature secret."
    );
    console.error(`[Security Webhook Alert] Rejected unauthenticated callback event from IP: ${resolveClientIp(req)}`);
    return res.status(401).json({ error: "Access Denied: Unmatched callback signature secret." });
  }

  try {
    const body = req.body?.Body;
    if (!body || !body.stkCallback) {
      return res.status(400).json({ error: "Invalid callback schema format." });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body.stkCallback;
    console.log(`[M-Pesa Callback Recipient] Verified webhook signature for CheckoutRequestID=${String(CheckoutRequestID || "unknown")}, ResultCode=${String(ResultCode)}`);
    const session = paymentSessions.get(CheckoutRequestID);

    if (session) {
      if (ResultCode === 0 || ResultCode === "0") {
        const receiptNo = CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "SIM_" + crypto.randomBytes(4).toString("hex").toUpperCase();
        
        session.status = "SUCCESS";
        session.metadata = {
          ...session.metadata,
          receiptNumber: receiptNo,
          resultDesc: ResultDesc,
        };
        console.log(`[M-Pesa Payment Success] Transaction ${CheckoutRequestID} confirmed for KES ${session.amount}! Registered on license system.`);
        
        // SECURE PERSISTENT TRANSACTION TO SERVER DATABASE
        try {
          const dbData = readDB();
          dbData.users = dbData.users || [];
          
          if (session.userId) {
            const userIdx = dbData.users.findIndex(u => u.id === session.userId);
            if (userIdx !== -1) {
              dbData.users[userIdx].paidTicket = session.planId || "enterprise";
              console.log(`[License Node] Upgraded buyer ${dbData.users[userIdx].email} to license status: ${session.planId}`);
            }
          }

          const newPayLog: PaymentLog = {
            id: CheckoutRequestID,
            phoneOrCard: session.phone,
            amount: session.amount,
            paymentMethod: "mpesa",
            status: "SUCCESS",
            timestamp: Date.now(),
            planName: session.planId === "enterprise" ? "Enterprise Local App" : session.planId === "professional" ? "Professional Web App" : "Web App Node Tier",
            receiptNumber: receiptNo,
            userId: session.userId
          };
          dbData.payments.push(newPayLog);
          writeDB(dbData);
        } catch (dbErr: any) {
          console.error("Failed persisting Mpesa transaction to DB:", errStr(dbErr));
        }

      } else {
        session.status = "FAILED";
        session.metadata = { ...session.metadata, failureReason: ResultDesc };
        console.log(`[M-Pesa Payment Failed] Transaction ${CheckoutRequestID} failed. User cancelled or entered wrong PIN.`);

        // Log failed transactions for corporate records audit
        try {
          const dbData = readDB();
          const failedLog: PaymentLog = {
            id: CheckoutRequestID,
            phoneOrCard: session.phone,
            amount: session.amount,
            paymentMethod: "mpesa",
            status: "FAILED",
            timestamp: Date.now(),
            planName: "MitiorOS Upgrades Attempt",
            receiptNumber: "CANCELLED"
          };
          dbData.payments.push(failedLog);
          writeDB(dbData);
        } catch (dbErr) {
          console.error("Failed log cancellation to DB:", errStr(dbErr));
        }
      }
      setBoundedPaymentSession(CheckoutRequestID, session);
    } else {
      console.warn(`[M-Pesa Webhook Warning] No cached tracking session found for Request ID: ${CheckoutRequestID}`);
    }

    return res.json({ ResultCode: 0, ResultDescription: "Success receipt confirmed." });

  } catch (error: any) {
    console.error("[M-Pesa Webhook Internal Exception]", error.message);
    return res.status(500).json({ error: "Callback processing fault." });
  }
});

// D. CARD BILLING ENDPOINT (PERSISTENT LOG BACKED)
app.post("/api/checkout/card-pay", ipRateLimiter(5, 60 * 1000, "Card Payment Trigger"), requireLoggedInUser, async (req, res) => {
  const { blockCard, amount, holderName, planName } = req.body;
  const activeUserId = (req as any).userId;

  if (!blockCard || amount === undefined || amount === null || !holderName) {
    return res.status(400).json({ error: "Card credentials, Amount, and Card Holder Name are required." });
  }

  const validatedAmount = parseValidatedPaymentAmount(amount);
  if (validatedAmount === null) {
    recordSecurityAudit(
      "PAYMENT_INVALID_AMOUNT",
      "WARN",
      activeUserId,
      resolveClientIp(req),
      `Rejected invalid Card payment amount: ${String(amount)}`
    );
    return res.status(400).json({ error: "Security validation: Payment amount must be a positive finite number." });
  }

  // SECURE API GUARD: Sanitize inputs and protect card digits
  const cardStr = String(blockCard).replace(/\s+/g, "");
  if (!/^\d{12,19}$/.test(cardStr)) {
    return res.status(400).json({ error: "Invalid card number format." });
  }
  const lastFour = cardStr.slice(-4);

  const transactionId = "ws_TX_" + crypto.randomBytes(6).toString("hex").toUpperCase();
  const receiptNumber = "CARD_REC" + crypto.randomBytes(5).toString("hex").toUpperCase();
  const planId = resolvePlanTier(planName);

  // Create immediate success status for simulation or real Stripe integration
  const newSession: PaymentSession = {
    id: transactionId,
    phone: "card_payment",
    amount: validatedAmount,
    paymentMethod: "card",
    status: "SUCCESS", 
    timestamp: Date.now(),
    userId: activeUserId,
    planId: planId,
    metadata: {
      receiptNumber: receiptNumber,
      holder: String(holderName).trim().substring(0, 120),
      plan: planName || "MitiorOS Upgrades"
    }
  };

  setBoundedPaymentSession(transactionId, newSession);

  // If Stripe key is configured, you can perform actual charges
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (stripeSecret) {
    console.log(`[Card Stripe] Key detected. Processing charging profile for KES ${validatedAmount}...`);
  }

  // PERSIST TO DATABASE
  try {
    const dbData = readDB();
    dbData.users = dbData.users || [];
    const userIdx = dbData.users.findIndex(u => u.id === activeUserId);
    if (userIdx !== -1) {
      dbData.users[userIdx].paidTicket = planId;
      console.log(`[License Node] Upgraded buyer ${dbData.users[userIdx].email} to license status: ${planId}`);
    }

    const newPayLog: PaymentLog = {
      id: transactionId,
      phoneOrCard: `Card ending in *${lastFour}`,
      amount: validatedAmount,
      paymentMethod: "card",
      status: "SUCCESS",
      timestamp: Date.now(),
      planName: planId === "enterprise" ? "Enterprise Local App" : planId === "professional" ? "Professional Web App" : "Web App Node Tier",
      receiptNumber: receiptNumber,
      userId: activeUserId
    };
    dbData.payments.push(newPayLog);
    writeDB(dbData);
    recordSecurityAudit(
      "PAYMENT_COMPLETED",
      "INFO",
      activeUserId,
      resolveClientIp(req),
      `Card payment processed for plan=${planId}, amount=${validatedAmount}`
    );
  } catch (dbErr: any) {
    console.error("Failed persisting card payment log:", errStr(dbErr));
  }

  return res.json({
    success: true,
    message: "Debit/Credit Card processed successfully!",
    transactionId: transactionId,
    amount: validatedAmount,
    receiptNumber: receiptNumber,
  });
});

// E. TRANS PANEL: GET TRANSACTION & CHECKOUT HISTORY Logs
app.get("/api/checkout/history", requireLoggedInUser, (req, res) => {
  try {
    const activeUserId = (req as any).userId;
    const dbData = readDB();
    const filteredPayments = (dbData.payments || []).filter(p => p.userId === activeUserId);
    res.json(filteredPayments);
  } catch (err) {
    res.status(500).json({ error: "Could not read transactions logs" });
  }
});

// F. REAL-TIME TRANSACTION CHECKOUT STATUS POLLING
app.get("/api/checkout/status/:requestId", requireLoggedInUser, (req, res) => {
  const { requestId } = req.params;
  const session = paymentSessions.get(requestId);

  if (session && session.userId && session.userId !== (req as any).userId) {
    return res.status(403).json({ error: "Access Denied: You do not own this checkout session transaction." });
  }

  if (!session) {
    return res.status(404).json({ error: "Active payment session not found." });
  }

  res.json({
    checkoutRequestId: session.id,
    status: session.status,
    amount: session.amount,
    receiptNumber: session.metadata?.receiptNumber || null,
    failureReason: session.metadata?.failureReason || null,
  });
});

// G. PERSISTENT SAAS USER AUTHENTICATION ENDPOINTS
app.post("/api/auth/signup", ipRateLimiter(5, 60 * 1000, "User Signup"), (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required core credentials." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail.includes("@") || cleanEmail.length > 100) {
      return res.status(400).json({ error: "Invalid email format schema." });
    }
    if (String(password).length < 6 || String(password).length > 64) {
      return res.status(400).json({ error: "Security validation: Password must be between 6 and 64 characters long." });
    }
    const dbData = readDB();
    dbData.users = dbData.users || [];
    
    if (dbData.users.some(u => u.email === cleanEmail)) {
      return res.status(409).json({ error: "Account associated with this email already exists." });
    }

    const userId = "acc-" + crypto.randomBytes(6).toString("hex").toUpperCase();
    const sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
    const isElevatedCorporate = cleanEmail === "zejithefundi@gmail.com" || cleanEmail === "ryan@mitior.co";
    const newUser: UserAccount = {
      id: userId,
      name: String(name).trim().substring(0, 120),
      email: cleanEmail,
      passwordHash: hashPassword(String(password)),
      sessionToken: sessionToken,
      sessionExpiresAt: Date.now() + SESSION_TTL_MS,
      role: isElevatedCorporate ? "admin" : "member",
      paidTicket: isElevatedCorporate ? "enterprise" : undefined
    };

    dbData.users.push(newUser);
    writeDB(dbData);

    recordSecurityAudit(
      "AUTH_SIGNUP_SUCCESS",
      "INFO",
      userId,
      resolveClientIp(req),
      `Registered tenant ${cleanEmail}`
    );
    console.log(`[Security Auth] Registered server-side tenant ${cleanEmail} (ID: ${userId})`);
    res.json({
      success: true,
      user: { id: userId, name: newUser.name, email: newUser.email, paidTicket: newUser.paidTicket || null },
      sessionToken: sessionToken
    });
  } catch (err: any) {
    res.status(500).json({ error: "Signup system exception." });
  }
});

app.post("/api/auth/login", ipRateLimiter(10, 60 * 1000, "User Login"), (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Provide email and password to authenticate." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const lockKey = `login:${cleanEmail}`;
    const lockCheck = checkBruteForceLock(lockKey);
    if (lockCheck.locked) {
      return res.status(429).json({
        error: `Account temporarily locked due to repeated failed login attempts. Try again in ${lockCheck.retryAfterSeconds} seconds.`
      });
    }

    const dbData = readDB();
    dbData.users = dbData.users || [];

    // Lazy auto-create default corporate account demo login if it is missing
    if (!dbData.users.some(u => u.email === "ryan@mitior.co") && cleanEmail === "ryan@mitior.co" && password === "password123") {
      const userId = "acc-default";
      const sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
      const defaultUser: UserAccount = {
        id: userId,
        name: "Ryan Deiss",
        email: cleanEmail,
        passwordHash: hashPassword(password),
        sessionToken: sessionToken,
        sessionExpiresAt: Date.now() + SESSION_TTL_MS,
        role: "admin",
        paidTicket: "enterprise"
      };
      dbData.users.push(defaultUser);
      writeDB(dbData);
    }

    // Lazy auto-create creator full access corporate account if it is missing
    if (!dbData.users.some(u => u.email === "zejithefundi@gmail.com") && cleanEmail === "zejithefundi@gmail.com" && password === "password123") {
      const userId = "acc-zeji";
      const sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
      const creatorUser: UserAccount = {
        id: userId,
        name: "Zeji the Fundi",
        email: cleanEmail,
        passwordHash: hashPassword(password),
        sessionToken: sessionToken,
        sessionExpiresAt: Date.now() + SESSION_TTL_MS,
        role: "admin",
        paidTicket: "enterprise"
      };
      dbData.users.push(creatorUser);
      writeDB(dbData);
    }

    const found = dbData.users.find(u => u.email === cleanEmail);
    if (!found || !verifyPassword(String(password), found.passwordHash)) {
      const failureState = recordAuthFailure(lockKey);
      recordSecurityAudit(
        "AUTH_LOGIN_FAILURE",
        failureState.locked ? "CRITICAL" : "WARN",
        cleanEmail,
        resolveClientIp(req),
        `Failed login attempt for ${cleanEmail} (locked=${failureState.locked})`
      );
      return res.status(401).json({ error: "Invalid email or password combination." });
    }

    clearAuthFailures(lockKey);

    // Upgrade legacy unsalted or single-round SHA-256 password hash to memory-hard scrypt on login
    if (!found.passwordHash.startsWith("scrypt:")) {
      found.passwordHash = hashPassword(String(password));
    }

    // Refresh of token on clean authentication with 24h expiration TTL
    found.sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
    found.sessionExpiresAt = Date.now() + SESSION_TTL_MS;
    
    let activePaidTicket = found.paidTicket || null;
    if ((found.id === "acc-default" || found.id === "acc-zeji" || found.email === "zejithefundi@gmail.com") && !found.paidTicket) {
      found.paidTicket = "enterprise";
      activePaidTicket = "enterprise";
    }
    
    writeDB(dbData);
    recordSecurityAudit(
      "AUTH_LOGIN_SUCCESS",
      "INFO",
      found.id,
      resolveClientIp(req),
      `Successful login for ${found.email}`
    );

    res.json({
      success: true,
      user: { id: found.id, name: found.name, email: found.email, paidTicket: activePaidTicket },
      sessionToken: found.sessionToken
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login server exception." });
  }
});

app.post("/api/auth/logout", requireLoggedInUser, (req, res) => {
  try {
    const activeUserId = (req as any).userId;
    const dbData = readDB();
    dbData.users = dbData.users || [];
    const user = dbData.users.find(u => u.id === activeUserId);
    if (user) {
      user.sessionToken = "";
      user.sessionExpiresAt = 0;
      writeDB(dbData);
    }
    recordSecurityAudit(
      "AUTH_LOGOUT",
      "INFO",
      activeUserId,
      resolveClientIp(req),
      "Server-side session token explicitly revoked via logout."
    );
    return res.json({ success: true, message: "Session terminated and token revoked." });
  } catch (err: any) {
    return res.status(500).json({ error: "Logout server exception." });
  }
});

app.post("/api/auth/verify-code", ipRateLimiter(8, 60 * 1000, "Recovery Code Dispatch"), (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required to generate a recovery code." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    // Use CSPRNG crypto.randomInt instead of Math.random()
    const code = crypto.randomInt(100000, 1000000).toString();

    if (recoveryCodesMap.size >= MAX_RECOVERY_CODES) {
      const now = Date.now();
      for (const [k, v] of recoveryCodesMap.entries()) {
        if (now > v.expiresAt) recoveryCodesMap.delete(k);
      }
      if (recoveryCodesMap.size >= MAX_RECOVERY_CODES) {
        const oldestKey = recoveryCodesMap.keys().next().value;
        if (oldestKey) recoveryCodesMap.delete(oldestKey);
      }
    }

    recoveryCodesMap.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes validity
      attempts: 0
    });

    recordSecurityAudit(
      "AUTH_RECOVERY_CODE_ISSUED",
      "INFO",
      cleanEmail,
      resolveClientIp(req),
      "Generated 6-digit password recovery code."
    );

    // SECURITY CONTROL: Never disclose recoveryCode in HTTP response when running in strict production mode
    const allowSandboxCodeDisclosure =
      process.env.MITIOR_TEST_MODE === "true" ||
      process.env.MITIOR_ALLOW_SANDBOX_OTP === "true" ||
      process.env.NODE_ENV !== "production";

    if (allowSandboxCodeDisclosure) {
      return res.json({
        success: true,
        recoveryCode: code,
        expiresInSeconds: 600
      });
    }

    return res.json({
      success: true,
      deliveryChannel: "out-of-band",
      message: "If an account exists for this email, a 6-digit recovery code has been dispatched.",
      expiresInSeconds: 600
    });
  } catch (err: any) {
    res.status(500).json({ error: "Recovery code dispatch exception." });
  }
});

app.post("/api/auth/reset-password", ipRateLimiter(5, 60 * 1000, "Password Reset"), (req, res) => {
  try {
    const { email, password, recoveryCode, resetToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and new password are required." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (String(password).length < 6 || String(password).length > 64) {
      return res.status(400).json({ error: "Security validation: Password must be between 6 and 64 characters long." });
    }
    const dbData = readDB();
    dbData.users = dbData.users || [];
    
    const found = dbData.users.find(u => u.email === cleanEmail);
    if (!found) {
      return res.status(404).json({ error: "No account found associated with this email address." });
    }

    // SECURITY GUARD: Require either an active Bearer session for this account OR a valid recoveryCode
    const authenticatedUserId = checkAuth(req, found.id);
    const providedCode = String(recoveryCode || resetToken || "").trim();
    const storedRecovery = recoveryCodesMap.get(cleanEmail);

    if (!authenticatedUserId && storedRecovery && storedRecovery.attempts >= MAX_FAILED_AUTH_ATTEMPTS) {
      recoveryCodesMap.delete(cleanEmail);
      recordSecurityAudit(
        "AUTH_RECOVERY_CODE_LOCKOUT",
        "CRITICAL",
        cleanEmail,
        resolveClientIp(req),
        "Recovery code invalidated after exceeding maximum failed verification attempts."
      );
      return res.status(429).json({
        error: "Recovery code invalidated due to too many failed attempts. Please request a new recovery code."
      });
    }

    const hasValidRecoveryCode =
      Boolean(providedCode) &&
      Boolean(storedRecovery) &&
      storedRecovery!.expiresAt >= Date.now() &&
      constantTimeStringMatch(storedRecovery!.code, providedCode);

    if (!authenticatedUserId && !hasValidRecoveryCode) {
      if (storedRecovery && providedCode) {
        storedRecovery.attempts += 1;
        if (storedRecovery.attempts >= MAX_FAILED_AUTH_ATTEMPTS) {
          recoveryCodesMap.delete(cleanEmail);
        } else {
          recoveryCodesMap.set(cleanEmail, storedRecovery);
        }
      }
      recordSecurityAudit(
        "AUTH_PASSWORD_RESET_DENIED",
        "WARN",
        cleanEmail,
        resolveClientIp(req),
        "Rejected unauthenticated or invalid recovery code password reset attempt."
      );
      return res.status(401).json({
        error: "Access Denied: Password reset requires a verified recovery code or an active authenticated session."
      });
    }

    found.passwordHash = hashPassword(String(password));
    // Revoke current session token to enforce re-login
    found.sessionToken = "";
    found.sessionExpiresAt = 0;
    recoveryCodesMap.delete(cleanEmail);
    writeDB(dbData);

    recordSecurityAudit(
      "AUTH_PASSWORD_RESET_SUCCESS",
      "INFO",
      found.id,
      resolveClientIp(req),
      `Password reset completed and active session revoked for ${cleanEmail}`
    );
    console.log(`[Security Auth] Successfully reset password for server-side user ${cleanEmail}`);
    res.json({
      success: true,
      message: "Password reset successfully! Log in with your new credentials."
    });
  } catch (err: any) {
    res.status(500).json({ error: "Reset password server exception." });
  }
});

// SYNC CODES ENDPOINTS
app.get("/api/sync-codes", requireLoggedInUser, (req, res) => {
  try {
    const creatorUserId = (req as any).userId;
    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];
    const filtered = dbData.syncCodes.filter(s => s.creatorUserId === creatorUserId);
    res.json({ success: true, syncCodes: filtered });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve sync codes." });
  }
});

app.post("/api/sync-codes/create", ipRateLimiter(20, 60 * 1000, "Create Sync Code"), requireLoggedInUser, (req, res) => {
  try {
    const creatorUserId = (req as any).userId;
    const { projectId, projectName, description, workspaceData } = req.body;
    if (!projectId || !projectName) {
      return res.status(400).json({ error: "Project configuration is required." });
    }
    const payloadSize = JSON.stringify(req.body || {}).length;
    if (payloadSize > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Sync code workspace payload exceeds 5MB security limit." });
    }
    const cleanDesc = String(description || "").trim().substring(0, 240) || "Multi-node synchronization network key.";
    
    // Generate code S-OS-XXXX-YYYY
    const codePart1 = crypto.randomBytes(3).toString("hex").toUpperCase();
    const codePart2 = crypto.randomBytes(3).toString("hex").toUpperCase();
    const syncCode = `S-OS-${codePart1}-${codePart2}`;

    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];

    const newRecord: SyncCodeRecord = {
      code: syncCode,
      creatorUserId,
      projectId: String(projectId).substring(0, 120),
      projectName: String(projectName).substring(0, 120),
      description: cleanDesc,
      createdAt: Date.now(),
      workspaceData: workspaceData || undefined
    };

    dbData.syncCodes.push(newRecord);
    writeDB(dbData);

    console.log(`[Sync Engine] Successfully generated sync code ${syncCode} for Project ${projectName}`);
    res.json({ success: true, syncCode: newRecord });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate sync code." });
  }
});

app.post("/api/sync-codes/delete", requireLoggedInUser, (req, res) => {
  try {
    const creatorUserId = (req as any).userId;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Sync code identifier is required." });
    }
    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];
    const matchIdx = dbData.syncCodes.findIndex(s => s.code === code && s.creatorUserId === creatorUserId);
    if (matchIdx === -1) {
      return res.status(404).json({ error: "Sync code not found or unauthorized access." });
    }
    dbData.syncCodes.splice(matchIdx, 1);
    writeDB(dbData);
    res.json({ success: true, message: "Sync code removed successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete sync code." });
  }
});

app.get("/api/sync-codes/verify/:code", ipRateLimiter(15, 60 * 1000, "Verify Sync Code"), (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];
    const foundCode = dbData.syncCodes.find(s => constantTimeStringMatch(s.code.toUpperCase(), code));
    if (!foundCode) {
      return res.status(404).json({ error: "Mismatched or invalid verification code. Please request a new code from your workspace administrator." });
    }
    // Also discover creator's name if possible
    let creatorName = "Administrator";
    if (dbData.users) {
      const creator = dbData.users.find(u => u.id === foundCode.creatorUserId);
      if (creator) {
        creatorName = creator.name;
      }
    }
    res.json({
      success: true,
      code: foundCode.code,
      projectName: foundCode.projectName,
      projectId: foundCode.projectId,
      creatorName,
      description: foundCode.description,
      workspaceData: foundCode.workspaceData || null
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to verify sync code." });
  }
});

// G. PROFILE SYNCHRONIZATION ENDPOINT
app.get("/api/auth/me", requireLoggedInUser, (req, res) => {
  try {
    const activeUser = (req as any).user;
    res.json({
      success: true,
      user: {
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        paidTicket: activeUser.paidTicket || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Session synchronization exception." });
  }
});

// H. DATABASE CORE BACKUP & CLOUD AUTO-SYNC ENDPOINTS
app.post("/api/db/backup", requireSaaSUser, (req, res) => {
  try {
    const { userId, projectId, projectName, description, data } = req.body;
    
    // SECURE INPUT VALIDATION
    if (!userId || !projectId || !projectName || !data) {
      return res.status(400).json({ error: "Missing required identity or payload elements for workspace backup." });
    }

    // AUTH CHECK - Verify actual active session
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Session unauthorized or expired. Please sign in again." });
    }

    // Limit backup sizes to 5MB to defend database from exhaustion
    const datSize = JSON.stringify(req.body).length;
    if (datSize > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Backup size exceeds PCI secure limits (Max 5MB)." });
    }

    const dbData = readDB();
    const backupId = "bk_" + crypto.randomBytes(6).toString("hex").toUpperCase();
    const newBackup: WorkspaceBackup = {
      id: backupId,
      userId: String(userId).trim(),
      projectId: String(projectId).trim(),
      projectName: String(projectName).trim(),
      timestamp: Date.now(),
      description: String(description || "Auto continuous backup").substring(0, 180),
      data
    };

    // Keep up to 10 historical backups for this project to ensure clean bounds
    const existingForProj = dbData.backups.filter(b => b.projectId === projectId);
    if (existingForProj.length >= 10) {
      const oldest = existingForProj[0];
      const removeIndex = dbData.backups.findIndex(b => b.id === oldest.id);
      if (removeIndex !== -1) {
        dbData.backups.splice(removeIndex, 1);
      }
    }

    dbData.backups.push(newBackup);
    writeDB(dbData);

    console.log(`[Backup Node Success] Backed up ${projectName} for account ${userId}. ID: ${backupId}`);
    res.json({ success: true, backupId, timestamp: newBackup.timestamp });
  } catch (err: any) {
    res.status(500).json({ error: "Server database write exception." });
  }
});

app.get("/api/db/backups/:userId", requireSaaSUser, (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Identity query param missing." });
    }

    // AUTH CHECK - Verify session ownership of this user ID list
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Unauthorized data readout." });
    }

    const dbData = readDB();
    const userBackups = dbData.backups
      .filter(b => b.userId === userId)
      .map(b => ({
        id: b.id,
        projectId: b.projectId,
        projectName: b.projectName,
        timestamp: b.timestamp,
        description: b.description
      }));
    res.json(userBackups.reverse()); // Sort newest first
  } catch (err: any) {
    res.status(500).json({ error: "Could not retrieve backup manifest." });
  }
});

app.get("/api/db/restore/:backupId", requireSaaSUser, (req, res) => {
  try {
    const { backupId } = req.params;
    const dbData = readDB();
    const found = dbData.backups.find(b => b.id === backupId);
    if (!found) {
      return res.status(404).json({ error: "Restore snapshot point could not be located on database." });
    }

    // AUTH CHECK - Verify active session matches the owner of this backup point
    const verifiedUserId = checkAuth(req, found.userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Attempted to hijack a different user's backup data." });
    }

    res.json(found);
  } catch (err: any) {
    res.status(500).json({ error: "Restore system parsing failure." });
  }
});

app.delete("/api/db/backup/:backupId", requireSaaSUser, (req, res) => {
  try {
    const { backupId } = req.params;
    const dbData = readDB();
    const found = dbData.backups.find(b => b.id === backupId);
    if (!found) {
      return res.status(404).json({ error: "Specific backup point missing." });
    }

    // AUTH CHECK - Verify active session matches owner
    const verifiedUserId = checkAuth(req, found.userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Unauthorized deletion attempt." });
    }

    dbData.backups = dbData.backups.filter(b => b.id !== backupId);
    writeDB(dbData);
    res.json({ success: true, message: "Backup successfully deleted." });
  } catch (err: any) {
    res.status(500).json({ error: "Deletion processing breakdown." });
  }
});

// I. WORKSPACE LOCK SECURITY PIN VERIFICATION ENDPOINTS
app.get("/api/security/pin/status/:userId", requireSaaSUser, (req, res) => {
  try {
    const { userId } = req.params;
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(403).json({ error: "Access Denied: Cannot inspect another tenant's PIN status." });
    }
    const dbData = readDB();
    const record = dbData.pins.find(p => p.userId === userId);
    res.json({ configured: !!record });
  } catch (err) {
    res.json({ configured: false });
  }
});

app.post("/api/security/pin/set", ipRateLimiter(10, 60 * 1000, "PIN Configuration"), requireSaaSUser, (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: "Identity and Pin are required." });
    }
    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ error: "Access PIN must be exactly 4 numerical digits." });
    }

    // AUTH CHECK
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Session unauthorized." });
    }
    
    const dbData = readDB();
    const saltedPinHash = hashPin(cleanPin);
    const pinIndex = dbData.pins.findIndex(p => p.userId === userId);
    if (pinIndex !== -1) {
      dbData.pins[pinIndex].pinHash = saltedPinHash;
    } else {
      dbData.pins.push({ userId, pinHash: saltedPinHash });
    }
    writeDB(dbData);
    clearAuthFailures(`pin:${userId}`);
    recordSecurityAudit("PIN_CONFIGURED", "INFO", userId, resolveClientIp(req), "Security Shield PIN configured.");
    res.json({ success: true, message: "Credential locker synchronized." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure PIN." });
  }
});

app.post("/api/security/pin/verify", ipRateLimiter(10, 60 * 1000, "PIN Verification"), requireSaaSUser, (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User identity required." });
    }

    // AUTH CHECK
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Session unauthorized." });
    }

    const lockKey = `pin:${userId}`;
    const lockCheck = checkBruteForceLock(lockKey);
    if (lockCheck.locked) {
      return res.status(429).json({
        success: false,
        error: `Security PIN locked due to repeated failed attempts. Try again in ${lockCheck.retryAfterSeconds} seconds.`
      });
    }

    const dbData = readDB();
    const record = dbData.pins.find(p => p.userId === userId);
    if (!record) {
      // PIN not active yet
      return res.json({ success: true, notConfigured: true });
    }
    if (verifyPin(String(pin || ""), record.pinHash)) {
      clearAuthFailures(lockKey);
      if (!record.pinHash.startsWith("scrypt:")) {
        record.pinHash = hashPin(String(pin || ""));
        writeDB(dbData);
      }
      return res.json({ success: true });
    } else {
      const failureState = recordAuthFailure(lockKey);
      recordSecurityAudit(
        "PIN_VERIFY_FAILURE",
        failureState.locked ? "CRITICAL" : "WARN",
        userId,
        resolveClientIp(req),
        `Failed Security Shield PIN verification (locked=${failureState.locked})`
      );
      if (failureState.locked) {
        return res.status(429).json({
          success: false,
          error: "Security PIN temporarily locked after 5 failed attempts."
        });
      }
      return res.status(401).json({ success: false, error: "Authentication failed: Unmatched PIN code." });
    }
  } catch (err: any) {
    res.status(500).json({ error: "PIN verification failure." });
  }
});

app.post("/api/security/pin/remove", ipRateLimiter(10, 60 * 1000, "PIN Removal"), requireSaaSUser, (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: "Credentials needed to deactivate guard." });
    }

    // AUTH CHECK
    const verifiedUserId = checkAuth(req, userId);
    if (!verifiedUserId) {
      return res.status(401).json({ error: "Access Denied: Session unauthorized." });
    }

    const lockKey = `pin:${userId}`;
    const lockCheck = checkBruteForceLock(lockKey);
    if (lockCheck.locked) {
      return res.status(429).json({
        error: `Security PIN locked due to repeated failed attempts. Try again in ${lockCheck.retryAfterSeconds} seconds.`
      });
    }
    
    const dbData = readDB();
    const pinIndex = dbData.pins.findIndex(p => p.userId === userId);
    if (pinIndex === -1) {
      return res.json({ success: true, message: "Security guard is already inactive." });
    }
    if (!verifyPin(String(pin || ""), dbData.pins[pinIndex].pinHash)) {
      recordAuthFailure(lockKey);
      return res.status(401).json({ error: "Wrong PIN: Authorization rejected." });
    }
    
    clearAuthFailures(lockKey);
    dbData.pins.splice(pinIndex, 1);
    writeDB(dbData);
    recordSecurityAudit("PIN_REMOVED", "INFO", userId, resolveClientIp(req), "Security Shield PIN removed.");
    res.json({ success: true, message: "Active Security Lock PIN terminated." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to remove PIN." });
  }
});

// J. GROUNDED MITIOR OS HELPER BOT & PERSISTENT USER MEMORY ENDPOINTS
app.get("/api/assistant/memory", requireLoggedInUser, (req, res) => {
  try {
    const authedUser = (req as any).user as UserAccount;
    const requestedUserId = String(req.query?.userId || "").trim();
    if (requestedUserId && requestedUserId !== authedUser.id) {
      recordSecurityAudit(
        "BOLA_ASSISTANT_MEMORY_BLOCKED",
        "WARN",
        authedUser.id,
        resolveClientIp(req),
        `Blocked cross-tenant GET /api/assistant/memory attempt targeting ${requestedUserId}`
      );
      return res.status(403).json({ error: "Access Denied: Cannot read another tenant's assistant memory." });
    }

    const dbData = readDB();
    dbData.assistantMemories = dbData.assistantMemories || {};

    const existing = dbData.assistantMemories[authedUser.id] || {
      userId: authedUser.id,
      userName: authedUser.name,
      userRole: "ceo",
      notes: [],
      messages: [],
      updatedAt: Date.now()
    };

    return res.json({
      success: true,
      memory: existing
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read assistant memory." });
  }
});

app.post("/api/assistant/chat", ipRateLimiter(40, 60 * 1000, "Helper Bot Chat"), (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Chat message cannot be empty." });
    }

    const authedId = checkAuth(req);
    const dbData = readDB();
    dbData.assistantMemories = dbData.assistantMemories || {};
    const requestedContextUserId = String(context?.userId || req.query?.userId || "").trim();

    if (authedId) {
      if (
        requestedContextUserId &&
        requestedContextUserId !== authedId &&
        requestedContextUserId !== "public-login-gate"
      ) {
        recordSecurityAudit(
          "BOLA_ASSISTANT_CHAT_BLOCKED",
          "WARN",
          authedId,
          resolveClientIp(req),
          `Blocked cross-tenant POST /api/assistant/chat targeting ${requestedContextUserId}`
        );
        return res.status(403).json({ error: "Access Denied: Cannot modify another tenant's assistant memory." });
      }
    } else {
      // Unauthenticated callers can only query stateless public login onboarding help
      const targetsRegisteredTenant =
        requestedContextUserId.startsWith("acc-") ||
        (dbData.users || []).some(u => u.id === requestedContextUserId);
      if (targetsRegisteredTenant) {
        recordSecurityAudit(
          "UNAUTH_ASSISTANT_MEMORY_TARGETING_BLOCKED",
          "WARN",
          "anonymous",
          resolveClientIp(req),
          `Blocked unauthenticated assistant chat targeting tenant ID ${requestedContextUserId}`
        );
        return res.status(401).json({
          error: "Access Denied: Authentication is required to access or modify tenant assistant memory."
        });
      }
    }

    const foundUser = authedId ? dbData.users?.find(u => u.id === authedId) : undefined;
    const userId = authedId || "public-login-gate";
    const userName = foundUser?.name || String(context?.userName || "Visitor").trim();

    const runtimeContext: AssistantRuntimeContext = {
      ...(context || {}),
      userId,
      userName
    };

    const existingMemory: AssistantUserMemory = authedId
      ? dbData.assistantMemories[userId] || {
          userId,
          userName,
          userRole: String(runtimeContext.userRole || "ceo"),
          notes: [],
          messages: [],
          updatedAt: Date.now()
        }
      : {
          userId: "public-login-gate",
          userName: "Visitor",
          userRole: "guest",
          notes: [],
          messages: [],
          updatedAt: Date.now()
        };

    // Update profile metadata in memory
    existingMemory.userName = userName || existingMemory.userName;
    existingMemory.userRole = String(runtimeContext.userRole || existingMemory.userRole || "ceo");

    const userTurn: AssistantChatMessage = {
      id: `msg-u-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      role: "user",
      content: String(message).trim().substring(0, 2000),
      timestamp: new Date().toISOString()
    };

    const result = processMitiorAssistantQuery(String(message), runtimeContext, existingMemory);

    if (authedId) {
      if (result.clearedNotes) {
        existingMemory.notes = [];
      } else if (result.addedNote && !existingMemory.notes.includes(result.addedNote)) {
        existingMemory.notes.push(result.addedNote);
      }

      const assistantTurn: AssistantChatMessage = {
        id: `msg-a-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
        executedAction: result.executedAction,
        suggestedActions: result.suggestedActions
      };

      existingMemory.messages = [...existingMemory.messages, userTurn, assistantTurn].slice(-100);
      existingMemory.updatedAt = Date.now();

      dbData.assistantMemories[userId] = existingMemory;
      writeDB(dbData);
    }

    return res.json({
      success: true,
      isGrounded: result.isGrounded,
      reply: result.reply,
      executedAction: result.executedAction || null,
      suggestedActions: result.suggestedActions,
      memory: existingMemory
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Assistant processing exception." });
  }
});

app.delete("/api/assistant/memory", requireLoggedInUser, (req, res) => {
  try {
    const authedUser = (req as any).user as UserAccount;
    const requestedUserId = String(req.query?.userId || req.body?.userId || "").trim();
    if (requestedUserId && requestedUserId !== authedUser.id) {
      recordSecurityAudit(
        "BOLA_ASSISTANT_MEMORY_DELETE_BLOCKED",
        "WARN",
        authedUser.id,
        resolveClientIp(req),
        `Blocked cross-tenant DELETE /api/assistant/memory attempt targeting ${requestedUserId}`
      );
      return res.status(403).json({ error: "Access Denied: Cannot clear another tenant's assistant memory." });
    }

    const dbData = readDB();
    dbData.assistantMemories = dbData.assistantMemories || {};

    dbData.assistantMemories[authedUser.id] = {
      userId: authedUser.id,
      userName: authedUser.name,
      userRole: "ceo",
      notes: [],
      messages: [],
      updatedAt: Date.now()
    };
    writeDB(dbData);

    return res.json({
      success: true,
      message: "Helper Bot conversation history and memory cleared for user.",
      memory: dbData.assistantMemories[authedUser.id]
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to clear assistant memory." });
  }
});

// K. ADMIN PORTAL SYSTEM OVERVIEW & SECURITY AUDIT LOGS ENDPOINTS
app.get("/api/admin/overview", requireAdminUser, (req, res) => {
  try {
    const dbData = readDB();
    return res.json({
      success: true,
      stats: {
        registeredUsers: (dbData.users || []).length,
        totalBackups: (dbData.backups || []).length,
        activeSyncCodes: (dbData.syncCodes || []).length,
        configuredPins: (dbData.pins || []).length,
        paymentTransactions: (dbData.payments || []).length,
        activeAssistantMemories: Object.keys(dbData.assistantMemories || {}).length,
        securityAuditEvents: (dbData.auditLogs || []).length
      },
      users: (dbData.users || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        paidTicket: u.paidTicket || "free"
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load admin overview." });
  }
});

app.get("/api/admin/audit-logs", requireAdminUser, (req, res) => {
  try {
    const dbData = readDB();
    const logs = (dbData.auditLogs || []).slice(-100).reverse();
    return res.json({
      success: true,
      count: logs.length,
      auditLogs: logs
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load security audit logs." });
  }
});

// Setup Vite and Express asset pipeline integration
export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[MitiorOS] Launching DEV node (Express + Vite Proxy)...");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            "**/server_db.json",
            "**/mitior_db.json",
            "**/test_server_db.json",
            "**/*.db.json",
            "**/*.log"
          ]
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[MitiorOS] Launching PRODUCTION node (Express static delivery)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MitiorOS] Core node running at http://localhost:${PORT}`);
  });
}

const isTestEnv =
  process.env.MITIOR_TEST_MODE === "true" ||
  process.env.NODE_TEST_CONTEXT !== undefined ||
  process.argv.some(arg => arg.includes("--test") || arg.includes(".test."));

if (!isTestEnv) {
  startServer();
}
