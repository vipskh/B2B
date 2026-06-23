import { Products } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { withVendor } from "../lib/populate.js";

// GET /api/products — public catalog with search, filters, sorting, pagination
export async function getProducts(req, res) {
  try {
    const { search, category, vendor, minPrice, maxPrice, sort = "newest", page = 1, limit = 20 } =
      req.query;

    const q = [Query.equal("status", "active")];
    if (category) q.push(Query.equal("category", category));
    if (vendor) q.push(Query.equal("vendor", vendor));
    if (search) q.push(Query.search("name", String(search)));
    if (minPrice) q.push(Query.greaterThanEqual("price", Number(minPrice)));
    if (maxPrice) q.push(Query.lessThanEqual("price", Number(maxPrice)));

    const sortMap = {
      newest: [Query.orderDesc("$createdAt")],
      price_asc: [Query.orderAsc("price")],
      price_desc: [Query.orderDesc("price")],
      rating: [Query.orderDesc("averageRating")],
    };
    q.push(...(sortMap[sort] || sortMap.newest));

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    q.push(Query.limit(limitNum), Query.offset((pageNum - 1) * limitNum));

    const { rows, total } = await Products.listPage(q);
    const products = await withVendor(rows, {
      select: ["companyName", "slug", "verificationStatus", "badges"],
    });

    res.status(200).json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/products/:id — product detail with supplier info
export async function getProductById(req, res) {
  try {
    const product = await Products.get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const withSupplier = await withVendor(product, {
      select: [
        "companyName",
        "slug",
        "logo",
        "verificationStatus",
        "badges",
        "rating",
        "country",
        "yearEstablished",
        "responseRate",
      ],
    });

    res.status(200).json(withSupplier);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
