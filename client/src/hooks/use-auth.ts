import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useAuthStatus() {
  return useQuery({
    queryKey: [api.auth.status.path],
    queryFn: async () => {
      const res = await fetch(api.auth.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch auth status");
      return await res.json() as { isSetup: boolean; isAuthenticated: boolean; username: string | null };
    },
    staleTime: 0,
  });
}

export function useSetupPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; password: string; securityQuestion: string; securityAnswer: string }) => {
      const res = await apiRequest("POST", api.auth.setup.path, data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
      await queryClient.refetchQueries({ queryKey: [api.auth.status.path] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", api.auth.login.path, data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
      await queryClient.refetchQueries({ queryKey: [api.auth.status.path] });
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
      queryClient.setQueryData([api.auth.status.path], {
        isSetup: true,
        isAuthenticated: false,
        username: null,
      });
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] !== api.auth.status.path,
      });
    },
  });
}

export function useRecoveryQuestion() {
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", api.auth.recoveryQuestion.path, { username });
      return await res.json() as { question: string };
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { username: string; securityAnswer: string; newPassword: string }) => {
      const res = await apiRequest("POST", api.auth.resetPassword.path, data);
      return res.json();
    },
  });
}
