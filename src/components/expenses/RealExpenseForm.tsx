import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ExpenseFirestoreService } from '@/services/expenseFirestoreService';
import { RiderFirestoreService } from '@/services/riderFirestoreService';
import { toast } from '@/components/ui/use-toast';
import { SpendCategory } from '@/types';
import { cn } from '@/lib/utils';

const expenseCategories: { value: SpendCategory; label: string }[] = [
  { value: 'Visa Fees', label: 'Visa Fees' },
  { value: 'Medical Test', label: 'Medical Test' },
  { value: 'Emirates ID', label: 'Emirates ID' },
  { value: 'RTA Theory Test', label: 'RTA Theory Test' },
  { value: 'RTA Road Test', label: 'RTA Road Test' },
  { value: 'Eye Test', label: 'Eye Test' },
  { value: 'Bike Maintenance', label: 'Bike Maintenance' },
  { value: 'Uniform', label: 'Uniform' },
  { value: 'Training', label: 'Training' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Other', label: 'Other' }
];

const formSchema = z.object({
  riderId: z.string().min(1, 'Please select a rider'),
  category: z.string().min(1, 'Please select a category'),
  amountAed: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({
    required_error: 'Please select a date',
  }),
  description: z.string().min(1, 'Please provide a description'),
  receiptUrl: z.string().optional(),
});

interface RealExpenseFormProps {
  onSuccess?: () => void;
  preSelectedRiderId?: string;
}

export function RealExpenseForm({ onSuccess, preSelectedRiderId }: RealExpenseFormProps) {
  const [riders, setRiders] = useState<Array<{ id: string; fullName: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRiders, setIsLoadingRiders] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riderId: preSelectedRiderId || '',
      category: '',
      amountAed: 0,
      date: new Date(),
      description: '',
      receiptUrl: '',
    },
  });

  // Load riders on component mount
  React.useEffect(() => {
    const loadRiders = async () => {
      setIsLoadingRiders(true);
      try {
        console.log('📋 RealExpenseForm: Starting to load riders...');
        const allRiders = await RiderFirestoreService.getAllRiders();
        console.log(`✅ RealExpenseForm: Loaded ${allRiders.length} riders:`, allRiders);
        
        if (allRiders.length === 0) {
          console.warn('⚠️ RealExpenseForm: No riders found in database!');
          toast({
            title: 'No Riders Found',
            description: 'No riders are available. Please add riders first.',
            variant: 'destructive',
          });
        }
        
        setRiders(allRiders.map(r => ({ id: r.id, fullName: r.fullName })));
      } catch (error) {
        console.error('❌ RealExpenseForm: Error loading riders:', error);
        toast({
          title: 'Error',
          description: `Failed to load riders: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingRiders(false);
      }
    };
    loadRiders();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await ExpenseFirestoreService.createExpense({
        riderId: values.riderId,
        category: values.category as SpendCategory,
        amountAed: values.amountAed,
        date: format(values.date, 'yyyy-MM-dd'),
        description: values.description,
        receiptUrl: values.receiptUrl,
      });

      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding expense:', error);
      
      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      let description = 'Failed to add expense';
      
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        description = 'You need Admin or Finance role to create expenses. Please contact an administrator.';
      } else if (errorMessage.includes('authenticated')) {
        description = 'Please log in to create expenses.';
      } else {
        description = errorMessage;
      }
      
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="riderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rider</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingRiders}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingRiders ? "Loading riders..." : "Select a rider"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingRiders ? (
                    <SelectItem value="loading" disabled>
                      Loading riders...
                    </SelectItem>
                  ) : riders.length === 0 ? (
                    <SelectItem value="no-riders" disabled>
                      No riders available
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
          name="amountAed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Enter the expense amount in AED
              </FormDescription>
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
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Date when the expense was incurred
              </FormDescription>
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
                  placeholder="Provide details about this expense..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any relevant details about this expense
              </FormDescription>
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
                  type="url"
                  placeholder="https://example.com/receipt.pdf"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Link to receipt or supporting document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Expense'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}