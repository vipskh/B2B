import { Carts, Products } from "../db/models.js";
import { Query, ID } from "../appwrite/client.js";
import { withVendor } from "../lib/populate.js";

async function getOrCreateCart(user) {
  let cart = await Carts.findOne([Query.equal("user", user._id)]);
  if (!cart) cart = await Carts.create({ user: user._id, clerkId: user.clerkId || "", items: [] });
  return cart;
}

// available stock for a product or a specific SKU variant
function stockOf(product, variantId) {
  if (!variantId) return product.stock ?? 0;
  const v = (product.variants || []).find((x) => x.id === variantId);
  return v ? v.stock ?? 0 : 0;
}

// fetch each item's product (with vendor) so the frontend can group by supplier
async function populateCart(cart) {
  const populated = [];
  for (const it of cart.items || []) {
    const p = await Products.get(it.product);
    if (p) populated.push({ _id: it._id, quantity: it.quantity, variant: it.variant || null, product: p });
  }
  const withV = await withVendor(
    populated.map((i) => i.product),
    { select: ["companyName", "slug", "verificationStatus"] }
  );
  populated.forEach((i, idx) => (i.product = withV[idx]));
  return { ...cart, items: populated };
}

export async function getCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.user);
    res.status(200).json({ cart: await populateCart(cart) });
  } catch (error) {
    console.error("Error in getCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToCart(req, res) {
  try {
    const { productId, quantity = 1, variant = null } = req.body;
    const product = await Products.get(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const vId = variant?.id || null;
    if (stockOf(product, vId) < quantity) return res.status(400).json({ error: "Insufficient stock" });

    const cart = await getOrCreateCart(req.user);
    const items = cart.items || [];
    // same line = same product AND same variant
    const existing = items.find((i) => i.product === productId && (i.variant?.id || null) === vId);
    if (existing) {
      const next = existing.quantity + 1;
      if (stockOf(product, vId) < next) return res.status(400).json({ error: "Insufficient stock" });
      existing.quantity = next;
    } else {
      items.push({ _id: ID.unique(), product: productId, quantity, variant });
    }

    const saved = await Carts.update(cart._id, { items });
    res.status(200).json({ message: "Item added to cart", cart: await populateCart(saved) });
  } catch (error) {
    console.error("Error in addToCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// :id here is the CART ITEM id (a product can appear as several variant lines)
export async function updateCartItem(req, res) {
  try {
    const itemId = req.params.id;
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ error: "Quantity must be at least 1" });

    const cart = await getOrCreateCart(req.user);
    const items = cart.items || [];
    const item = items.find((i) => i._id === itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    const product = await Products.get(item.product);
    if (product && stockOf(product, item.variant?.id) < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    item.quantity = quantity;

    const saved = await Carts.update(cart._id, { items });
    res.status(200).json({ message: "Cart updated successfully", cart: await populateCart(saved) });
  } catch (error) {
    console.error("Error in updateCartItem controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromCart(req, res) {
  try {
    const itemId = req.params.id;
    const cart = await getOrCreateCart(req.user);
    const items = (cart.items || []).filter((i) => i._id !== itemId);
    const saved = await Carts.update(cart._id, { items });
    res.status(200).json({ message: "Item removed from cart", cart: await populateCart(saved) });
  } catch (error) {
    console.error("Error in removeFromCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function clearCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.user);
    const saved = await Carts.update(cart._id, { items: [] });
    res.status(200).json({ message: "Cart cleared", cart: await populateCart(saved) });
  } catch (error) {
    console.error("Error in clearCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
