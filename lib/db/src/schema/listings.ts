import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  deal_type: text("deal_type").notNull(),
  wilaya: text("wilaya").notNull(),
  municipality: text("municipality").notNull(),
  neighborhoods: text("neighborhoods").array().notNull().default([]),
  asking_price: numeric("asking_price", { precision: 15, scale: 2 }).notNull(),
  floor_price: numeric("floor_price", { precision: 15, scale: 2 }).notNull(),
  user_phone: text("user_phone").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  created_at: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  listing_id: integer("listing_id").notNull().references(() => listingsTable.id),
  buyer_phone: text("buyer_phone").notNull(),
  budget: numeric("budget", { precision: 15, scale: 2 }).notNull(),
  matched: text("matched").notNull().default("false"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
