
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { ApplicationStage } from "@/data";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(8, { message: "Please enter a valid phone number" }),
  nationality: z.string().min(2, { message: "Nationality is required" }),
  bikeType: z.string().min(1, { message: "Bike type is required" }),
  visaNumber: z.string().optional(),
  applicationStage: z.string(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddRiderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddRiderForm({ onSuccess, onCancel }: AddRiderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "United Arab Emirates",
      bikeType: "Road Bike",
      visaNumber: "",
      applicationStage: "Applied",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // In a real app, we would make an API call here
    console.log("Creating new rider:", values);
    
    // Simulate API call delay
    setTimeout(() => {
      toast.success("Rider added successfully");
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    }, 1000);
  };

  const bikeTypes = ["Road Bike", "Mountain Bike", "Electric Bike", "Hybrid Bike"];
  const nationalities = ["United Arab Emirates", "India", "Pakistan", "Philippines", "Egypt", "United Kingdom", "United States"];
  const stages: ApplicationStage[] = [
    "Applied",
    "Docs Verified",
    "Theory Test",
    "Road Test",
    "Medical",
    "ID Issued",
    "Active",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+971 50 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
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
            name="bikeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bike Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bike type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bikeTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="visaNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visa Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="applicationStage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional information here..." 
                  className="h-24"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-nike-red hover:bg-nike-red/90" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Rider"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
