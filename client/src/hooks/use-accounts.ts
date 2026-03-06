import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useAccounts() {
  return useQuery({
    queryKey: [api.accounts.list.path],
    queryFn: async () => {
      const res = await fetch(api.accounts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      return api.accounts.list.responses[200].parse(data);
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.accounts.create.input>) => {
      const validated = api.accounts.create.input.parse(data);
      const res = await fetch(api.accounts.create.path, {
        method: api.accounts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create account");
      return api.accounts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.accounts.delete.path, { id });
      const res = await fetch(url, {
        method: api.accounts.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete account");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
    },
  });
}
