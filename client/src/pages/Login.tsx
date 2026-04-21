import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStatus, useLogin, useSetupPassword, useRecoveryQuestion, useResetPassword } from "@/hooks/use-auth";
import { Lock, ShieldCheck, PiggyBank, KeyRound, ArrowLeft } from "lucide-react";

type Mode = "auth" | "forgot-username" | "forgot-answer";

export default function Login() {
  const { data: status } = useAuthStatus();
  const isSetup = status?.isSetup ?? false;

  const [mode, setMode] = useState<Mode>("auth");

  // Auth state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("What is your favorite color?");
  const [securityAnswer, setSecurityAnswer] = useState("");

  // Recovery state
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState("");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { toast } = useToast();
  const setupMut = useSetupPassword();
  const loginMut = useLogin();
  const recoveryMut = useRecoveryQuestion();
  const resetMut = useResetPassword();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSetup) {
      if (username.trim().length < 2) {
        toast({ title: "Username too short", variant: "destructive" }); return;
      }
      if (password.length < 4) {
        toast({ title: "Password too short", description: "Use at least 4 characters.", variant: "destructive" }); return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" }); return;
      }
      if (!securityAnswer.trim()) {
        toast({ title: "Please answer the security question", variant: "destructive" }); return;
      }
      try {
        await setupMut.mutateAsync({ username, password, securityQuestion, securityAnswer });
        toast({ title: "Account created", description: "Your data is now protected." });
      } catch (err: any) {
        toast({ title: "Setup failed", description: err.message, variant: "destructive" });
      }
    } else {
      try {
        await loginMut.mutateAsync({ username, password });
      } catch (err: any) {
        toast({ title: "Login failed", description: "Incorrect username or password.", variant: "destructive" });
        setPassword("");
      }
    }
  };

  const handleLookupQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await recoveryMut.mutateAsync(recoveryUsername);
      setRecoveryQuestion(res.question);
      setMode("forgot-answer");
    } catch (err: any) {
      toast({ title: "User not found", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast({ title: "Password too short", description: "Use at least 4 characters.", variant: "destructive" }); return;
    }
    try {
      await resetMut.mutateAsync({
        username: recoveryUsername,
        securityAnswer: recoveryAnswer,
        newPassword,
      });
      toast({ title: "Password reset", description: "You can now log in with your new password." });
      setUsername(recoveryUsername);
      setPassword("");
      setRecoveryUsername("");
      setRecoveryAnswer("");
      setRecoveryQuestion("");
      setNewPassword("");
      setMode("auth");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  };

  const isPending = setupMut.isPending || loginMut.isPending || recoveryMut.isPending || resetMut.isPending;

  const renderAuth = () => (
    <>
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit">
          {isSetup ? <Lock className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
        </div>
        <div className="flex items-center justify-center gap-2 text-foreground">
          <PiggyBank className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg">WealthWise</span>
        </div>
        <CardTitle className="text-2xl font-display">
          {isSetup ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isSetup ? "Sign in to access your finances." : "Set up secure access to protect your data."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              data-testid="input-username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={isSetup ? "current-password" : "new-password"}
              className="rounded-xl h-11"
            />
          </div>
          {!isSetup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  data-testid="input-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label htmlFor="question">Security Question</Label>
                <select
                  id="question"
                  data-testid="select-question"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full rounded-xl h-11 border border-input bg-background px-3 text-sm"
                >
                  <option>What is your favorite color?</option>
                  <option>What city were you born in?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was the name of your first pet?</option>
                  <option>What is your favorite food?</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Security Answer</Label>
                <Input
                  id="answer"
                  data-testid="input-answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your answer (used to recover password)"
                  className="rounded-xl h-11"
                />
              </div>
            </>
          )}
          <Button
            type="submit"
            data-testid="button-auth-submit"
            disabled={isPending || !username || !password}
            className="w-full rounded-xl h-11 text-base shadow-lg shadow-primary/20"
          >
            {isPending ? "Please wait..." : isSetup ? "Sign In" : "Create Account"}
          </Button>
          {isSetup && (
            <button
              type="button"
              onClick={() => { setMode("forgot-username"); setRecoveryUsername(username); }}
              className="w-full text-sm text-primary hover:underline"
              data-testid="link-forgot-password"
            >
              Forgot password?
            </button>
          )}
        </form>
      </CardContent>
    </>
  );

  const renderForgotUsername = () => (
    <>
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit">
          <KeyRound className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-display">Recover Password</CardTitle>
        <CardDescription>Enter your username to start password recovery.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLookupQuestion} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rec-user">Username</Label>
            <Input
              id="rec-user"
              data-testid="input-recovery-username"
              autoFocus
              value={recoveryUsername}
              onChange={(e) => setRecoveryUsername(e.target.value)}
              placeholder="Your username"
              className="rounded-xl h-11"
            />
          </div>
          <Button
            type="submit"
            data-testid="button-lookup-question"
            disabled={isPending || !recoveryUsername}
            className="w-full rounded-xl h-11 text-base"
          >
            {isPending ? "Please wait..." : "Continue"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("auth")}
            className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
            data-testid="link-back-login"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        </form>
      </CardContent>
    </>
  );

  const renderForgotAnswer = () => (
    <>
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit">
          <KeyRound className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-display">Answer Security Question</CardTitle>
        <CardDescription>Answer correctly to set a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Question</Label>
            <p className="text-sm font-medium p-3 bg-secondary rounded-xl" data-testid="text-recovery-question">{recoveryQuestion}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-ans">Your Answer</Label>
            <Input
              id="rec-ans"
              data-testid="input-recovery-answer"
              autoFocus
              value={recoveryAnswer}
              onChange={(e) => setRecoveryAnswer(e.target.value)}
              placeholder="Your answer"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pass">New Password</Label>
            <Input
              id="new-pass"
              data-testid="input-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a new password"
              autoComplete="new-password"
              className="rounded-xl h-11"
            />
          </div>
          <Button
            type="submit"
            data-testid="button-reset-password"
            disabled={isPending || !recoveryAnswer || !newPassword}
            className="w-full rounded-xl h-11 text-base"
          >
            {isPending ? "Please wait..." : "Reset Password"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("auth")}
            className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        </form>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-xl">
        {mode === "auth" && renderAuth()}
        {mode === "forgot-username" && renderForgotUsername()}
        {mode === "forgot-answer" && renderForgotAnswer()}
      </Card>
    </div>
  );
}
