import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useAuthStatus() {
  return useQuery({
    queryKey: [api.auth.status.path],
    queryFn: async () => {
      const res = await fetch(api.auth.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch auth status");
      return await res.json() as { isSetup: boolean; isAuthenticated: boolean };
    },
    staleTime: 0,
  });
}

export function useSetupPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", api.auth.setup.path, { password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", api.auth.login.path, { password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.auth.logout.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
    },
  });
}
