import { Router, Request, Response } from "express";
import { db, listingsTable, matchesTable } from "@workspace/db";
import { eq, desc, sql, and, lte } from "drizzle-orm";
import { CreateListingBody, GetListingsQueryParams, MatchListingBody, MatchListingParams, GetListingParams } from "@workspace/api-zod";

const router = Router();

const WILAYAT = [
  { code: 1, name: "Adrar", name_ar: "أدرار" },
  { code: 2, name: "Chlef", name_ar: "الشلف" },
  { code: 3, name: "Laghouat", name_ar: "الأغواط" },
  { code: 4, name: "Oum El Bouaghi", name_ar: "أم البواقي" },
  { code: 5, name: "Batna", name_ar: "باتنة" },
  { code: 6, name: "Béjaïa", name_ar: "بجاية" },
  { code: 7, name: "Biskra", name_ar: "بسكرة" },
  { code: 8, name: "Béchar", name_ar: "بشار" },
  { code: 9, name: "Blida", name_ar: "البليدة" },
  { code: 10, name: "Bouira", name_ar: "البويرة" },
  { code: 11, name: "Tamanrasset", name_ar: "تمنراست" },
  { code: 12, name: "Tébessa", name_ar: "تبسة" },
  { code: 13, name: "Tlemcen", name_ar: "تلمسان" },
  { code: 14, name: "Tiaret", name_ar: "تيارت" },
  { code: 15, name: "Tizi Ouzou", name_ar: "تيزي وزو" },
  { code: 16, name: "Alger", name_ar: "الجزائر" },
  { code: 17, name: "Djelfa", name_ar: "الجلفة" },
  { code: 18, name: "Jijel", name_ar: "جيجل" },
  { code: 19, name: "Sétif", name_ar: "سطيف" },
  { code: 20, name: "Saïda", name_ar: "سعيدة" },
  { code: 21, name: "Skikda", name_ar: "سكيكدة" },
  { code: 22, name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس" },
  { code: 23, name: "Annaba", name_ar: "عنابة" },
  { code: 24, name: "Guelma", name_ar: "قالمة" },
  { code: 25, name: "Constantine", name_ar: "قسنطينة" },
  { code: 26, name: "Médéa", name_ar: "المدية" },
  { code: 27, name: "Mostaganem", name_ar: "مستغانم" },
  { code: 28, name: "M'Sila", name_ar: "المسيلة" },
  { code: 29, name: "Mascara", name_ar: "معسكر" },
  { code: 30, name: "Ouargla", name_ar: "ورقلة" },
  { code: 31, name: "Oran", name_ar: "وهران" },
  { code: 32, name: "El Bayadh", name_ar: "البيض" },
  { code: 33, name: "Illizi", name_ar: "إليزي" },
  { code: 34, name: "Bordj Bou Arréridj", name_ar: "برج بوعريريج" },
  { code: 35, name: "Boumerdès", name_ar: "بومرداس" },
  { code: 36, name: "El Tarf", name_ar: "الطارف" },
  { code: 37, name: "Tindouf", name_ar: "تندوف" },
  { code: 38, name: "Tissemsilt", name_ar: "تيسمسيلت" },
  { code: 39, name: "El Oued", name_ar: "الوادي" },
  { code: 40, name: "Khenchela", name_ar: "خنشلة" },
  { code: 41, name: "Souk Ahras", name_ar: "سوق أهراس" },
  { code: 42, name: "Tipaza", name_ar: "تيبازة" },
  { code: 43, name: "Mila", name_ar: "ميلة" },
  { code: 44, name: "Aïn Defla", name_ar: "عين الدفلى" },
  { code: 45, name: "Naâma", name_ar: "النعامة" },
  { code: 46, name: "Aïn Témouchent", name_ar: "عين تموشنت" },
  { code: 47, name: "Ghardaïa", name_ar: "غرداية" },
  { code: 48, name: "Relizane", name_ar: "غليزان" },
  { code: 49, name: "Timimoun", name_ar: "تيميمون" },
  { code: 50, name: "Bordj Badji Mokhtar", name_ar: "برج باجي مختار" },
  { code: 51, name: "Ouled Djellal", name_ar: "أولاد جلال" },
  { code: 52, name: "Béni Abbès", name_ar: "بني عباس" },
  { code: 53, name: "In Salah", name_ar: "عين صالح" },
  { code: 54, name: "In Guezzam", name_ar: "عين قزام" },
  { code: 55, name: "Touggourt", name_ar: "تقرت" },
  { code: 56, name: "Djanet", name_ar: "جانت" },
  { code: 57, name: "El M'Ghair", name_ar: "المغير" },
  { code: 58, name: "El Meniaa", name_ar: "المنيعة" },
];

function formatListing(row: typeof listingsTable.$inferSelect) {
  return {
    id: row.id,
    deal_type: row.deal_type,
    wilaya: row.wilaya,
    municipality: row.municipality,
    neighborhoods: row.neighborhoods ?? [],
    asking_price: parseFloat(row.asking_price as unknown as string),
    user_phone: row.user_phone,
    created_at: row.created_at.toISOString(),
  };
}

router.get("/wilayat", (_req: Request, res: Response) => {
  res.json(WILAYAT);
});

router.get("/listings/stats", async (_req: Request, res: Response) => {
  const allListings = await db.select().from(listingsTable).orderBy(desc(listingsTable.created_at));
  const total = allListings.length;
  const for_sale = allListings.filter(l => l.deal_type === "بيع").length;
  const for_rent = allListings.filter(l => l.deal_type === "إيجار").length;

  const wilayaCounts: Record<string, number> = {};
  for (const l of allListings) {
    wilayaCounts[l.wilaya] = (wilayaCounts[l.wilaya] ?? 0) + 1;
  }
  const by_wilaya = Object.entries(wilayaCounts)
    .map(([wilaya, count]) => ({ wilaya, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recent_listings = allListings.slice(0, 6).map(formatListing);

  res.json({ total, for_sale, for_rent, by_wilaya, recent_listings });
});

router.get("/listings", async (req: Request, res: Response) => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { deal_type, wilaya, municipality, max_price } = parsed.data;

  const conditions = [];
  if (deal_type) conditions.push(eq(listingsTable.deal_type, deal_type));
  if (wilaya) conditions.push(eq(listingsTable.wilaya, wilaya));
  if (municipality) conditions.push(eq(listingsTable.municipality, municipality));
  if (max_price !== undefined) conditions.push(lte(listingsTable.asking_price, String(max_price)));

  const rows = conditions.length > 0
    ? await db.select().from(listingsTable).where(and(...conditions)).orderBy(desc(listingsTable.created_at))
    : await db.select().from(listingsTable).orderBy(desc(listingsTable.created_at));

  res.json(rows.map(formatListing));
});

router.post("/listings", async (req: Request, res: Response) => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const { deal_type, wilaya, municipality, neighborhoods, asking_price, floor_price, user_phone } = parsed.data;

  if (floor_price > asking_price) {
    res.status(400).json({ error: "السعر السري يجب أن يكون أقل من أو يساوي السعر المعلن" });
    return;
  }

  const [row] = await db.insert(listingsTable).values({
    deal_type,
    wilaya,
    municipality,
    neighborhoods: neighborhoods ?? [],
    asking_price: String(asking_price),
    floor_price: String(floor_price),
    user_phone,
  }).returning();

  res.status(201).json(formatListing(row));
});

router.get("/listings/:id", async (req: Request, res: Response) => {
  const parsed = GetListingParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(listingsTable).where(eq(listingsTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(formatListing(row));
});

router.post("/listings/:id/match", async (req: Request, res: Response) => {
  const idParsed = MatchListingParams.safeParse({ id: parseInt(String(req.params.id)) });
  if (!idParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = MatchListingBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { budget, buyer_phone } = bodyParsed.data;

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, idParsed.data.id));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const floor = parseFloat(listing.floor_price as unknown as string);
  const matched = budget >= floor;

  await db.insert(matchesTable).values({
    listing_id: idParsed.data.id,
    buyer_phone,
    budget: String(budget),
    matched: matched ? "true" : "false",
  });

  if (matched) {
    res.json({
      matched: true,
      listing_id: listing.id,
      seller_phone: listing.user_phone,
      message: "تهانينا! ميزانيتك تتطابق مع هذا العرض. يمكنك التواصل مع البائع مباشرةً.",
    });
  } else {
    res.json({
      matched: false,
      listing_id: listing.id,
      seller_phone: null,
      message: "للأسف، ميزانيتك لا تغطي الحد الأدنى لهذا العرض. جرب عرضاً آخر.",
    });
  }
});

export default router;
