import { Conversations, Messages, Vendors, Users, Products } from "../db/models.js";
import { Query } from "../appwrite/client.js";

function participantRole(conversation, user) {
  if (conversation.buyer === user._id) return "buyer";
  if (user.vendor && conversation.vendor === user.vendor) return "vendor";
  return null;
}

export async function startConversation(req, res) {
  try {
    const { vendorId, productId, text } = req.body;
    if (!vendorId) return res.status(400).json({ message: "vendorId is required" });
    const vendor = await Vendors.get(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    let conversation = await Conversations.findOne([
      Query.equal("buyer", req.user._id),
      Query.equal("vendor", vendorId),
    ]);
    if (!conversation) {
      conversation = await Conversations.create({
        buyer: req.user._id,
        vendor: vendorId,
        ...(productId ? { product: productId } : {}),
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
        buyerUnread: 0,
        vendorUnread: 0,
      });
    }

    if (text) {
      await Messages.create({
        conversation: conversation._id,
        sender: req.user._id,
        senderRole: "buyer",
        text,
        images: [],
      });
      conversation = await Conversations.update(conversation._id, {
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
        vendorUnread: (conversation.vendorUnread || 0) + 1,
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error in startConversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyConversations(req, res) {
  try {
    const filter = req.user.vendor
      ? [Query.or([Query.equal("buyer", req.user._id), Query.equal("vendor", req.user.vendor)])]
      : [Query.equal("buyer", req.user._id)];
    const conversations = await Conversations.list([
      ...filter,
      Query.orderDesc("lastMessageAt"),
      Query.limit(100),
    ]);

    const withInfo = await Promise.all(
      conversations.map(async (c) => {
        const [buyer, vendor, product] = await Promise.all([
          Users.get(c.buyer),
          Vendors.get(c.vendor),
          c.product ? Products.get(c.product) : null,
        ]);
        return {
          ...c,
          myRole: participantRole(c, req.user),
          buyer: buyer ? { _id: buyer._id, name: buyer.name, imageUrl: buyer.imageUrl } : c.buyer,
          vendor: vendor
            ? { _id: vendor._id, companyName: vendor.companyName, slug: vendor.slug, logo: vendor.logo }
            : c.vendor,
          product: product ? { _id: product._id, name: product.name, images: product.images } : c.product,
        };
      })
    );

    res.status(200).json({ conversations: withInfo });
  } catch (error) {
    console.error("Error in getMyConversations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const conversation = await Conversations.get(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const role = participantRole(conversation, req.user);
    if (!role) return res.status(403).json({ message: "Not a participant" });

    const messages = await Messages.list([
      Query.equal("conversation", conversation._id),
      Query.orderAsc("$createdAt"),
      Query.limit(500),
    ]);

    // mark the other side's messages as read + reset my unread counter
    const otherRole = role === "buyer" ? "vendor" : "buyer";
    const unread = await Messages.list([
      Query.equal("conversation", conversation._id),
      Query.equal("senderRole", otherRole),
      Query.isNull("readAt"),
      Query.limit(100),
    ]);
    await Promise.all(unread.map((m) => Messages.update(m._id, { readAt: new Date().toISOString() })));
    await Conversations.update(conversation._id, {
      [role === "buyer" ? "buyerUnread" : "vendorUnread"]: 0,
    });

    res.status(200).json({ messages, myRole: role });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text, images } = req.body;
    if (!text && !(Array.isArray(images) && images.length)) {
      return res.status(400).json({ message: "Message text or images required" });
    }
    const conversation = await Conversations.get(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const role = participantRole(conversation, req.user);
    if (!role) return res.status(403).json({ message: "Not a participant" });

    const message = await Messages.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderRole: role,
      text: text || "",
      images: Array.isArray(images) ? images : [],
    });

    const unreadField = role === "buyer" ? "vendorUnread" : "buyerUnread";
    await Conversations.update(conversation._id, {
      lastMessage: text || "[image]",
      lastMessageAt: new Date().toISOString(),
      [unreadField]: (conversation[unreadField] || 0) + 1,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
