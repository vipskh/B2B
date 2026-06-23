import { useQuery } from "@tanstack/react-query";
import { DollarSignIcon, PackageIcon, ShoppingBagIcon, StarIcon } from "lucide-react";
import { sellerApi } from "../lib/api";
import { capitalizeText, formatDate, getOrderStatusBadge } from "../lib/utils";
import { getVendorStatusBadge } from "../lib/utils";

function SellerDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sellerStats"],
    queryFn: sellerApi.getStats,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["sellerOrders"],
    queryFn: sellerApi.getOrders,
  });

  const recentOrders = orders.slice(0, 5);
  const vb = getVendorStatusBadge(stats?.verificationStatus);

  const cards = [
    {
      name: "Revenue",
      value: isLoading ? "..." : `$${stats?.totalRevenue?.toFixed(2) || 0}`,
      icon: <DollarSignIcon className="size-8" />,
    },
    {
      name: "Orders",
      value: isLoading ? "..." : stats?.totalOrders || 0,
      icon: <ShoppingBagIcon className="size-8" />,
    },
    {
      name: "Products",
      value: isLoading ? "..." : stats?.totalProducts || 0,
      icon: <PackageIcon className="size-8" />,
    },
    {
      name: "Rating",
      value: isLoading ? "..." : (stats?.rating?.average?.toFixed(1) || "0.0"),
      icon: <StarIcon className="size-8" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        {!isLoading && <span className={`badge ${vb.class}`}>{vb.text}</span>}
        {!isLoading && stats?.status === "pending" && (
          <span className="badge badge-warning">Awaiting approval</span>
        )}
      </div>

      <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
        {cards.map((stat) => (
          <div key={stat.name} className="stat">
            <div className="stat-figure text-primary">{stat.icon}</div>
            <div className="stat-title">{stat.name}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                      <td>{order.shippingAddress?.fullName}</td>
                      <td className="font-semibold">${order.totalPrice?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getOrderStatusBadge(order.status)}`}>
                          {capitalizeText(order.status)}
                        </span>
                      </td>
                      <td className="text-sm opacity-60">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerDashboardPage;
