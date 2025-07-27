
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { SpendCategory } from "@/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense } from "@/services/expenseService";

// Form schema
const formSchema = z.object({
  category: z.string(),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  amountAed: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid number greater than 0.",
  }),
  date: z.date(),
  receiptUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddExpenseFormProps {
  riderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddExpenseForm({ riderId, onSuccess, onCancel }: AddExpenseFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (onSuccess) onSuccess();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Visa Fees",
      description: "",
      amountAed: "",
      date: new Date(),
      receiptUrl: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (!riderId) {
      toast.error("No rider selected");
      return;
    }

    setSubmitting(true);
    try {
      // Transform form data to SpendEvent
      const newExpense = {
        riderId,
        category: data.category as SpendCategory,
        amountAed: parseFloat(data.amountAed),
        date: data.date.toISOString(),
        description: data.description,
        receiptUrl: data.receiptUrl || undefined,
      };

      await createExpenseMutation.mutateAsync(newExpense);
      toast.success("Expense added successfully");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const err = error as { message?: string };
      const errorMessage = err.message || "Failed to add expense";
      
      let description = errorMessage;
      
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        description = 'You need Admin or Finance role to create expenses. Please contact an administrator.';
      } else if (errorMessage.includes('authenticated')) {
        description = 'Please log in to create expenses.';
      }
      
      toast.error(description);
    } finally {
      setSubmitting(false);
    }
  }

  // Categories for expense
  const categories: SpendCategory[] = [
    "Visa Fees",
    "RTA Tests",
    "Medical",
    "Residency ID",
    "Training",
    "Uniform",
    "Other",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the expense..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amountAed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/receipt.pdf"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
