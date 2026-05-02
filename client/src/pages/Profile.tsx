import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useAuthStatus } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { User, KeyRound, ShieldQuestion, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite color?",
  "What was the name of your elementary school?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
];

function PasswordInput({ id, value, onChange, placeholder, "data-testid": testId }: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string; "data-testid"?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        data-testid={testId}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Profile() {
  const { data: user } = useUser();
  const { data: authStatus } = useAuthStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [usernameForm, setUsernameForm] = useState({ newUsername: "", currentPassword: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [secQForm, setSecQForm] = useState({ currentPassword: "", securityQuestion: "", securityAnswer: "" });

  const changeUsernameMut = useMutation({
    mutationFn: (data: typeof usernameForm) =>
      apiRequest(api.user.changeUsername.method, api.user.changeUsername.path, data),
    onSuccess: () => {
      toast({ title: "Username updated successfully" });
      queryClient.invalidateQueries({ queryKey: [api.user.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.status.path] });
      setUsernameForm({ newUsername: "", currentPassword: "" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update username", description: err.message, variant: "destructive" });
    },
  });

  const changePasswordMut = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest(api.user.changePassword.method, api.user.changePassword.path, data),
    onSuccess: () => {
      toast({ title: "Password updated successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
    },
  });

  const changeSecQMut = useMutation({
    mutationFn: (data: { currentPassword: string; securityQuestion: string; securityAnswer: string }) =>
      apiRequest(api.user.changeSecurityQuestion.method, api.user.changeSecurityQuestion.path, data),
    onSuccess: () => {
      toast({ title: "Security question updated successfully" });
      queryClient.invalidateQueries({ queryKey: [api.user.get.path] });
      setSecQForm({ currentPassword: "", securityQuestion: "", securityAnswer: "" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update security question", description: err.message, variant: "destructive" });
    },
  });

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameForm.newUsername.trim()) return toast({ title: "Please enter a new username", variant: "destructive" });
    if (!usernameForm.currentPassword) return toast({ title: "Please enter your current password", variant: "destructive" });
    changeUsernameMut.mutate(usernameForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) return toast({ title: "Please enter your current password", variant: "destructive" });
    if (passwordForm.newPassword.length < 4) return toast({ title: "New password must be at least 4 characters", variant: "destructive" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast({ title: "New passwords don't match", variant: "destructive" });
    changePasswordMut.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  const handleSecQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secQForm.currentPassword) return toast({ title: "Please enter your current password", variant: "destructive" });
    if (!secQForm.securityQuestion) return toast({ title: "Please select a security question", variant: "destructive" });
    if (!secQForm.securityAnswer.trim()) return toast({ title: "Please enter a security answer", variant: "destructive" });
    changeSecQMut.mutate(secQForm);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground">Profile</h1>

      {/* Account Overview */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Username</span>
            <span className="font-medium" data-testid="text-username">{user?.username ?? authStatus?.username ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Security Question</span>
            <span className="font-medium text-right max-w-xs text-sm" data-testid="text-security-question">{user?.securityQuestion ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Currency</span>
            <span className="font-medium" data-testid="text-currency">{user?.currencyPreference ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change Username */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Change Username
          </CardTitle>
          <CardDescription>Update the username you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                placeholder="Enter new username"
                value={usernameForm.newUsername}
                onChange={e => setUsernameForm(f => ({ ...f, newUsername: e.target.value }))}
                data-testid="input-new-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username-current-password">Current Password</Label>
              <PasswordInput
                id="username-current-password"
                value={usernameForm.currentPassword}
                onChange={v => setUsernameForm(f => ({ ...f, currentPassword: v }))}
                placeholder="Enter current password to confirm"
                data-testid="input-username-current-password"
              />
            </div>
            <Button type="submit" disabled={changeUsernameMut.isPending} data-testid="button-change-username">
              {changeUsernameMut.isPending ? "Saving..." : "Update Username"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Keep your account secure with a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <PasswordInput
                id="current-password"
                value={passwordForm.currentPassword}
                onChange={v => setPasswordForm(f => ({ ...f, currentPassword: v }))}
                placeholder="Enter current password"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                value={passwordForm.newPassword}
                onChange={v => setPasswordForm(f => ({ ...f, newPassword: v }))}
                placeholder="At least 4 characters"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <PasswordInput
                id="confirm-password"
                value={passwordForm.confirmPassword}
                onChange={v => setPasswordForm(f => ({ ...f, confirmPassword: v }))}
                placeholder="Repeat new password"
                data-testid="input-confirm-password"
              />
            </div>
            <Button type="submit" disabled={changePasswordMut.isPending} data-testid="button-change-password">
              {changePasswordMut.isPending ? "Saving..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Security Question */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5 text-primary" />
            Change Security Question
          </CardTitle>
          <CardDescription>Used to recover your account if you forget your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSecQSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sec-question">Security Question</Label>
              <select
                id="sec-question"
                value={secQForm.securityQuestion}
                onChange={e => setSecQForm(f => ({ ...f, securityQuestion: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="select-security-question"
              >
                <option value="">Select a question...</option>
                {SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sec-answer">Security Answer</Label>
              <Input
                id="sec-answer"
                placeholder="Your answer (not case-sensitive)"
                value={secQForm.securityAnswer}
                onChange={e => setSecQForm(f => ({ ...f, securityAnswer: e.target.value }))}
                data-testid="input-security-answer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secq-current-password">Current Password</Label>
              <PasswordInput
                id="secq-current-password"
                value={secQForm.currentPassword}
                onChange={v => setSecQForm(f => ({ ...f, currentPassword: v }))}
                placeholder="Enter current password to confirm"
                data-testid="input-secq-current-password"
              />
            </div>
            <Button type="submit" disabled={changeSecQMut.isPending} data-testid="button-change-security-question">
              {changeSecQMut.isPending ? "Saving..." : "Update Security Question"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
