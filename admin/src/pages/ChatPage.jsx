import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";
import { chatApi } from "../lib/api";

function partyName(conversation) {
  // show the *other* side of the thread
  if (conversation.myRole === "vendor") return conversation.buyer?.name || "Buyer";
  return conversation.vendor?.companyName || "Supplier";
}

function ChatPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.getConversations,
    refetchInterval: 5000,
  });

  const { data: thread } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => chatApi.getMessages(activeId),
    enabled: !!activeId,
    refetchInterval: 4000,
  });

  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const messages = thread?.messages || [];
  const myRole = thread?.myRole;

  return (
    <div className="h-[calc(100vh-9rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* conversation list */}
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          <div className="card-body p-0 overflow-y-auto">
            <h2 className="font-bold p-4 border-b border-base-200">Messages</h2>
            {conversations.length === 0 ? (
              <p className="text-center py-8 text-base-content/60">No conversations</p>
            ) : (
              conversations.map((c) => {
                const unread = c.myRole === "vendor" ? c.vendorUnread : c.buyerUnread;
                return (
                  <button
                    key={c._id}
                    onClick={() => setActiveId(c._id)}
                    className={`text-left p-4 border-b border-base-200 hover:bg-base-200 ${
                      activeId === c._id ? "bg-base-200" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{partyName(c)}</span>
                      {unread > 0 && <span className="badge badge-primary badge-sm">{unread}</span>}
                    </div>
                    <p className="text-xs opacity-60 truncate">{c.lastMessage || "—"}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* message thread */}
        <div className="card bg-base-100 shadow-xl md:col-span-2 overflow-hidden">
          <div className="card-body p-0 flex flex-col h-full">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-base-content/60">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((m) => {
                    const mine = m.senderRole === myRole;
                    return (
                      <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
                        <div className={`chat-bubble ${mine ? "chat-bubble-primary" : ""}`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center py-8 text-base-content/60">No messages yet</p>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim()) sendMutation.mutate({ id: activeId, text: text.trim() });
                  }}
                  className="p-3 border-t border-base-200 flex gap-2"
                >
                  <input
                    className="input input-bordered flex-1"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-square" disabled={sendMutation.isPending}>
                    <SendIcon className="size-5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
