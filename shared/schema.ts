import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  goalAmount: integer("goal_amount").notNull().default(1000),
});

export const charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(),
  donorName: text("donor_name").notNull(),
  referralCode: text("referral_code").notNull(),
  message: text("message"),
  charityId: integer("charity_id").notNull(),
  stripePaymentId: text("stripe_payment_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
}).extend({
  password: z.string().min(6)
});

export const insertCharitySchema = createInsertSchema(charities);

export const insertDonationSchema = createInsertSchema(donations).pick({
  amount: true,
  donorName: true,
  referralCode: true,
  message: true,
  charityId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type Charity = typeof charities.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;