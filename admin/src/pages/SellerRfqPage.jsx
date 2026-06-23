import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SendIcon, XIcon } from "lucide-react";
import { rfqApi } from "../lib/api";
import { capitalizeText, formatDate } from "../lib/utils";

function SellerRfqPage() {
  const queryClient = useQueryClient();
  const [quoting, setQuoting] = useState(null); // the RFQ being quoted
  const [quote, setQuote] = useState({ price: "", moq: "1", leadTimeDays: "", message: "" });

  const { data: openRfqs = [], isLoading } = useQuery({
    queryKey: ["openRfqs"],
    queryFn: rfqApi.listOpen,
  });
  const { data: myQuotes = [] } = useQuery({
    queryKey: ["myQuotes"],
    queryFn: rfqApi.myQuotes,
  });

  const quoteMutation = useMutation({
    mutationFn: rfqApi.submitQuote,
    onSuccess: () => {
      setQuoting(null);
      setQuote({ price: "", moq: "1", leadTimeDays: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["openRfqs"] });
      queryClient.invalidateQueries({ queryKey: ["myQuotes"] });
    },
  });

  const quotedRfqIds = new Set(myQuotes.map((q) => q.rfq?._id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">RFQ Inbox</h1>
        <p className="text-base-content/70 mt-1">Sourcing requests from buyers — send your quote</p>
      </div>

      {/* OPEN RFQs */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Open Requests</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : openRfqs.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">No open requests right now</div>
        ) : (
          openRfqs.map((rfq) => (
            <div key={rfq._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <h3 className="card-title">{rfq.title}</h3>
                    <p className="text-sm text-base-content/70 mt-1">{rfq.description}</p>
                    <div className="flex gap-4 mt-3 text-sm flex-wrap">
                      <span>
                        <span className="opacity-60">Qty:</span> {rfq.quantity} {rfq.unit}
                      </span>
                      {rfq.targetPrice != null && (
                        <span>
                          <span className="opacity-60">Target:</span> ${rfq.targetPrice}/{rfq.unit}
                        </span>
                      )}
                      {rfq.category && <span className="badge badge-ghost">{rfq.category}</span>}
                      <span className="opacity-60">{formatDate(rfq.createdAt)}</span>
                    </div>
                  </div>
                  <div>
                    {quotedRfqIds.has(rfq._id) ? (
                      <span className="badge badge-success">Quoted</span>
                    ) : (
                      <button className="btn btn-primary btn-sm gap-2" onClick={() => setQuoting(rfq)}>
                        <SendIcon className="size-4" /> Submit Quote
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MY QUOTES */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">My Quotes</h2>
        {myQuotes.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">You haven't quoted yet</div>
        ) : (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>My Price</th>
                    <th>MOQ</th>
                    <th>Lead time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myQuotes.map((q) => (
                    <tr key={q._id}>
                      <td>{q.rfq?.title || "—"}</td>
                      <td className="font-semibold">${q.price}</td>
                      <td>{q.moq}</td>
                      <td>{q.leadTimeDays != null ? `${q.leadTimeDays}d` : "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            q.status === "accepted"
                              ? "badge-success"
                              : q.status === "rejected"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {capitalizeText(q.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QUOTE MODAL */}
      {quoting && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Quote: {quoting.title}</h3>
              <button onClick={() => setQuoting(null)} className="btn btn-sm btn-circle btn-ghost">
                <XIcon className="size-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                quoteMutation.mutate({
                  id: quoting._id,
                  price: Number(quote.price),
                  moq: Number(quote.moq),
                  leadTimeDays: quote.leadTimeDays ? Number(quote.leadTimeDays) : undefined,
                  message: quote.message,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span>Unit Price ($)</span></label>
                  <input type="number" step="0.01" className="input input-bordered" required
                    value={quote.price} onChange={(e) => setQuote({ ...quote, price: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span>MOQ</span></label>
                  <input type="number" min="1" className="input input-bordered"
                    value={quote.moq} onChange={(e) => setQuote({ ...quote, moq: e.target.value })} />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span>Lead time (days)</span></label>
                <input type="number" className="input input-bordered"
                  value={quote.leadTimeDays} onChange={(e) => setQuote({ ...quote, leadTimeDays: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span>Message</span></label>
                <textarea className="textarea textarea-bordered"
                  value={quote.message} onChange={(e) => setQuote({ ...quote, message: e.target.value })} />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setQuoting(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={quoteMutation.isPending}>
                  {quoteMutation.isPending ? <span className="loading loading-spinner" /> : "Send Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerRfqPage;
