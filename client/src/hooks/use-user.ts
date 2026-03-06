import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUser() {
  return useQuery({
    queryKey: [api.user.get.path],
    queryFn: async () => {
      const res = await fetch(api.user.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      return api.user.get.responses[200].parse(data);
    },
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { currencyPreference: string }) => {
      const validated = api.user.updateSettings.input.parse(data);
      const res = await fetch(api.user.updateSettings.path, {
        method: api.user.updateSettings.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.user.updateSettings.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.get.path] });
    },
  });
}
