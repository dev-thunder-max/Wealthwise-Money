import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertBudget } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  categoryId: z.coerce.number().min(1, "Category is required"),
  limitString: z.string().min(1, "Limit is required").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  period: z.enum(["monthly", "weekly", "yearly"]),
});

type FormValues = z.infer<typeof formSchema>;

export function BudgetForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const upsertBudget = useUpsertBudget();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: "monthly",
      limitString: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    upsertBudget.mutate(
      {
        categoryId: values.categoryId,
        limitAmount: toCents(parseFloat(values.limitString)),
        period: values.period,
      },
      {
        onSuccess: () => {
          toast({ title: "Budget saved successfully" });
          form.reset();
          onSuccess();
        },
        onError: (err) => {
          toast({ title: "Failed to save budget", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="limitString"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spending Limit</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={upsertBudget.isPending} className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          {upsertBudget.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Budget"}
        </Button>
      </form>
    </Form>
  );
}
