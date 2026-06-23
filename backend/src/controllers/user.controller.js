import { Users, Vendors, Products } from "../db/models.js";
import { ID } from "../appwrite/client.js";

// GET /api/users/me — identity + role + linked vendor (for frontend role detection)
export async function getMe(req, res) {
  try {
    const user = { ...req.user };
    if (user.vendor) {
      const v = await Vendors.get(user.vendor);
      if (v)
        user.vendor = {
          _id: v._id,
          companyName: v.companyName,
          slug: v.slug,
          status: v.status,
          verificationStatus: v.verificationStatus,
          logo: v.logo,
        };
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getMe controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addAddress(req, res) {
  try {
    const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } =
      req.body;
    if (!fullName || !streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    const addresses = req.user.addresses || [];
    if (isDefault) addresses.forEach((a) => (a.isDefault = false));
    addresses.push({
      _id: ID.unique(),
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: isDefault || false,
    });

    const user = await Users.update(req.user._id, { addresses });
    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in addAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  res.status(200).json({ addresses: req.user.addresses || [] });
}

export async function updateAddress(req, res) {
  try {
    const { addressId } = req.params;
    const body = req.body;
    const addresses = req.user.addresses || [];
    const addr = addresses.find((a) => a._id === addressId);
    if (!addr) return res.status(404).json({ error: "Address not found" });

    if (body.isDefault) addresses.forEach((a) => (a.isDefault = false));
    Object.assign(addr, {
      label: body.label ?? addr.label,
      fullName: body.fullName ?? addr.fullName,
      streetAddress: body.streetAddress ?? addr.streetAddress,
      city: body.city ?? addr.city,
      state: body.state ?? addr.state,
      zipCode: body.zipCode ?? addr.zipCode,
      phoneNumber: body.phoneNumber ?? addr.phoneNumber,
      isDefault: body.isDefault !== undefined ? body.isDefault : addr.isDefault,
    });

    const user = await Users.update(req.user._id, { addresses });
    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in updateAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const addresses = (req.user.addresses || []).filter((a) => a._id !== addressId);
    const user = await Users.update(req.user._id, { addresses });
    res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in deleteAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const wishlist = req.user.wishlist || [];
    if (wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }
    wishlist.push(productId);
    const user = await Users.update(req.user._id, { wishlist });
    res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in addToWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const wishlist = (req.user.wishlist || []).filter((id) => id !== productId);
    const user = await Users.update(req.user._id, { wishlist });
    res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in removeFromWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    const ids = req.user.wishlist || [];
    const products = (await Promise.all(ids.map((id) => Products.get(id)))).filter(Boolean);
    res.status(200).json({ wishlist: products });
  } catch (error) {
    console.error("Error in getWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
