import { useState } from "react";
import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/TransactionForm";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const { data: user } = useUser();
  const { data: transactions = [] } = useTransactions();
  const deleteTx = useDeleteTransaction();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const prefCurrency = user?.currencyPreference || "USD";

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTx.mutate(id, {
        onSuccess: () => toast({ title: "Transaction deleted" })
      });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-lg mt-1">Manage your income and expenses.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display">New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-md shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border text-muted-foreground text-sm font-medium">
                <th className="p-4 font-medium pl-6">Date</th>
                <th className="p-4 font-medium">Details</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium pr-6 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="p-4 pl-6 whitespace-nowrap text-sm text-muted-foreground">
                    {format(parseISO(tx.date), "MMM d, yyyy")}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {tx.type === 'income' && <ArrowDownRight className="w-4 h-4 text-emerald-500" />}
                      {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                      {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4 text-indigo-500" />}
                      {tx.description || 'No description'}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {tx.categoryName ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">
                        {tx.categoryName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Transfer</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {tx.accountName}
                  </td>
                  <td className={`p-4 text-right font-bold whitespace-nowrap ${
                    tx.type === 'income' ? 'text-emerald-500' : tx.type === 'expense' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount, prefCurrency)}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(tx.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-secondary rounded-full">
                        <ReceiptText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No transactions found</p>
                      <p className="text-sm">Add your first transaction to see it here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
