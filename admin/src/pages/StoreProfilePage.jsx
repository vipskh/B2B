import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SaveIcon } from "lucide-react";
import { vendorApi } from "../lib/api";
import { getVendorStatusBadge } from "../lib/utils";

function StoreProfilePage() {
  const queryClient = useQueryClient();
  const { data: vendor, isLoading } = useQuery({
    queryKey: ["myVendor"],
    queryFn: vendorApi.getMine,
  });

  const [form, setForm] = useState({});

  useEffect(() => {
    if (vendor) {
      setForm({
        companyName: vendor.companyName || "",
        description: vendor.description || "",
        businessType: vendor.businessType || "other",
        country: vendor.country || "",
        province: vendor.province || "",
        city: vendor.city || "",
        yearEstablished: vendor.yearEstablished || "",
        contactPhone: vendor.contactPhone || "",
        logo: vendor.logo || "",
        banner: vendor.banner || "",
      });
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: vendorApi.updateMine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myVendor"] }),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const vb = getVendorStatusBadge(vendor?.verificationStatus);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Store Profile</h1>
        <span className={`badge ${vb.class}`}>{vb.text}</span>
        <span className="badge badge-outline">{vendor?.status}</span>
      </div>

      {vendor?.verificationStatus !== "verified" && (
        <div className="alert alert-info">
          <span>
            Your company is not verified yet. Complete your profile — a platform admin will review
            and grant supplier badges.
          </span>
        </div>
      )}

      {vendor?.badges?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {vendor.badges.map((b) => (
            <span key={b} className="badge badge-success">
              {b.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate({
            ...form,
            yearEstablished: form.yearEstablished ? Number(form.yearEstablished) : undefined,
          });
        }}
        className="card bg-base-100 shadow-xl"
      >
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label"><span>Company Name</span></label>
            <input className="input input-bordered" value={form.companyName} onChange={set("companyName")} required />
          </div>

          <div className="form-control">
            <label className="label"><span>Description</span></label>
            <textarea
              className="textarea textarea-bordered h-24"
              value={form.description}
              onChange={set("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="form-control">
              <label className="label"><span>Year Established</span></label>
              <input type="number" className="input input-bordered" value={form.yearEstablished} onChange={set("yearEstablished")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label"><span>Country</span></label>
              <input className="input input-bordered" value={form.country} onChange={set("country")} />
            </div>
            <div className="form-control">
              <label className="label"><span>Province</span></label>
              <input className="input input-bordered" value={form.province} onChange={set("province")} />
            </div>
            <div className="form-control">
              <label className="label"><span>City</span></label>
              <input className="input input-bordered" value={form.city} onChange={set("city")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span>Contact Phone</span></label>
              <input className="input input-bordered" value={form.contactPhone} onChange={set("contactPhone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span>Logo URL</span></label>
              <input className="input input-bordered" value={form.logo} onChange={set("logo")} placeholder="https://…" />
            </div>
            <div className="form-control">
              <label className="label"><span>Banner URL</span></label>
              <input className="input input-bordered" value={form.banner} onChange={set("banner")} placeholder="https://…" />
            </div>
          </div>

          <div className="card-actions justify-end">
            <button type="submit" className="btn btn-primary gap-2" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  <SaveIcon className="size-4" /> Save Changes
                </>
              )}
            </button>
          </div>
          {updateMutation.isSuccess && (
            <p className="text-success text-sm text-right">Profile saved ✓</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default StoreProfilePage;
