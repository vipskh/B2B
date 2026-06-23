import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StoreIcon, RefreshCwIcon } from "lucide-react";
import { vendorApi } from "../lib/api";
import { useMe } from "../hooks/useMe";
import { clearDevUserId } from "../lib/devUser";

// Shown when the impersonated user has no admin/seller role — lets them open a
// store (become a vendor). On success the app re-routes into the Seller Center.
function ApplyVendorPage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [form, setForm] = useState({
    companyName: "",
    businessType: "manufacturer",
    country: "",
    city: "",
    description: "",
    contactPhone: "",
  });

  const applyMutation = useMutation({
    mutationFn: vendorApi.apply,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      window.location.reload();
    },
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const switchUser = () => {
    clearDevUserId();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                <StoreIcon className="size-6 text-primary-content" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Become a Seller</h1>
                <p className="text-sm opacity-60">Open your store on the marketplace</p>
              </div>
            </div>
            <button className="btn btn-sm btn-ghost gap-1" onClick={switchUser}>
              <RefreshCwIcon className="size-4" />
              Switch
            </button>
          </div>

          <p className="text-sm opacity-70 mt-2">
            Acting as {me?.email}. Register your company to list wholesale products, receive orders
            and answer RFQs.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyMutation.mutate(form);
            }}
            className="space-y-3 mt-2"
          >
            <div className="form-control">
              <label className="label"><span>Company Name</span></label>
              <input className="input input-bordered" value={form.companyName} onChange={set("companyName")} required />
            </div>
            <div className="form-control">
              <label className="label"><span>Business Type</span></label>
              <select className="select select-bordered" value={form.businessType} onChange={set("businessType")}>
                <option value="manufacturer">Manufacturer</option>
                <option value="trading_company">Trading Company</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span>Country</span></label>
                <input className="input input-bordered" value={form.country} onChange={set("country")} />
              </div>
              <div className="form-control">
                <label className="label"><span>City</span></label>
                <input className="input input-bordered" value={form.city} onChange={set("city")} />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span>Contact Phone</span></label>
              <input className="input input-bordered" value={form.contactPhone} onChange={set("contactPhone")} />
            </div>
            <div className="form-control">
              <label className="label"><span>About your company</span></label>
              <textarea className="textarea textarea-bordered h-20" value={form.description} onChange={set("description")} />
            </div>

            {applyMutation.isError && (
              <p className="text-error text-sm">
                {applyMutation.error?.response?.data?.message || "Something went wrong"}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={applyMutation.isPending}>
              {applyMutation.isPending ? <span className="loading loading-spinner" /> : "Create Store"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApplyVendorPage;
