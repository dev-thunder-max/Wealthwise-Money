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
import { useCreateAccount } from "@/hooks/use-accounts";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "bank", "credit", "savings", "mfs", "investment"]),
  balanceString: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Must be a valid number"),
});

type FormValues = z.infer<typeof formSchema>;

export function AccountForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const createAcc = useCreateAccount();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "bank",
      balanceString: "0.00",
    },
  });

  const onSubmit = (values: FormValues) => {
    createAcc.mutate(
      {
        name: values.name,
        type: values.type,
        balance: toCents(parseFloat(values.balanceString)),
      },
      {
        onSuccess: () => {
          toast({ title: "Account created successfully" });
          form.reset();
          onSuccess();
        },
        onError: (err) => {
          toast({ title: "Failed to create account", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Chase Checking" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="mfs">Mobile Financial Service</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="balanceString"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Balance</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createAcc.isPending} className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          {createAcc.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
