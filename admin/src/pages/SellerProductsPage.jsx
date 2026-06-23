import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, ImageIcon, LayersIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerApi } from "../lib/api";
import { getStockStatusBadge } from "../lib/utils";

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "",
  moq: "1",
  unit: "piece",
  description: "",
};

function SellerProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [tiers, setTiers] = useState([]); // [{ minQty, price }]
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["sellerProducts"],
    queryFn: sellerApi.getProducts,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });

  const createMutation = useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: () => {
      closeModal();
      invalidate();
    },
  });
  const updateMutation = useMutation({
    mutationFn: sellerApi.updateProduct,
    onSuccess: () => {
      closeModal();
      invalidate();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: sellerApi.deleteProduct,
    onSuccess: invalidate,
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setTiers([]);
    setImages([]);
    setImagePreviews([]);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      moq: (product.moq ?? 1).toString(),
      unit: product.unit || "piece",
      description: product.description,
    });
    setTiers((product.priceTiers || []).map((t) => ({ minQty: t.minQty, price: t.price })));
    setImagePreviews(product.images);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) return alert("Maximum 3 images allowed");
    imagePreviews.forEach((url) => url.startsWith("blob:") && URL.revokeObjectURL(url));
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // ----- tier editor helpers -----
  const addTier = () => setTiers([...tiers, { minQty: "", price: "" }]);
  const updateTier = (i, field, value) =>
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct && imagePreviews.length === 0) {
      return alert("Please upload at least one image");
    }

    const cleanTiers = tiers
      .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
      .filter((t) => t.minQty >= 1 && t.price >= 0)
      .sort((a, b) => a.minQty - b.minQty);

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("description", formData.description);
    fd.append("price", formData.price);
    fd.append("stock", formData.stock);
    fd.append("category", formData.category);
    fd.append("moq", formData.moq || "1");
    fd.append("unit", formData.unit || "piece");
    fd.append("priceTiers", JSON.stringify(cleanTiers));
    if (images.length > 0) images.forEach((image) => fd.append("images", image));

    if (editingProduct) updateMutation.mutate({ id: editingProduct._id, formData: fd });
    else createMutation.mutate(fd);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-base-content/70 mt-1">Wholesale catalog with MOQ & tiered pricing</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products?.map((product) => {
          const status = getStockStatusBadge(product.stock);
          const lowestTier =
            product.priceTiers?.length > 0
              ? Math.min(...product.priceTiers.map((t) => t.price))
              : product.price;
          return (
            <div key={product._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="avatar">
                    <div className="w-20 rounded-xl">
                      <img src={product.images[0]} alt={product.name} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="card-title">{product.name}</h3>
                        <p className="text-base-content/70 text-sm">{product.category}</p>
                      </div>
                      <div className={`badge ${status.class}`}>{status.text}</div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 flex-wrap">
                      <div>
                        <p className="text-xs text-base-content/70">Price / {product.unit}</p>
                        <p className="font-bold text-lg">
                          ${lowestTier} – ${product.price}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/70">MOQ</p>
                        <p className="font-bold text-lg">
                          {product.moq} {product.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/70">Stock</p>
                        <p className="font-bold text-lg">{product.stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/70">Price breaks</p>
                        <p className="font-bold text-lg">{product.priceTiers?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="btn btn-square btn-ghost" onClick={() => handleEdit(product)}>
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="btn btn-square btn-ghost text-error"
                      onClick={() => deleteMutation.mutate(product._id)}
                    >
                      {deleteMutation.isPending ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        <Trash2Icon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD/EDIT MODAL */}
      <input type="checkbox" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-2xl">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span>Product Name</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span>Category</span></label>
                <select
                  className="select select-bordered"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                  <option value="Home">Home</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span>Base Price ($)</span></label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span>Stock</span></label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span>MOQ (min order qty)</span></label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span>Unit</span></label>
                <select
                  className="select select-bordered"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="piece">piece</option>
                  <option value="set">set</option>
                  <option value="carton">carton</option>
                  <option value="box">box</option>
                  <option value="pair">pair</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            {/* TIERED PRICING EDITOR */}
            <div className="bg-base-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold flex items-center gap-2">
                  <LayersIcon className="size-5" /> Wholesale Price Breaks
                </span>
                <button type="button" className="btn btn-xs btn-primary gap-1" onClick={addTier}>
                  <PlusIcon className="size-3" /> Add tier
                </button>
              </div>
              <p className="text-xs opacity-60 mb-3">
                Buyers pay less per unit at higher quantities. Leave empty for flat pricing.
              </p>
              {tiers.length === 0 && (
                <p className="text-sm opacity-50 text-center py-2">No price breaks yet</p>
              )}
              <div className="space-y-2">
                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm opacity-70">≥</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Min qty"
                      className="input input-bordered input-sm w-28"
                      value={tier.minQty}
                      onChange={(e) => updateTier(i, "minQty", e.target.value)}
                    />
                    <span className="text-sm opacity-70">units →  $</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      className="input input-bordered input-sm w-28"
                      value={tier.price}
                      onChange={(e) => updateTier(i, "price", e.target.value)}
                    />
                    <span className="text-sm opacity-70">/ {formData.unit}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={() => removeTier(i)}
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-control flex flex-col gap-2">
              <label className="label"><span>Description</span></label>
              <textarea
                className="textarea textarea-bordered h-24 w-full"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Product Images
                </span>
                <span className="label-text-alt text-xs opacity-60">Max 3 images</span>
              </label>
              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-base-300">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-primary w-full"
                  required={!editingProduct}
                />
                {editingProduct && (
                  <p className="text-xs text-base-content/60 mt-2 text-center">
                    Leave empty to keep current images
                  </p>
                )}
              </div>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="avatar">
                      <div className="w-20 rounded-lg">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button type="button" onClick={closeModal} className="btn" disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <span className="loading loading-spinner"></span>
                ) : editingProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SellerProductsPage;
