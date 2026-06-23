import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { User } from "@/types";

export const useMe = () => {
  const api = useApi();
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>("/users/me");
      return data.user;
    },
  });
};
