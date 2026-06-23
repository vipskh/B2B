import { useQuery } from "@tanstack/react-query";
import { meApi } from "../lib/api";
import { getDevUserId } from "../lib/devUser";

// Loads the impersonated user's identity (role + linked vendor). Only runs once
// a dev user has been chosen in the switcher.
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: meApi.get,
    enabled: !!getDevUserId(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
