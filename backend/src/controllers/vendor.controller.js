import { Vendors, Products, Users } from "../db/models.js";
import { Query } from "../appwrite/client.js";

async function generateUniqueSlug(companyName) {
  const base =
    companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vendor";
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Vendors.findOne([Query.equal("slug", slug)])) slug = `${base}-${n++}`;
  return slug;
}

// POST /api/vendors/apply
export async function applyAsVendor(req, res) {
  try {
    const user = req.user;
    if (user.vendor) return res.status(400).json({ message: "You already have a seller account" });

    const {
      companyName,
      description,
      businessType,
      country,
      province,
      city,
      addressLine,
      yearEstablished,
      contactName,
      contactEmail,
      contactPhone,
      logo,
      banner,
    } = req.body;

    if (!companyName) return res.status(400).json({ message: "Company name is required" });

    const slug = await generateUniqueSlug(companyName);

    const vendor = await Vendors.create({
      owner: user._id,
      companyName,
      slug,
      description: description || "",
      businessType: businessType || "other",
      country: country || "",
      province: province || "",
      city: city || "",
      addressLine: addressLine || "",
      ...(yearEstablished ? { yearEstablished: Number(yearEstablished) } : {}),
      contactName: contactName || user.name,
      contactEmail: contactEmail || user.email,
      contactPhone: contactPhone || "",
      logo: logo || "",
      banner: banner || "",
      status: "pending",
      verificationStatus: "unverified",
    });

    await Users.update(user._id, { role: "vendor", vendor: vendor._id });

    res.status(201).json({ message: "Seller account created", vendor });
  } catch (error) {
    console.error("Error in applyAsVendor controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/vendors/me
export async function getMyVendor(req, res) {
  try {
    if (!req.user.vendor) return res.status(404).json({ message: "No seller account" });
    const vendor = await Vendors.get(req.user.vendor);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error in getMyVendor controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/vendors/me
export async function updateMyVendor(req, res) {
  try {
    if (!req.user.vendor) return res.status(404).json({ message: "No seller account" });
    const editable = [
      "companyName",
      "description",
      "businessType",
      "country",
      "province",
      "city",
      "addressLine",
      "yearEstablished",
      "contactName",
      "contactEmail",
      "contactPhone",
      "logo",
      "banner",
    ];
    const patch = {};
    for (const f of editable) if (req.body[f] !== undefined) patch[f] = req.body[f];
    if (patch.yearEstablished !== undefined) patch.yearEstablished = Number(patch.yearEstablished);

    const vendor = await Vendors.update(req.user.vendor, patch);
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error in updateMyVendor controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/vendors — public supplier directory
export async function listVendors(req, res) {
  try {
    const { search, businessType, verified, page = 1, limit = 20 } = req.query;
    const q = [Query.equal("status", "active")];
    if (businessType) q.push(Query.equal("businessType", businessType));
    if (verified === "true") q.push(Query.equal("verificationStatus", "verified"));
    if (search) q.push(Query.search("companyName", String(search)));

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    q.push(
      Query.orderDesc("ratingAverage"),
      Query.limit(limitNum),
      Query.offset((pageNum - 1) * limitNum)
    );

    const { rows, total } = await Vendors.listPage(q);
    res.status(200).json({ vendors: rows, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Error in listVendors controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/vendors/:slug — public store page
export async function getVendorBySlug(req, res) {
  try {
    const vendor = await Vendors.findOne([
      Query.equal("slug", req.params.slug),
      Query.equal("status", "active"),
    ]);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error in getVendorBySlug controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/vendors/:id/products — public list of a vendor's active products
export async function getVendorProducts(req, res) {
  try {
    const products = await Products.list([
      Query.equal("vendor", req.params.id),
      Query.equal("status", "active"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error in getVendorProducts controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
