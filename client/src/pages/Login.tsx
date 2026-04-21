import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStatus, useLogin, useSetupPassword } from "@/hooks/use-auth";
import { Lock, ShieldCheck, PiggyBank } from "lucide-react";

export default function Login() {
  const { data: status } = useAuthStatus();
  const isSetup = status?.isSetup ?? false;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const setupMut = useSetupPassword();
  const loginMut = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSetup) {
      if (password.length < 4) {
        toast({ title: "Password too short", description: "Use at least 4 characters.", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        return;
      }
      try {
        await setupMut.mutateAsync(password);
        toast({ title: "Password set", description: "Your data is now protected." });
      } catch (err: any) {
        toast({ title: "Setup failed", description: err.message, variant: "destructive" });
      }
    } else {
      try {
        await loginMut.mutateAsync(password);
      } catch (err: any) {
        toast({ title: "Login failed", description: "Incorrect password.", variant: "destructive" });
        setPassword("");
      }
    }
  };

  const isPending = setupMut.isPending || loginMut.isPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit">
            {isSetup ? <Lock className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>
          <div className="flex items-center justify-center gap-2 text-foreground">
            <PiggyBank className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg">WealthWise</span>
          </div>
          <CardTitle className="text-2xl font-display">
            {isSetup ? "Welcome back" : "Secure your data"}
          </CardTitle>
          <CardDescription>
            {isSetup
              ? "Enter your password to unlock your finances."
              : "Set a password to protect your financial data."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-xl h-11"
              />
            </div>
            {!isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  data-testid="input-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="rounded-xl h-11"
                />
              </div>
            )}
            <Button
              type="submit"
              data-testid="button-auth-submit"
              disabled={isPending || !password}
              className="w-full rounded-xl h-11 text-base shadow-lg shadow-primary/20"
            >
              {isPending ? "Please wait..." : isSetup ? "Unlock" : "Set Password & Continue"}
            </Button>
            {!isSetup && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Your password is stored securely as a hash. Don't forget it - it cannot be recovered.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
