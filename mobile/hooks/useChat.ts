import { useApi } from "@/lib/api";
import { Conversation, Message } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useConversations = () => {
  const api = useApi();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<{ conversations: Conversation[] }>("/chat/conversations");
      return data.conversations;
    },
    refetchInterval: 5000,
  });
};

export const useMessages = (conversationId?: string) => {
  const api = useApi();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get<{ messages: Message[]; myRole: "buyer" | "vendor" }>(
        `/chat/conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 4000,
  });
};

export const useStartConversation = () => {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { vendorId: string; productId?: string; text?: string }) => {
      const { data } = await api.post<Conversation>("/chat/conversations", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
};

export const useSendMessage = () => {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { data } = await api.post<Message>(`/chat/conversations/${id}/messages`, { text });
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
