import { useUser, useUpdateUserPreference } from "@/hooks/use-user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { Trash2, Download, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout } from "@/hooks/use-auth";

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export default function Settings() {
  const { data: user } = useUser();
  const updatePref = useUpdateUserPreference();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoutMut = useLogout();

  const handleWipe = async () => {
    if (confirm("Are you sure? This will permanently delete all your accounts, transactions, and budgets.")) {
      const res = await fetch(api.settings.wipe.path, { method: api.settings.wipe.method });
      if (res.ok) {
        toast({ title: "Data wiped successfully" });
        queryClient.invalidateQueries();
      }
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`${api.settings.export.path}?format=${format}`, '_blank');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
      
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Currency</span>
            <Select 
              value={user?.currencyPreference} 
              onValueChange={(val) => updatePref.mutate({ currencyPreference: val })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Download your data for backup or use in other applications.</p>
            <div className="flex gap-4">
              <Button onClick={() => handleExport('csv')} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button onClick={() => handleExport('json')} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Export JSON
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
             <p className="text-sm font-bold text-foreground mb-2">Security</p>
             <p className="text-sm text-muted-foreground mb-4">Sign out to lock your data. You'll need your password to get back in.</p>
             <Button
               onClick={() => logoutMut.mutate()}
               variant="outline"
               className="w-full"
               data-testid="button-logout"
             >
               <LogOut className="w-4 h-4 mr-2" /> Sign Out
             </Button>
          </div>

          <div className="pt-6 border-t border-border/50">
             <p className="text-sm font-bold text-destructive mb-2">Danger Zone</p>
             <p className="text-sm text-muted-foreground mb-4">Wiping data will clear everything and reset the app to its original state.</p>
             <Button onClick={handleWipe} variant="destructive" className="w-full">
               <Trash2 className="w-4 h-4 mr-2" /> Wipe All Data
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}