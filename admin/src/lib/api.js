import axiosInstance from "./axios";

export const productApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/products");
    return data;
  },

  create: async (formData) => {
    const { data } = await axiosInstance.post("/admin/products", formData);
    return data;
  },

  update: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/admin/products/${id}`, formData);
    return data;
  },

  delete: async (productId) => {
    const { data } = await axiosInstance.delete(`/admin/products/${productId}`);
    return data;
  },
};

export const orderApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/orders");
    return data;
  },

  updateStatus: async ({ orderId, status }) => {
    const { data } = await axiosInstance.patch(`/admin/orders/${orderId}/status`, { status });
    return data;
  },
};

export const statsApi = {
  getDashboard: async () => {
    const { data } = await axiosInstance.get("/admin/stats");
    return data;
  },
};

export const customerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/customers");
    return data;
  },
};

// ---- current user / role ----
export const meApi = {
  get: async () => {
    const { data } = await axiosInstance.get("/users/me");
    return data.user;
  },
};

// ---- DEV: list seeded users for the impersonation switcher (auth off) ----
export const devApi = {
  listUsers: async () => {
    const { data } = await axiosInstance.get("/dev/users");
    return data.users;
  },
};

// ---- platform admin: vendor moderation ----
export const adminVendorApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get("/admin/vendors", { params });
    return data.vendors;
  },
  verify: async ({ id, badges }) => {
    const { data } = await axiosInstance.patch(`/admin/vendors/${id}/verify`, { badges });
    return data;
  },
  setStatus: async ({ id, status, verificationStatus }) => {
    const { data } = await axiosInstance.patch(`/admin/vendors/${id}/status`, {
      status,
      verificationStatus,
    });
    return data;
  },
};

// ---- seller center (vendor-scoped) ----
export const sellerApi = {
  getStats: async () => {
    const { data } = await axiosInstance.get("/seller/stats");
    return data;
  },
  getProducts: async () => {
    const { data } = await axiosInstance.get("/seller/products");
    return data;
  },
  createProduct: async (formData) => {
    const { data } = await axiosInstance.post("/seller/products", formData);
    return data;
  },
  updateProduct: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/seller/products/${id}`, formData);
    return data;
  },
  deleteProduct: async (id) => {
    const { data } = await axiosInstance.delete(`/seller/products/${id}`);
    return data;
  },
  getOrders: async () => {
    const { data } = await axiosInstance.get("/seller/orders");
    return data.orders;
  },
  updateOrderStatus: async ({ orderId, status }) => {
    const { data } = await axiosInstance.patch(`/seller/orders/${orderId}/status`, { status });
    return data;
  },
};

// ---- vendor self-service profile + onboarding ----
export const vendorApi = {
  getMine: async () => {
    const { data } = await axiosInstance.get("/vendors/me");
    return data;
  },
  apply: async (payload) => {
    const { data } = await axiosInstance.post("/vendors/apply", payload);
    return data;
  },
  updateMine: async (payload) => {
    const { data } = await axiosInstance.patch("/vendors/me", payload);
    return data;
  },
};

// ---- RFQ + quotes ----
export const rfqApi = {
  listOpen: async () => {
    const { data } = await axiosInstance.get("/rfqs/open");
    return data.rfqs;
  },
  submitQuote: async ({ id, ...payload }) => {
    const { data } = await axiosInstance.post(`/rfqs/${id}/quotes`, payload);
    return data;
  },
  myQuotes: async () => {
    const { data } = await axiosInstance.get("/rfqs/quotes/mine");
    return data.quotes;
  },
};

// ---- chat (polling) ----
export const chatApi = {
  getConversations: async () => {
    const { data } = await axiosInstance.get("/chat/conversations");
    return data.conversations;
  },
  getMessages: async (id) => {
    const { data } = await axiosInstance.get(`/chat/conversations/${id}/messages`);
    return data;
  },
  sendMessage: async ({ id, text }) => {
    const { data } = await axiosInstance.post(`/chat/conversations/${id}/messages`, { text });
    return data;
  },
};
