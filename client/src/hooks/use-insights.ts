import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGenerateInsights() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.insights.generate.path, {
        method: api.insights.generate.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate insights");
      const data = await res.json();
      return api.insights.generate.responses[200].parse(data);
    },
  });
}
