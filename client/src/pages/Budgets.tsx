import { useState } from "react";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BudgetForm } from "@/components/BudgetForm";
import { startOfMonth, parseISO, isAfter } from "date-fns";

export default function Budgets() {
  const { data: user } = useUser();
  const { data: budgets = [] } = useBudgets();
  const { data: transactions = [] } = useTransactions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const prefCurrency = user?.currencyPreference || "USD";
  const monthStart = startOfMonth(new Date());

  // Calculate spent amounts for the current month per category
  const spentByCategory = transactions
    .filter(t => t.type === 'expense' && isAfter(parseISO(t.date), monthStart))
    .reduce((acc, t) => {
      if (t.categoryId) {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<number, number>);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground text-lg mt-1">Keep your spending in check.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display">Manage Budget</DialogTitle>
            </DialogHeader>
            <BudgetForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const spent = spentByCategory[budget.categoryId] || 0;
          const limit = budget.limitAmount;
          const percentage = Math.min((spent / limit) * 100, 100);
          const isOver = spent > limit;
          
          return (
            <Card key={budget.id} className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary">
                    <span className="font-bold text-foreground">{budget.categoryName?.charAt(0) || '?'}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg">{budget.categoryName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground capitalize">{budget.period}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <span className={`text-2xl font-display font-bold ${isOver ? 'text-rose-500' : 'text-foreground'}`}>
                      {formatCurrency(spent, prefCurrency)}
                    </span>
                    <span className="text-muted-foreground font-medium ml-1">
                      / {formatCurrency(limit, prefCurrency)}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${isOver ? 'text-rose-500' : 'text-primary'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isOver ? 'bg-rose-500' : percentage > 85 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {isOver && (
                  <p className="text-sm font-medium text-rose-500 mt-2">
                    You've exceeded your budget by {formatCurrency(spent - limit, prefCurrency)}
                  </p>
                )}
              </div>
            </Card>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-secondary/30 rounded-3xl border border-dashed border-border">
            <div className="p-5 bg-background rounded-full mb-4 shadow-sm">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">No budgets set</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mb-6">Create budgets for your expense categories to track and limit your spending.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl">
              Create First Budget
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
