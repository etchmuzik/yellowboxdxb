
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User } from "lucide-react";
import { getRiderById, updateRider } from "@/services/riderService";
import { supabase } from "@/config/supabase";
import type { Rider } from "@/types";

const riderFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(8, { message: "Valid phone number is required" }),
});

type RiderFormValues = z.infer<typeof riderFormSchema>;

export function RiderSettingsForm() {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [riderData, setRiderData] = useState<Rider | null>(null);

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    const loadRiderData = async () => {
      if (currentUser?.id) {
        try {
          const rider = await getRiderById(currentUser.id);
          if (rider) {
            setRiderData(rider);
            form.reset({
              fullName: rider.fullName || currentUser.name || "",
              email: rider.email || currentUser.email || "",
              phone: rider.phone || "",
            });
          }
        } catch (error) {
          console.error("Error loading rider data:", error);
        }
      }
    };

    loadRiderData();
  }, [currentUser, form]);

  const onSubmit = async (values: RiderFormValues) => {
    setIsSubmitting(true);
    try {
      // Update Supabase Auth profile metadata if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && values.fullName !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: {
            full_name: values.fullName,
          }
        });
      }

      // Update rider profile in Supabase
      if (currentUser?.id) {
        await updateRider(currentUser.id, {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          updatedAt: new Date().toISOString(),
        });
      }
      
      toast.success("Profile updated", {
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      
      toast.error("Update failed", {
        description: "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md border-t-2 border-t-nike-red">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-nike-red" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                    <Input placeholder="Your email" type="email" {...field} />
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
                    <Input placeholder="+971 XX XXX XXXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your phone number with country code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
