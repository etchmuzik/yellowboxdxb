
import { useState, useEffect } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { getAllRiders } from "@/services/riderService";
import { createExpense } from "@/services/expenseService";
import { Rider } from "@/types";

// Form schema
const formSchema = z.object({
  riderId: z.string().min(1, "Rider is required"),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  amountAed: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid number greater than 0.",
  }),
  date: z.date(),
  visaNumber: z.string().min(1, "Visa number is required"),
  receiptUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVisaCostFormProps {
  onSuccess?: () => void;
}

export function AddVisaCostForm({ onSuccess }: AddVisaCostFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(true);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const data = await getAllRiders();
        setRiders(data);
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setLoadingRiders(false);
      }
    };

    fetchRiders();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riderId: "",
      description: "Work visa processing fee",
      amountAed: "3150",
      date: new Date(),
      visaNumber: "",
      receiptUrl: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      // Create a new expense record
      await createExpense({
        riderId: data.riderId,
        category: "Visa Fees",
        amountAed: parseFloat(data.amountAed),
        date: data.date.toISOString(),
        description: data.description,
        receiptUrl: data.receiptUrl || undefined,
      });

      toast({
        title: "Visa cost added successfully",
        description: "The visa cost has been recorded for the selected rider",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Failed to add visa cost",
        description: err.message || "An error occurred while adding the visa cost",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="riderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rider</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingRiders ? (
                    <SelectItem value="loading" disabled>
                      Loading riders...
                    </SelectItem>
                  ) : riders.length === 0 ? (
                    <SelectItem value="no-riders" disabled>
                      No riders found
                    </SelectItem>
                  ) : (
                    riders.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id}>
                        {rider.fullName}
                      </SelectItem>
                    ))
                  )}
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
          name="visaNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visa Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter visa number" {...field} />
              </FormControl>
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
                  placeholder="Describe the visa expense..."
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
            onClick={onSuccess}
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
              "Add Visa Cost"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
