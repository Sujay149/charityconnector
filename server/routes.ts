import Stripe from 'stripe';
import dotenv from 'dotenv';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDonationSchema } from "@shared/schema";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/charities", async (_req, res) => {
    const charities = await storage.getAllCharities();
    res.json(charities);
  });

  app.get("/api/donations/:referralCode", async (req, res) => {
    const donations = await storage.getDonationsByReferralCode(req.params.referralCode);
    res.json(donations);
  });

  app.get("/api/fundraiser/:referralCode", async (req, res) => {
    const user = await storage.getUserByReferralCode(req.params.referralCode);
    if (!user) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    const total = await storage.getTotalDonationsByReferralCode(user.referralCode);
    res.json({ user, total });
  });

  // ✅ Create Payment Intent for Stripe Checkout
  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount } = req.body;
    if (amount < 50) {
      return res.status(400).json({ message: "Minimum donation amount is ₹50" });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to paise
        currency: "inr",
        payment_method_types: ["card"], // Support credit/debit cards
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ✅ Handle Donation Confirmation and Storage
  app.post("/api/donations", async (req, res) => {
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

    // Store donation details
    const donation = await storage.createDonation({
      ...result.data,
      stripePaymentId: req.body.stripePaymentId,
    });

    res.status(201).json(donation);
  });

  const httpServer = createServer(app);
  return httpServer;
}
