import { IStorage } from "./types";
import { User, InsertUser, Donation, InsertDonation, Charity, InsertCharity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private donations: Map<number, Donation>;
  private charities: Map<number, Charity>;
  sessionStore: session.Store;
  currentUserId: number;
  currentDonationId: number;
  currentCharityId: number;

  constructor() {
    this.users = new Map();
    this.donations = new Map();
    this.charities = new Map();
    this.currentUserId = 1;
    this.currentDonationId = 1;
    this.currentCharityId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with some sample charities
    this.initializeCharities();
  }

  private initializeCharities() {
    const sampleCharities: InsertCharity[] = [
      {
        name: "Children's Education Fund",
        description: "Supporting education for underprivileged children",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7",
        category: "Education",
      },
      {
        name: "Food for All",
        description: "Providing meals to those in need",
        imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
        category: "Food Security",
      },
      {
        name: "Healthcare for All",
        description: "Making healthcare accessible to everyone",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
        category: "Healthcare",
      },
    ];

    sampleCharities.forEach(charity => this.createCharity(charity));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      referralCode: nanoid(8),
      goalAmount: 1000,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllCharities(): Promise<Charity[]> {
    return Array.from(this.charities.values());
  }

  async getCharity(id: number): Promise<Charity | undefined> {
    return this.charities.get(id);
  }

  async createCharity(insertCharity: InsertCharity): Promise<Charity> {
    const id = this.currentCharityId++;
    const charity: Charity = {
      ...insertCharity,
      id,
    };
    this.charities.set(id, charity);
    return charity;
  }

  async createDonation(insertDonation: InsertDonation & { stripePaymentId: string }): Promise<Donation> {
    const id = this.currentDonationId++;
    const donation: Donation = {
      ...insertDonation,
      id,
      createdAt: new Date(),
    };
    this.donations.set(id, donation);
    return donation;
  }

  async getDonationsByReferralCode(code: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(
      (donation) => donation.referralCode === code,
    );
  }

  async getTotalDonationsByReferralCode(code: string): Promise<number> {
    const donations = await this.getDonationsByReferralCode(code);
    return donations.reduce((sum, donation) => sum + donation.amount, 0);
  }
}

export const storage = new MemStorage();