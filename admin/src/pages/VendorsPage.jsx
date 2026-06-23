import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheckIcon, BanIcon, CheckCircle2Icon } from "lucide-react";
import { adminVendorApi } from "../lib/api";
import { formatDate, getVendorStatusBadge } from "../lib/utils";

function VendorsPage() {
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["adminVendors"],
    queryFn: () => adminVendorApi.getAll(),
  });

  const verifyMutation = useMutation({
    mutationFn: adminVendorApi.verify,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminVendors"] }),
  });

  const statusMutation = useMutation({
    mutationFn: adminVendorApi.setStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminVendors"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="text-base-content/70 mt-1">Approve, verify and moderate supplier companies</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">No vendors yet</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vendors.map((vendor) => {
            const vb = getVendorStatusBadge(vendor.verificationStatus);
            return (
              <div key={vendor._id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="avatar">
                      <div className="w-16 rounded-xl bg-base-200">
                        {vendor.logo ? (
                          <img src={vendor.logo} alt={vendor.companyName} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-2xl font-bold">
                            {vendor.companyName?.[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="card-title">{vendor.companyName}</h3>
                        <span className={`badge ${vb.class}`}>{vb.text}</span>
                        <span className="badge badge-outline">{vendor.status}</span>
                      </div>
                      <p className="text-sm text-base-content/70">
                        {vendor.businessType?.replace("_", " ")} ·{" "}
                        {[vendor.city, vendor.country].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-xs text-base-content/60 mt-1">
                        Owner: {vendor.owner?.name} ({vendor.owner?.email}) · Joined{" "}
                        {formatDate(vendor.createdAt)}
                      </p>
                      {vendor.badges?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {vendor.badges.map((b) => (
                            <span key={b} className="badge badge-sm badge-success gap-1">
                              <BadgeCheckIcon className="size-3" />
                              {b.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {vendor.verificationStatus !== "verified" && (
                        <button
                          className="btn btn-success btn-sm gap-2"
                          onClick={() => verifyMutation.mutate({ id: vendor._id })}
                          disabled={verifyMutation.isPending}
                        >
                          <CheckCircle2Icon className="size-4" />
                          Verify
                        </button>
                      )}
                      {vendor.status !== "suspended" ? (
                        <button
                          className="btn btn-error btn-outline btn-sm gap-2"
                          onClick={() =>
                            statusMutation.mutate({ id: vendor._id, status: "suspended" })
                          }
                          disabled={statusMutation.isPending}
                        >
                          <BanIcon className="size-4" />
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm gap-2"
                          onClick={() => statusMutation.mutate({ id: vendor._id, status: "active" })}
                          disabled={statusMutation.isPending}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
