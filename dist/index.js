// server/index.ts
import express2 from "express";

// server/routes.ts
import Stripe from "stripe";
import dotenv from "dotenv";
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";
var MemoryStore = createMemoryStore(session);
var MemStorage = class {
  users;
  donations;
  charities;
  sessionStore;
  currentUserId;
  currentDonationId;
  currentCharityId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.donations = /* @__PURE__ */ new Map();
    this.charities = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentDonationId = 1;
    this.currentCharityId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
    this.initializeCharities();
  }
  initializeCharities() {
    const sampleCharities = [
      {
        name: "Children's Education Fund",
        description: "Supporting education for underprivileged children",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7",
        category: "Education"
      },
      {
        name: "Food for All",
        description: "Providing meals to those in need",
        imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
        category: "Food Security"
      },
      {
        name: "Healthcare for All",
        description: "Making healthcare accessible to everyone",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
        category: "Healthcare"
      }
    ];
    sampleCharities.forEach((charity) => this.createCharity(charity));
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByReferralCode(code) {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = {
      ...insertUser,
      id,
      referralCode: nanoid(8),
      goalAmount: 1e3
    };
    this.users.set(id, user);
    return user;
  }
  async getAllCharities() {
    return Array.from(this.charities.values());
  }
  async getCharity(id) {
    return this.charities.get(id);
  }
  async createCharity(insertCharity) {
    const id = this.currentCharityId++;
    const charity = {
      ...insertCharity,
      id
    };
    this.charities.set(id, charity);
    return charity;
  }
  async createDonation(insertDonation) {
    const id = this.currentDonationId++;
    const donation = {
      ...insertDonation,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.donations.set(id, donation);
    return donation;
  }
  async getDonationsByReferralCode(code) {
    return Array.from(this.donations.values()).filter(
      (donation) => donation.referralCode === code
    );
  }
  async getTotalDonationsByReferralCode(code) {
    const donations2 = await this.getDonationsByReferralCode(code);
    return donations2.reduce((sum, donation) => sum + donation.amount, 0);
  }
};
var storage = new MemStorage();

// server/auth.ts
import session2 from "express-session";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  goalAmount: integer("goal_amount").notNull().default(1e3)
});
var charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull()
});
var donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(),
  donorName: text("donor_name").notNull(),
  referralCode: text("referral_code").notNull(),
  message: text("message"),
  charityId: integer("charity_id").notNull(),
  stripePaymentId: text("stripe_payment_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true
}).extend({
  password: z.string().min(6)
});
var insertCharitySchema = createInsertSchema(charities);
var insertDonationSchema = createInsertSchema(donations).pick({
  amount: true,
  donorName: true,
  referralCode: true,
  message: true,
  charityId: true
});

// server/routes.ts
dotenv.config();
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia"
});
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/charities", async (_req, res) => {
    const charities2 = await storage.getAllCharities();
    res.json(charities2);
  });
  app2.get("/api/donations/:referralCode", async (req, res) => {
    const donations2 = await storage.getDonationsByReferralCode(req.params.referralCode);
    res.json(donations2);
  });
  app2.get("/api/fundraiser/:referralCode", async (req, res) => {
    const user = await storage.getUserByReferralCode(req.params.referralCode);
    if (!user) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }
    const total = await storage.getTotalDonationsByReferralCode(user.referralCode);
    res.json({ user, total });
  });
  app2.post("/api/create-payment-intent", async (req, res) => {
    const { amount } = req.body;
    if (amount < 50) {
      return res.status(400).json({ message: "Minimum donation amount is \u20B950" });
    }
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        // Convert to paise
        currency: "inr",
        payment_method_types: ["card"]
        // Support credit/debit cards
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/donations", async (req, res) => {
    const result = insertDonationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const user = await storage.getUserByReferralCode(result.data.referralCode);
    if (!user) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }
    const charity = await storage.getCharity(result.data.charityId);
    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }
    const donation = await storage.createDonation({
      ...result.data,
      stripePaymentId: req.body.stripePaymentId
    });
    res.status(201).json(donation);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
