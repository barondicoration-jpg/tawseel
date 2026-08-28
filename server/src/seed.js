/**
 * Seed script — clears the database and populates default data.
 * Run with: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Zone from "./models/Zone.js";
import Order from "./models/Order.js";
import DelegateProgress from "./models/DelegateProgress.js";
import DailySequence from "./models/DailySequence.js";

const DEFAULT_ZONES = [
  { name: "التجمع الأول", description: "منطقة التجمع الأول" },
  { name: "التجمع الثالث", description: "منطقة التجمع الثالث" },
  { name: "التجمع الخامس", description: "منطقة التجمع الخامس" },
  { name: "الرحاب", description: "منطقة الرحاب" },
];

const DEFAULT_USERS = [
  {
    username: "admin",
    password: "2020",
    displayName: "المدير العام",
    role: "admin",
  },
  {
    username: "supervisor",
    password: "2020",
    displayName: "المشرف",
    role: "supervisor",
  },
  {
    username: "delegate1",
    password: "2020",
    displayName: "مندوب ١",
    role: "delegate",
    zone: "التجمع الأول",
  },
  {
    username: "delegate2",
    password: "2020",
    displayName: "مندوب ٢",
    role: "delegate",
    zone: "التجمع الثالث",
  },
  {
    username: "delegate3",
    password: "2020",
    displayName: "مندوب ٣",
    role: "delegate",
    zone: "التجمع الخامس",
  },
  {
    username: "viewer",
    password: "2020",
    displayName: "مشاهد",
    role: "viewer",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Zone.deleteMany({}),
      Order.deleteMany({}),
      DelegateProgress.deleteMany({}),
      DailySequence.deleteMany({}),
    ]);
    console.log("🗑️  Cleared all collections");

    // Seed zones
    await Zone.insertMany(DEFAULT_ZONES);
    console.log(`📍 Created ${DEFAULT_ZONES.length} zones`);

    // Seed users — bcrypt hashing is handled by the pre-save hook
    for (const userData of DEFAULT_USERS) {
      await User.create(userData);
    }
    console.log(`👤 Created ${DEFAULT_USERS.length} users`);

    console.log("\n✅ Seed complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    DEFAULT_USERS.forEach((u) => {
      console.log(`  ${u.role.padEnd(12)} → ${u.username} / ${u.password}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
