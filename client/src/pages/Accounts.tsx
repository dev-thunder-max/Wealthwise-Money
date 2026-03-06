import { useState } from "react";
import { useAccounts, useDeleteAccount } from "@/hooks/use-accounts";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CreditCard, Landmark, Wallet, PiggyBank, Briefcase, Building } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountForm } from "@/components/AccountForm";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, any> = {
  bank: Landmark,
  credit: CreditCard,
  cash: Wallet,
  savings: PiggyBank,
  mfs: Briefcase,
  investment: Building,
};

export default function Accounts() {
  const { data: user } = useUser();
  const { data: accounts = [] } = useAccounts();
  const deleteAcc = useDeleteAccount();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const prefCurrency = user?.currencyPreference || "USD";

  const handleDelete = (id: number) => {
    if (confirm("Are you sure? Deleting an account may detach its transactions.")) {
      deleteAcc.mutate(id, {
        onSuccess: () => toast({ title: "Account deleted" })
      });
    }
  };

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground text-lg mt-2">Net Worth: <span className="font-bold text-foreground">{formatCurrency(totalBalance, prefCurrency)}</span></p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display">New Account</DialogTitle>
            </DialogHeader>
            <AccountForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const Icon = iconMap[acc.type] || Wallet;
          return (
            <Card key={acc.id} className="relative overflow-hidden p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(acc.id)}>
                   <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
              <div className="flex flex-col h-full justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-secondary rounded-2xl text-foreground shadow-inner">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight text-foreground">{acc.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{acc.type.replace('-', ' ')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
                  <p className={`text-3xl font-display font-bold ${acc.balance < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                    {formatCurrency(acc.balance, prefCurrency)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/30 rounded-3xl border border-dashed border-border">
            <div className="p-5 bg-background rounded-full mb-4 shadow-sm">
              <Wallet className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">No accounts yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">Create an account to start tracking your balances and adding transactions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
