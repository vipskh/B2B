import { useApi } from "@/lib/api";
import { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";

export interface ProductsParams {
  search?: string;
  category?: string;
  vendor?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

const useProducts = (params: ProductsParams = {}) => {
  const api = useApi();

  // drop empty values so the query key is stable and the API gets clean params
  const clean: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) clean[k] = v;
  });

  return useQuery({
    queryKey: ["products", clean],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>("/products", { params: clean });
      return data.products;
    },
  });
};

export default useProducts;
