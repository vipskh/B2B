import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerApi } from "../lib/api";
import { capitalizeText, formatDate, getOrderStatusBadge } from "../lib/utils";

const NEXT_STATUS = ["confirmed", "shipped", "delivered", "cancelled"];

function SellerOrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sellerOrders"],
    queryFn: sellerApi.getOrders,
  });

  const statusMutation = useMutation({
    mutationFn: sellerApi.updateOrderStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellerOrders"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-base-content/70 mt-1">Fulfil orders placed with your store</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">No orders yet</div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div className="font-medium">{order.shippingAddress?.fullName}</div>
                      <div className="text-xs opacity-60">{order.user?.email}</div>
                    </td>
                    <td className="text-sm">
                      {order.orderItems[0]?.name}
                      {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                    </td>
                    <td className="font-semibold">${order.totalPrice?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getOrderStatusBadge(order.status)}`}>
                        {capitalizeText(order.status)}
                      </span>
                    </td>
                    <td className="text-sm opacity-60">{formatDate(order.createdAt)}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value=""
                        onChange={(e) =>
                          e.target.value &&
                          statusMutation.mutate({ orderId: order._id, status: e.target.value })
                        }
                        disabled={
                          statusMutation.isPending ||
                          ["delivered", "cancelled"].includes(order.status)
                        }
                      >
                        <option value="">Set status…</option>
                        {NEXT_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {capitalizeText(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerOrdersPage;
