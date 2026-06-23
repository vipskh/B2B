import { useApi } from "@/lib/api";
import { Vendor, Product } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const useVendors = (search?: string) => {
  const api = useApi();
  return useQuery({
    queryKey: ["vendors", search],
    queryFn: async () => {
      const { data } = await api.get<{ vendors: Vendor[] }>("/vendors", { params: { search } });
      return data.vendors;
    },
  });
};

export const useVendor = (slug: string) => {
  const api = useApi();
  return useQuery<Vendor>({
    queryKey: ["vendor", slug],
    queryFn: async () => {
      const { data } = await api.get<Vendor>(`/vendors/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
};

export const useVendorProducts = (vendorId?: string) => {
  const api = useApi();
  return useQuery({
    queryKey: ["vendorProducts", vendorId],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(`/vendors/${vendorId}/products`);
      return data;
    },
    enabled: !!vendorId,
  });
};
