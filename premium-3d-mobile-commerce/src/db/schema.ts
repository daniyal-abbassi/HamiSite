import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameFa: text("name_fa").notNull(),
  nameEn: text("name_en").notNull(),
  tagline: text("tagline").notNull(),
  world: text("world").notNull(), // 3D concept key
  sort: integer("sort").notNull().default(0),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameFa: text("name_fa").notNull(),
  world: text("world").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brandId: integer("brand_id")
    .notNull()
    .references(() => brands.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  price: bigint("price", { mode: "number" }).notNull(), // Toman
  dealPrice: bigint("deal_price", { mode: "number" }),
  dealEndsAt: timestamp("deal_ends_at", { withTimezone: true }),
  image: text("image").notNull(),
  color: text("color").notNull().default("گرافیت"),
  storage: text("storage"),
  badge: text("badge"),
  isNew: boolean("is_new").notNull().default(false),
  isFlagship: boolean("is_flagship").notNull().default(false),
  stock: integer("stock").notNull().default(0),
  rating: integer("rating").notNull().default(48), // x10
  specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  src: text("src").notNull(),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  aspect: text("aspect").notNull().default("landscape"),
  sort: integer("sort").notNull().default(0),
});

export const partnershipRequests = pgTable("partnership_requests", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  businessType: text("business_type").notNull(),
  monthlyVolume: text("monthly_volume").notNull(),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
