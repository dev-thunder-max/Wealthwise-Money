import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useBudgets() {
  return useQuery({
    queryKey: [api.budgets.list.path],
    queryFn: async () => {
      const res = await fetch(api.budgets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      const data = await res.json();
      return api.budgets.list.responses[200].parse(data);
    },
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.budgets.upsert.input>) => {
      const validated = api.budgets.upsert.input.parse(data);
      const res = await fetch(api.budgets.upsert.path, {
        method: api.budgets.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upsert budget");
      return api.budgets.upsert.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.budgets.list.path] });
    },
  });
}
