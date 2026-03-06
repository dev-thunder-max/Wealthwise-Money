import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toCents } from "@/lib/format";
import { format } from "date-fns";
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
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amountString: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  accountId: z.coerce.number().min(1, "Account is required"),
  categoryId: z.coerce.number().optional().nullable(),
  toAccountId: z.coerce.number().optional().nullable(),
}).refine((data) => {
  if (data.type === 'transfer' && !data.toAccountId) return false;
  return true;
}, {
  message: "Destination account is required for transfers",
  path: ["toAccountId"],
}).refine((data) => {
  if (data.type !== 'transfer' && !data.categoryId) return false;
  return true;
}, {
  message: "Category is required",
  path: ["categoryId"],
});

type FormValues = z.infer<typeof formSchema>;

export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amountString: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  });

  const type = form.watch("type");
  const filteredCategories = categories.filter(c => c.type === type);

  const onSubmit = (values: FormValues) => {
    createTx.mutate(
      {
        type: values.type,
        amount: toCents(parseFloat(values.amountString)),
        date: values.date,
        description: values.description || "",
        accountId: values.accountId,
        categoryId: values.type === 'transfer' ? null : values.categoryId ?? null,
        toAccountId: values.type === 'transfer' ? values.toAccountId ?? null : null,
      },
      {
        onSuccess: () => {
          toast({ title: "Transaction added successfully" });
          form.reset();
          onSuccess();
        },
        onError: (err) => {
          toast({ title: "Failed to add transaction", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amountString"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" type="number" step="0.01" className="rounded-xl h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" className="rounded-xl h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'transfer' ? 'From Account' : 'Account'}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'transfer' ? (
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="What was this for?" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createTx.isPending} className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          {createTx.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Transaction"}
        </Button>
      </form>
    </Form>
  );
}
