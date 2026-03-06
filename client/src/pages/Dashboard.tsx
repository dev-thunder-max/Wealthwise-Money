import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { format, parseISO, startOfMonth, isAfter } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity } from "lucide-react";
import { SmartInsights } from "@/components/SmartInsights";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  const prefCurrency = user?.currencyPreference || "USD";
  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  // Calculate current month's income & expenses
  const monthStart = startOfMonth(new Date());
  
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  transactions.forEach(t => {
    if (isAfter(parseISO(t.date), monthStart)) {
      if (t.type === 'income') monthlyIncome += t.amount;
      if (t.type === 'expense') monthlyExpense += t.amount;
    }
  });

  // Prepare chart data (Last 6 months simplified or last few days, let's group by category for expenses)
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.categoryName || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + (t.amount / 100);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expenseByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // top 5

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-lg">Here's your financial summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatCurrency(totalBalance, prefCurrency)}
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Income</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatCurrency(monthlyIncome, prefCurrency)}
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Expenses</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatCurrency(monthlyExpense, prefCurrency)}
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Net Savings</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatCurrency(monthlyIncome - monthlyExpense, prefCurrency)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Charts Area */}
          <Card className="p-6 rounded-2xl border-border/50 shadow-md shadow-black/5">
            <h3 className="text-lg font-display font-bold mb-6">Top Expenses by Category</h3>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--secondary))'}} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="p-0 overflow-hidden rounded-2xl border-border/50 shadow-md shadow-black/5">
            <div className="p-6 border-b border-border/50 bg-secondary/30">
              <h3 className="text-lg font-display font-bold">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-border/50">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${tx.categoryColor || '#ccc'}20`, color: tx.categoryColor || '#888' }}>
                      {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5"/> : tx.type === 'expense' ? <ArrowUpRight className="w-5 h-5"/> : <Activity className="w-5 h-5"/>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{tx.description || tx.categoryName || 'Transfer'}</p>
                      <p className="text-sm text-muted-foreground">{format(parseISO(tx.date), 'MMM d, yyyy')} • {tx.accountName}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-500' : tx.type === 'expense' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount, prefCurrency)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No recent transactions</div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <SmartInsights />
        </div>
      </div>
    </div>
  );
}
