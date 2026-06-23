import { RFQs, Quotes } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { withVendor } from "../lib/populate.js";

// ---------- BUYER ----------
export async function createRFQ(req, res) {
  try {
    const { title, description, category, quantity, unit, targetPrice, images, expiresInDays } =
      req.body;
    if (!title || !description || !quantity) {
      return res.status(400).json({ message: "title, description and quantity are required" });
    }
    const rfq = await RFQs.create({
      buyer: req.user._id,
      clerkId: req.user.clerkId || "",
      title,
      description,
      category: category || "",
      quantity: Number(quantity),
      unit: unit || "piece",
      ...(targetPrice ? { targetPrice: Number(targetPrice) } : {}),
      images: Array.isArray(images) ? images : [],
      status: "open",
      quotesCount: 0,
      ...(expiresInDays
        ? { expiresAt: new Date(Date.now() + Number(expiresInDays) * 86400000).toISOString() }
        : {}),
    });
    res.status(201).json(rfq);
  } catch (error) {
    console.error("Error in createRFQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyRFQs(req, res) {
  try {
    const rfqs = await RFQs.list([
      Query.equal("buyer", req.user._id),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    res.status(200).json({ rfqs });
  } catch (error) {
    console.error("Error in getMyRFQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRFQById(req, res) {
  try {
    const rfq = await RFQs.get(req.params.id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    res.status(200).json(rfq);
  } catch (error) {
    console.error("Error in getRFQById:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getQuotesForRFQ(req, res) {
  try {
    const rfq = await RFQs.get(req.params.id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    if (rfq.buyer !== req.user._id) return res.status(403).json({ message: "Not your RFQ" });

    let quotes = await Quotes.list([
      Query.equal("rfq", rfq._id),
      Query.orderAsc("price"),
      Query.limit(100),
    ]);
    quotes = await withVendor(quotes, {
      select: ["companyName", "slug", "verificationStatus", "badges", "rating"],
    });
    res.status(200).json({ quotes });
  } catch (error) {
    console.error("Error in getQuotesForRFQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptQuote(req, res) {
  try {
    const { id, quoteId } = req.params;
    const rfq = await RFQs.get(id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    if (rfq.buyer !== req.user._id) return res.status(403).json({ message: "Not your RFQ" });

    const quote = await Quotes.get(quoteId);
    if (!quote || quote.rfq !== rfq._id) return res.status(404).json({ message: "Quote not found" });

    await Quotes.update(quoteId, { status: "accepted" });
    const others = await Quotes.list([Query.equal("rfq", rfq._id), Query.limit(100)]);
    await Promise.all(
      others.filter((q) => q._id !== quoteId).map((q) => Quotes.update(q._id, { status: "rejected" }))
    );
    await RFQs.update(rfq._id, { status: "awarded" });

    res.status(200).json({ message: "Quote accepted" });
  } catch (error) {
    console.error("Error in acceptQuote:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ---------- VENDOR ----------
export async function listOpenRFQs(req, res) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const q = [Query.equal("status", "open")];
    if (category) q.push(Query.equal("category", category));
    if (search) q.push(Query.search("title", String(search)));
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    q.push(Query.orderDesc("$createdAt"), Query.limit(limitNum), Query.offset((pageNum - 1) * limitNum));

    const { rows, total } = await RFQs.listPage(q);
    res.status(200).json({ rfqs: rows, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Error in listOpenRFQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function submitQuote(req, res) {
  try {
    const { price, moq, leadTimeDays, message } = req.body;
    if (price === undefined) return res.status(400).json({ message: "price is required" });

    const rfq = await RFQs.get(req.params.id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    if (rfq.status !== "open") return res.status(400).json({ message: "This RFQ is no longer open" });

    const existing = await Quotes.findOne([
      Query.equal("rfq", rfq._id),
      Query.equal("vendor", req.vendor._id),
    ]);
    if (existing) return res.status(400).json({ message: "You already quoted this RFQ" });

    const quote = await Quotes.create({
      rfq: rfq._id,
      vendor: req.vendor._id,
      price: parseFloat(price),
      moq: moq ? parseInt(moq) : 1,
      ...(leadTimeDays !== undefined ? { leadTimeDays: parseInt(leadTimeDays) } : {}),
      message: message || "",
      status: "submitted",
    });
    await RFQs.incr(rfq._id, "quotesCount", 1);
    res.status(201).json(quote);
  } catch (error) {
    console.error("Error in submitQuote:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyQuotes(req, res) {
  try {
    const quotes = await Quotes.list([
      Query.equal("vendor", req.vendor._id),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    // attach minimal rfq info
    const withRfq = await Promise.all(
      quotes.map(async (q) => {
        const rfq = await RFQs.get(q.rfq);
        return {
          ...q,
          rfq: rfq
            ? { _id: rfq._id, title: rfq.title, quantity: rfq.quantity, unit: rfq.unit, status: rfq.status }
            : q.rfq,
        };
      })
    );
    res.status(200).json({ quotes: withRfq });
  } catch (error) {
    console.error("Error in getMyQuotes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
