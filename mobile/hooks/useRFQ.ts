import { useApi } from "@/lib/api";
import { RFQ, Quote } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMyRFQs = () => {
  const api = useApi();
  return useQuery({
    queryKey: ["myRfqs"],
    queryFn: async () => {
      const { data } = await api.get<{ rfqs: RFQ[] }>("/rfqs/me");
      return data.rfqs;
    },
  });
};

export const useRFQQuotes = (rfqId?: string) => {
  const api = useApi();
  return useQuery({
    queryKey: ["rfqQuotes", rfqId],
    queryFn: async () => {
      const { data } = await api.get<{ quotes: Quote[] }>(`/rfqs/${rfqId}/quotes`);
      return data.quotes;
    },
    enabled: !!rfqId,
  });
};

export interface CreateRFQInput {
  title: string;
  description: string;
  category?: string;
  quantity: number;
  unit?: string;
  targetPrice?: number;
}

export const useCreateRFQ = () => {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRFQInput) => {
      const { data } = await api.post<RFQ>("/rfqs", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myRfqs"] }),
  });
};

export const useAcceptQuote = () => {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rfqId, quoteId }: { rfqId: string; quoteId: string }) => {
      const { data } = await api.patch(`/rfqs/${rfqId}/quotes/${quoteId}/accept`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rfqQuotes", vars.rfqId] });
      qc.invalidateQueries({ queryKey: ["myRfqs"] });
    },
  });
};
