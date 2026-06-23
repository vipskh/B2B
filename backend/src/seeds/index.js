import { Users, Vendors, Products, RFQs } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { ENV } from "../config/env.js";

const vendorsSeed = [
  {
    companyName: "Shenzhen TechSource Electronics Co., Ltd.",
    slug: "shenzhen-techsource",
    businessType: "manufacturer",
    country: "China", province: "Guangdong", city: "Shenzhen", yearEstablished: 2011,
    description: "Manufacturer of consumer electronics, audio devices and smart accessories. OEM/ODM welcome.",
    verificationStatus: "verified", badges: ["verified_supplier", "gold_supplier", "trade_assurance"],
    ratingAverage: 4.7, ratingCount: 1280, responseRate: 98, responseTimeHours: 3,
    logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200",
    banner: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000",
  },
  {
    companyName: "Guangzhou Luxe Leather Trading Co.",
    slug: "guangzhou-luxe-leather",
    businessType: "trading_company",
    country: "China", province: "Guangdong", city: "Guangzhou", yearEstablished: 2015,
    description: "Wholesale genuine & PU leather bags, wallets and fashion accessories. Low MOQ, custom branding.",
    verificationStatus: "verified", badges: ["verified_supplier", "trade_assurance"],
    ratingAverage: 4.4, ratingCount: 642, responseRate: 95, responseTimeHours: 5,
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000",
  },
  {
    companyName: "Yiwu Active Sports Goods Factory",
    slug: "yiwu-active-sports",
    businessType: "manufacturer",
    country: "China", province: "Zhejiang", city: "Yiwu", yearEstablished: 2009,
    description: "Sportswear, footwear and fitness equipment manufacturer. Bulk wholesale worldwide.",
    verificationStatus: "verified", badges: ["verified_supplier", "assessed_supplier"],
    ratingAverage: 4.6, ratingCount: 913, responseRate: 92, responseTimeHours: 6,
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200",
    banner: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000",
  },
  {
    companyName: "Hangzhou PaperWorks Printing Co., Ltd.",
    slug: "hangzhou-paperworks",
    businessType: "manufacturer",
    country: "China", province: "Zhejiang", city: "Hangzhou", yearEstablished: 2013,
    description: "Book printing, packaging and custom stationery. Offset & digital printing, global export.",
    verificationStatus: "verified", badges: ["verified_supplier"],
    ratingAverage: 4.5, ratingCount: 421, responseRate: 90, responseTimeHours: 8,
    logo: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=200",
    banner: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000",
  },
  {
    companyName: "Dongguan HomeStyle Furniture Manufacturing",
    slug: "dongguan-homestyle",
    businessType: "wholesaler",
    country: "China", province: "Guangdong", city: "Dongguan", yearEstablished: 2017,
    description: "Home & living wholesale: furniture, decor and household goods. Container-load pricing.",
    verificationStatus: "pending", badges: [],
    ratingAverage: 4.2, ratingCount: 118, responseRate: 85, responseTimeHours: 12,
    logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200",
    banner: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1000",
  },
];

const tiered = (base) => [
  { minQty: 1, price: base },
  { minQty: 100, price: +(base * 0.85).toFixed(2) },
  { minQty: 500, price: +(base * 0.72).toFixed(2) },
  { minQty: 1000, price: +(base * 0.6).toFixed(2) },
];

// cartesian product of options -> SKU variants, each with its own price/stock
const variantMatrix = (optionDefs, base) => {
  const combos = optionDefs.reduce(
    (acc, opt) => acc.flatMap((a) => opt.values.map((v) => ({ ...a, [opt.name]: v }))),
    [{}]
  );
  return combos.map((options, i) => ({
    id: Object.values(options).join("-").toLowerCase().replace(/\s+/g, "-"),
    options,
    price: +(base + (i % 3) * 0.6).toFixed(2),
    stock: 400 + (i % 4) * 150,
  }));
};

const img = (id) => `https://images.unsplash.com/photo-${id}?w=500`;

const productsByVendor = {
  "shenzhen-techsource": [
    { name: "Wireless Bluetooth Headphones", description: "Premium over-ear ANC headphones, 30-hour battery, OEM logo.", price: 28.5, stock: 5000, category: "Electronics", unit: "piece", moq: 50, images: [img("1505740420928-5e560c06d30e"), img("1484704849700-f032a568e944")], averageRating: 4.5, totalReviews: 128 },
    { name: "Smart Watch Series 5", description: "Fitness smartwatch with heart-rate, GPS and IP68.", price: 39.9, stock: 3500, category: "Electronics", unit: "piece", moq: 30, images: [img("1523275335684-37898b6baf30"), img("1546868871-7041f2a55e12")], averageRating: 4.7, totalReviews: 256 },
    { name: "Portable Bluetooth Speaker", description: "Waterproof 360° wireless speaker, 12h battery, TWS.", price: 15.2, stock: 8000, category: "Electronics", unit: "piece", moq: 100, images: [img("1608043152269-423dbba4e7e1"), img("1589003077984-894e133dabab")], averageRating: 4.4, totalReviews: 167 },
    { name: "Mechanical Keyboard RGB", description: "Hot-swappable RGB mechanical keyboard, bulk OEM.", price: 22.0, stock: 2600, category: "Electronics", unit: "piece", moq: 50, images: [img("1595225476474-87563907a212"), img("1587829741301-dc798b83add3")], averageRating: 4.7, totalReviews: 421 },
  ],
  "guangzhou-luxe-leather": [
    { name: "Leather Crossbody Bag", description: "Genuine leather crossbody bag, custom branding from 100 pcs.", price: 12.8, stock: 4000, category: "Fashion", unit: "piece", moq: 20, images: [img("1548036328-c9fa89d128fa"), img("1590874103328-eac38a683ce7")], averageRating: 4.3, totalReviews: 89 },
    { name: "Classic Denim Jacket", description: "Vintage-wash unisex denim jacket, full size range.", price: 9.5, stock: 6000, category: "Fashion", unit: "piece", moq: 50, images: [img("1551028719-00167b16eac5"), img("1578587018452-892bacefd3f2")], averageRating: 4.2, totalReviews: 95, variantOptions: [{ name: "Color", values: ["Blue", "Black"] }, { name: "Size", values: ["M", "L", "XL"] }] },
  ],
  "yiwu-active-sports": [
    { name: "Running Shoes - Pro Edition", description: "Lightweight running shoes, breathable mesh. Bulk export.", price: 14.0, stock: 7000, category: "Sports", unit: "pair", moq: 60, images: [img("1542291026-7eec264c27ff"), img("1606107557195-0e29a4b5b4aa")], averageRating: 4.6, totalReviews: 342, variantOptions: [{ name: "Size", values: ["40", "41", "42", "43"] }] },
    { name: "Yoga Mat Pro", description: "Extra-thick non-slip eco TPE yoga mat, custom colors.", price: 4.8, stock: 12000, category: "Sports", unit: "piece", moq: 100, images: [img("1601925260368-ae2f83cf8b7f"), img("1592432678016-e910b452f9a2")], averageRating: 4.5, totalReviews: 203, variantOptions: [{ name: "Color", values: ["Purple", "Green", "Black"] }] },
  ],
  "hangzhou-paperworks": [
    { name: "Custom Softcover Novel Printing", description: "Offset novel printing, custom cover, ISBN support.", price: 1.9, stock: 50000, category: "Books", unit: "piece", moq: 500, images: [img("1544947950-fa07a98d237f"), img("1512820790803-83ca734da794")], averageRating: 4.8, totalReviews: 1243 },
    { name: "Hardcover Coffee Table Book", description: "Premium hardcover photo book, 300+ pages.", price: 6.5, stock: 9000, category: "Books", unit: "piece", moq: 200, images: [img("1495446815901-a7297e633e8d"), img("1524995997946-a1c2e315a42f")], averageRating: 4.6, totalReviews: 134 },
  ],
  "dongguan-homestyle": [
    { name: "Minimalist Oak Side Table", description: "Solid oak flat-pack side table, container-load pricing.", price: 18.0, stock: 1500, category: "Home", unit: "piece", moq: 20, images: [img("1555041469-a586c61ea9bc"), img("1538688525198-9b88f6f53126")], averageRating: 4.2, totalReviews: 41 },
  ],
};

async function wipe(repo) {
  // delete all rows (dev seed); paginate until empty
  for (let i = 0; i < 100; i++) {
    const { rows } = await repo.listPage([Query.limit(100)]);
    if (!rows.length) return;
    await Promise.all(rows.map((r) => repo.remove(r._id)));
  }
}

async function run() {
  if (!ENV.APPWRITE_API_KEY) {
    console.error("❌ APPWRITE_API_KEY missing. Run `npm run appwrite:setup` first and fill .env.");
    process.exit(1);
  }

  console.log("🗑️  Clearing existing data…");
  for (const repo of [Products, Vendors, Users, RFQs]) await wipe(repo);

  // platform admin + a demo buyer (for the dev user-switcher)
  const admin = await Users.create({
    email: ENV.ADMIN_EMAIL || "admin@seed.local",
    name: "Platform Admin",
    role: "admin",
  });
  const buyer = await Users.create({
    email: "buyer@seed.local",
    name: "Demo Buyer",
    role: "buyer",
  });

  let vendorCount = 0;
  let productCount = 0;
  for (const [i, v] of vendorsSeed.entries()) {
    const owner = await Users.create({
      email: `seller${i + 1}@seed.local`,
      name: `${v.companyName} Owner`,
      role: "vendor",
    });
    const vendor = await Vendors.create({
      ...v,
      owner: owner._id,
      status: v.verificationStatus === "verified" ? "active" : "pending",
      contactName: owner.name,
      contactEmail: owner.email,
      ...(v.verificationStatus === "verified" ? { verifiedAt: new Date().toISOString() } : {}),
    });
    await Users.update(owner._id, { vendor: vendor._id });
    vendorCount++;

    const items = productsByVendor[v.slug] || [];
    for (const p of items) {
      const hasVar = Array.isArray(p.variantOptions) && p.variantOptions.length > 0;
      await Products.create({
        ...p,
        vendor: vendor._id,
        // variant products price per-variant; flat products use wholesale tiers
        priceTiers: hasVar ? [] : tiered(p.price),
        variants: hasVar ? variantMatrix(p.variantOptions, p.price) : [],
        status: "active",
      });
      productCount++;
    }
    await Vendors.update(vendor._id, { totalProducts: items.length });
  }

  // a couple of open RFQs from the demo buyer
  await RFQs.create({
    buyer: buyer._id, title: "Need 2000 wireless earbuds (OEM)", description: "Looking for TWS earbuds with custom packaging and logo.",
    category: "Electronics", quantity: 2000, unit: "piece", targetPrice: 6.5, images: [], status: "open", quotesCount: 0,
  });
  await RFQs.create({
    buyer: buyer._id, title: "Bulk cotton tote bags", description: "Plain natural cotton tote bags, screen-print ready.",
    category: "Fashion", quantity: 5000, unit: "piece", images: [], status: "open", quotesCount: 0,
  });

  console.log("\n📊 Seed summary:");
  console.log(`   Users:    ${vendorCount + 2} (1 admin, 1 buyer, ${vendorCount} sellers)`);
  console.log(`   Vendors:  ${vendorCount}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Admin:    ${admin.email}`);
  console.log("\n✅ Seeding complete");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e?.message || e);
  process.exit(1);
});
