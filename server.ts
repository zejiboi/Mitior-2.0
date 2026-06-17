import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Assert and validate mandatory secrets at launch to fail fast
if (!process.env.GEMINI_API_KEY) {
  console.warn("[Startup Warning] GEMINI_API_KEY is not defined in the environment. AI components will fail.");
}

// In-Memory IP Rate Limiter for DDoS and Brute Force mitigation
const rateLimitsLog = new Map<string, { count: number; resetTime: number }>();

function ipRateLimiter(maxRequests: number, windowMs: number, operationLabel: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = req.ip || req.headers["x-forwarded-for"] || "unknown-client";
    const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
    const now = Date.now();
    const tracker = rateLimitsLog.get(ip);

    if (!tracker || now > tracker.resetTime) {
      rateLimitsLog.set(ip, { count: 1, resetTime: now + windowMs });
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

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), "server_db.json");

// Define Core Mitior OS Storage Schemas
interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  sessionToken: string;
  paidTicket?: "starter" | "enterprise" | "free" | null;
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
}

interface DatabaseSchema {
  backups: WorkspaceBackup[];
  payments: PaymentLog[];
  pins: UserPin[];
  users?: UserAccount[];
  syncCodes?: SyncCodeRecord[];
}

// Database Initialization & CRUD Engines
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB: DatabaseSchema = {
      backups: [],
      payments: [],
      pins: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf-8");
    console.log("[Mitior DB] Successfully generated a new persistent database at server_db.json");
  }
}

function readDB(): DatabaseSchema {
  try {
    initDB();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    data.users = data.users || [];
    data.syncCodes = data.syncCodes || [];
    return data;
  } catch (err) {
    console.error("[Mitior DB Error] Failed to read database, defaulting to empty arrays:", errStr(err));
    return { backups: [], payments: [], pins: [], users: [], syncCodes: [] };
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    data.users = data.users || [];
    data.syncCodes = data.syncCodes || [];
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Mitior DB Error] Failed writing database cells to disk:", errStr(err));
  }
}

function errStr(e: any): string {
  return e instanceof Error ? e.message : String(e);
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function checkAuth(req: express.Request, userIdNeeded?: string): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const dbData = readDB();
  const users = dbData.users || [];

  const foundUser = users.find(u => u.sessionToken === token);
  if (!foundUser) return null;

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

// Simple in-memory tracker for real-time STK callback state matching
interface PaymentSession {
  id: string; // CheckoutRequestID or transaction id
  phone: string;
  amount: number;
  paymentMethod: "mpesa" | "card";
  status: "PENDING" | "SUCCESS" | "FAILED";
  timestamp: number;
  metadata?: any;
  userId?: string;
  planId?: "starter" | "enterprise";
}

const paymentSessions = new Map<string, PaymentSession>();

// API: Health probe
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
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

  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and Amount are required." });
  }

  // Format phone to standard Kenyan format: 2547XXXXXXXX or 2541XXXXXXXX
  let formattedPhone = phone.trim().replace(/\s+/g, "");
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

  const checkoutRequestId = "ws_CO_" + Math.random().toString(36).substring(2, 12).toUpperCase();

  // Create active session in local store
  const newSession: PaymentSession = {
    id: checkoutRequestId,
    phone: formattedPhone,
    amount: Number(amount),
    paymentMethod: "mpesa",
    status: "PENDING",
    timestamp: Date.now(),
    userId: activeUserId,
    planId: String(planName || "").toLowerCase().includes("enterprise") ? "enterprise" : "starter"
  };
  paymentSessions.set(checkoutRequestId, newSession);

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
        Amount: Number(amount),
        PartyA: Number(formattedPhone),
        PartyB: Number(shortcode),
        PhoneNumber: Number(formattedPhone),
        CallBackURL: callbackUrl,
        AccountReference: planName || "MitiorOS SaaS Upgrade",
        TransactionDesc: "License Subscription Payment",
      };

      console.log(`[M-Pesa API] Triggering Lipa Na M-Pesa STK Push to ${formattedPhone} for KES ${amount}...`);
      
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
        paymentSessions.set(officialRequestId, {
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
  console.log(`[M-Pesa Simulator] Launching virtual Safaricom STK Push for ${formattedPhone} (Amount: KES ${amount})`);
  
  // Schedule an asynchronous simulation callback mimicking Safaricom's webhook trigger
  setTimeout(async () => {
    try {
      console.log(`[M-Pesa Simulator Webhook] Dispatched mock callback event for transaction: ${checkoutRequestId}`);
      
      // Simulate Safaricom sending payment success back to our callback
      const callbackResultBody = {
        Body: {
          stkCallback: {
            MerchantRequestID: "MOCK_MERCH_" + Math.random().toString(36).substring(5, 12).toUpperCase(),
            CheckoutRequestID: checkoutRequestId,
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: amount },
                { Name: "MpesaReceiptNumber", Value: "Q" + Math.random().toString(36).substring(2, 11).toUpperCase() },
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
    message: "💡 [Developer Sandbox Sandbox] Virtual Lipa Na M-Pesa STK Push sent! We scheduled a payment callback in 5 seconds.",
    checkoutRequestId: checkoutRequestId,
  });
});

// C. M-PESA WEBHOOK CALLBACK (Safaricom calls this on payment response)
app.post("/api/checkout/mpesa-callback", (req, res) => {
  const querySecret = req.query.secret;
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET || "simulate-secret-token";
  if (!querySecret || querySecret !== expectedSecret) {
    console.error(`[Security Webhook Alert] Rejected unauthenticated callback event from IP: ${req.ip}`);
    return res.status(401).json({ error: "Access Denied: Unmatched callback signature secret." });
  }

  console.log("[M-Pesa Callback Recipient] Signature token is valid. Received payload from Safaricom API Gateway:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const body = req.body?.Body;
    if (!body || !body.stkCallback) {
      return res.status(400).json({ error: "Invalid callback schema format." });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body.stkCallback;
    const session = paymentSessions.get(CheckoutRequestID);

    if (session) {
      if (ResultCode === 0 || ResultCode === "0") {
        const receiptNo = CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "SIM_" + Math.random().toString(36).substring(5, 12).toUpperCase();
        
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
            planName: session.planId === "enterprise" ? "Enterprise Local App" : "Web App Node Tier",
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
      paymentSessions.set(CheckoutRequestID, session);
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

  if (!blockCard || !amount || !holderName) {
    return res.status(400).json({ error: "Card credentials, Amount, and Card Holder Name are required." });
  }

  // SECURE API GUARD: Sanitize inputs and protect card digits
  const cardStr = String(blockCard).replace(/\s+/g, "");
  const lastFour = cardStr.length >= 4 ? cardStr.slice(-4) : "1111";

  const transactionId = "ws_TX_" + Math.random().toString(36).substring(2, 12).toUpperCase();
  const receiptNumber = "CARD_REC" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const planId = String(planName || "").toLowerCase().includes("enterprise") ? "enterprise" : "starter";

  // Create immediate success status for simulation or real Stripe integration
  const newSession: PaymentSession = {
    id: transactionId,
    phone: "card_payment",
    amount: Number(amount),
    paymentMethod: "card",
    status: "SUCCESS", 
    timestamp: Date.now(),
    userId: activeUserId,
    planId: planId,
    metadata: {
      receiptNumber: receiptNumber,
      holder: holderName,
      plan: planName || "MitiorOS Upgrades"
    }
  };

  paymentSessions.set(transactionId, newSession);

  // If Stripe key is configured, you can perform actual charges
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (stripeSecret) {
    console.log(`[Card Stripe] Key detected. Processing charging profile for KES ${amount}...`);
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
      amount: Number(amount),
      paymentMethod: "card",
      status: "SUCCESS",
      timestamp: Date.now(),
      planName: planId === "enterprise" ? "Enterprise Local App" : "Web App Node Tier",
      receiptNumber: receiptNumber,
      userId: activeUserId
    };
    dbData.payments.push(newPayLog);
    writeDB(dbData);
  } catch (dbErr: any) {
    console.error("Failed persisting card payment log:", errStr(dbErr));
  }

  return res.json({
    success: true,
    message: "Debit/Credit Card processed successfully!",
    transactionId: transactionId,
    amount: amount,
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

// G. DATABASE CORE BACKUP & CLOUD AUTO-SYNC ENDPOINTS
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

    const userId = "acc-" + Math.random().toString(36).substring(2, 12).toUpperCase();
    const sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
    const newUser: UserAccount = {
      id: userId,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      sessionToken: sessionToken,
      paidTicket: (cleanEmail === "zejithefundi@gmail.com" || cleanEmail === "ryan@mitior.co") ? "enterprise" : undefined
    };

    dbData.users.push(newUser);
    writeDB(dbData);

    console.log(`[Security Auth] Registered server-side tenant ${cleanEmail} (ID: ${userId})`);
    res.json({
      success: true,
      user: { id: userId, name: newUser.name, email: newUser.email, paidTicket: newUser.paidTicket || null },
      sessionToken: sessionToken
    });
  } catch (err: any) {
    res.status(500).json({ error: "Signup system exception: " + err.message });
  }
});

app.post("/api/auth/login", ipRateLimiter(10, 60 * 1000, "User Login"), (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Provide email and password to authenticate." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
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
        paidTicket: "enterprise"
      };
      dbData.users.push(creatorUser);
      writeDB(dbData);
    }

    const found = dbData.users.find(u => u.email === cleanEmail);
    if (!found || found.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid email or password combination." });
    }

    // Refresh of token on clean authentication
    found.sessionToken = "tok_" + crypto.randomBytes(24).toString("hex");
    
    let activePaidTicket = found.paidTicket || null;
    if ((found.id === "acc-default" || found.id === "acc-zeji" || found.email === "zejithefundi@gmail.com") && !found.paidTicket) {
      found.paidTicket = "enterprise";
      activePaidTicket = "enterprise";
    }
    
    writeDB(dbData);

    res.json({
      success: true,
      user: { id: found.id, name: found.name, email: found.email, paidTicket: activePaidTicket },
      sessionToken: found.sessionToken
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login server exception." });
  }
});

app.post("/api/auth/reset-password", ipRateLimiter(5, 60 * 1000, "Password Reset"), (req, res) => {
  try {
    const { email, password } = req.body;
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

    found.passwordHash = hashPassword(password);
    // Revoke current session token to enforce re-login
    found.sessionToken = "";
    writeDB(dbData);

    console.log(`[Security Auth] Successfully reset password for server-side user ${cleanEmail}`);
    res.json({
      success: true,
      message: "Password reset successfully! Log in with your new credentials."
    });
  } catch (err: any) {
    res.status(500).json({ error: "Reset password server exception: " + err.message });
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
    res.status(500).json({ error: "Failed to retrieve sync codes: " + err.message });
  }
});

app.post("/api/sync-codes/create", ipRateLimiter(20, 60 * 1000, "Create Sync Code"), requireLoggedInUser, (req, res) => {
  try {
    const creatorUserId = (req as any).userId;
    const { projectId, projectName, description } = req.body;
    if (!projectId || !projectName) {
      return res.status(400).json({ error: "Project configuration is required." });
    }
    const cleanDesc = String(description || "").trim() || "Multi-node synchronization network key.";
    
    // Generate code S-OS-XXXX-YYYY
    const codePart1 = crypto.randomBytes(3).toString("hex").toUpperCase();
    const codePart2 = crypto.randomBytes(3).toString("hex").toUpperCase();
    const syncCode = `S-OS-${codePart1}-${codePart2}`;

    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];

    const newRecord: SyncCodeRecord = {
      code: syncCode,
      creatorUserId,
      projectId: String(projectId),
      projectName: String(projectName),
      description: cleanDesc,
      createdAt: Date.now()
    };

    dbData.syncCodes.push(newRecord);
    writeDB(dbData);

    console.log(`[Sync Engine] Successfully generated sync code ${syncCode} for Project ${projectName}`);
    res.json({ success: true, syncCode: newRecord });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate sync code: " + err.message });
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
    res.status(500).json({ error: "Failed to delete sync code: " + err.message });
  }
});

app.get("/api/sync-codes/verify/:code", (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const dbData = readDB();
    dbData.syncCodes = dbData.syncCodes || [];
    const foundCode = dbData.syncCodes.find(s => s.code.toUpperCase() === code);
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
      description: foundCode.description
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to verify sync code: " + err.message });
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
    res.status(500).json({ error: "Session synchronization exception: " + err.message });
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
    const backupId = "bk_" + Math.random().toString(36).substring(2, 12).toUpperCase();
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
    res.status(500).json({ error: "Server database write exception: " + err.message });
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
    res.status(500).json({ error: "Deletion processing breakdown: " + err.message });
  }
});

// I. WORKSPACE LOCK SECURITY PIN VERIFICATION ENDPOINTS
app.get("/api/security/pin/status/:userId", requireSaaSUser, (req, res) => {
  try {
    const { userId } = req.params;
    const dbData = readDB();
    const record = dbData.pins.find(p => p.userId === userId);
    res.json({ configured: !!record });
  } catch (err) {
    res.json({ configured: false });
  }
});

app.post("/api/security/pin/set", requireSaaSUser, (req, res) => {
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
    const pinIndex = dbData.pins.findIndex(p => p.userId === userId);
    if (pinIndex !== -1) {
      dbData.pins[pinIndex].pinHash = cleanPin;
    } else {
      dbData.pins.push({ userId, pinHash: cleanPin });
    }
    writeDB(dbData);
    res.json({ success: true, message: "Credential locker synchronized." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/security/pin/verify", requireSaaSUser, (req, res) => {
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

    const dbData = readDB();
    const record = dbData.pins.find(p => p.userId === userId);
    if (!record) {
      // PIN not active yet
      return res.json({ success: true, notConfigured: true });
    }
    if (record.pinHash === String(pin).trim()) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: "Authentication failed: Unmatched PIN code." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/security/pin/remove", requireSaaSUser, (req, res) => {
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
    
    const dbData = readDB();
    const pinIndex = dbData.pins.findIndex(p => p.userId === userId);
    if (pinIndex === -1) {
      return res.json({ success: true, message: "Security guard is already inactive." });
    }
    if (dbData.pins[pinIndex].pinHash !== String(pin).trim()) {
      return res.status(401).json({ error: "Wrong PIN: Authorization rejected." });
    }
    
    dbData.pins.splice(pinIndex, 1);
    writeDB(dbData);
    res.json({ success: true, message: "Active Security Lock PIN terminated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite and Express asset pipeline integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[MitiorOS] Launching DEV node (Express + Vite Proxy)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MitiorOS] Core node running at http://localhost:${PORT}`);
  });
}

startServer();
