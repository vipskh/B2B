export interface PriceTier {
  minQty: number;
  price: number;
}

export interface ProductVariantOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
}

// what we store on a cart line / order item when a variant is chosen
export interface SelectedVariant {
  id: string;
  options: Record<string, string>;
  price: number;
  image?: string;
}

export interface Vendor {
  _id: string;
  companyName: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  businessType?: string;
  country?: string;
  province?: string;
  city?: string;
  yearEstablished?: number;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  badges?: string[];
  rating?: { average: number; count: number };
  responseRate?: number;
  responseTimeHours?: number;
  totalProducts?: number;
  totalOrders?: number;
  status?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceTiers: PriceTier[];
  variantOptions?: ProductVariantOption[];
  variants?: ProductVariant[];
  moq: number;
  unit: string;
  stock: number;
  category: string;
  images: string[];
  status?: string;
  vendor?: Vendor | string;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  imageUrl: string;
  role?: "buyer" | "vendor" | "admin";
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

export interface Order {
  _id: string;
  orderGroup?: string;
  vendor?: Vendor | string;
  user: string;
  clerkId: string;
  orderItems: OrderItem[];
  shippingAddress: {
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
  };
  paymentResult: {
    id: string;
    status: string;
  };
  subtotal?: number;
  shippingPrice?: number;
  taxPrice?: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  hasReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string | User;
  orderId: string;
  vendorId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  variant?: SelectedVariant | null;
}

export interface Cart {
  _id: string;
  user: string;
  clerkId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ---- B2B sourcing (RFQ) ----
export interface RFQ {
  _id: string;
  buyer: string | User;
  title: string;
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  images?: string[];
  status: "open" | "closed" | "awarded";
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  _id: string;
  rfq: string | RFQ;
  vendor: Vendor | string;
  price: number;
  moq: number;
  leadTimeDays?: number;
  message?: string;
  status: "submitted" | "accepted" | "rejected";
  createdAt: string;
}

// ---- chat ----
export interface Conversation {
  _id: string;
  buyer: User | string;
  vendor: Vendor | string;
  product?: Product | string;
  lastMessage: string;
  lastMessageAt: string;
  buyerUnread: number;
  vendorUnread: number;
  myRole?: "buyer" | "vendor";
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  senderRole: "buyer" | "vendor";
  text: string;
  images?: string[];
  readAt?: string;
  createdAt: string;
}
