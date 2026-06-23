import { Reviews, Products, Vendors, Orders } from "../db/models.js";
import { Query } from "../appwrite/client.js";

async function recomputeProductRating(productId) {
  const reviews = await Reviews.list([Query.equal("productId", productId), Query.limit(1000)]);
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await Products.update(productId, { averageRating: average, totalReviews: count });
}

async function recomputeVendorRating(vendorId) {
  if (!vendorId) return;
  const reviews = await Reviews.list([Query.equal("vendorId", vendorId), Query.limit(1000)]);
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await Vendors.update(vendorId, { ratingAverage: average, ratingCount: count });
}

export async function createReview(req, res) {
  try {
    const { productId, orderId, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const order = await Orders.get(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.user !== req.user._id) {
      return res.status(403).json({ error: "Not authorized to review this order" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Can only review delivered orders" });
    }
    const inOrder = (order.orderItems || []).some((it) => String(it.product) === String(productId));
    if (!inOrder) return res.status(400).json({ error: "Product not found in this order" });

    const existing = await Reviews.findOne([
      Query.equal("productId", productId),
      Query.equal("userId", req.user._id),
    ]);
    const data = {
      productId,
      userId: req.user._id,
      orderId,
      vendorId: order.vendor,
      rating: Number(rating),
      comment: comment || "",
    };
    const review = existing ? await Reviews.update(existing._id, data) : await Reviews.create(data);

    await recomputeProductRating(productId);
    await recomputeVendorRating(order.vendor);

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error in createReview controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteReview(req, res) {
  try {
    const review = await Reviews.get(req.params.reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.userId !== req.user._id) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }
    const { productId, vendorId } = review;
    await Reviews.remove(review._id);
    await recomputeProductRating(productId);
    await recomputeVendorRating(vendorId);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error in deleteReview controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
