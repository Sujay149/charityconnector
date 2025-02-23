import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertDonationSchema, type Charity } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Ensure the public key is properly loaded
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing VITE_STRIPE_PUBLIC_KEY environment variable");
}

// Initialize Stripe with the public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FundraiserData {
  fullName: string;
  goalAmount: number;
  total: number;
}

function DonationForm({
  referralCode,
  clientSecret,
}: {
  referralCode: string;
  clientSecret: string;
}) {
  const [, setLocation] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const { data: charities } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertDonationSchema.extend({
        amount: insertDonationSchema.shape.amount.min(50, "Minimum donation is ₹50"),
      })
    ),
    defaultValues: {
      referralCode,
      amount: 50,
      donorName: "",
      message: "",
      charityId: 1,
    },
  });

  const donationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!stripe || !elements) throw new Error("Stripe not initialized");

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentIntent) throw new Error("Payment failed");

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          stripePaymentId: paymentIntent.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to record donation");

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your donation!",
        description: "Your support means a lot to us.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Donation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!charities) return null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => donationMutation.mutate(data))}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="charityId"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select a Charity</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {charities.map((charity) => (
                    <div key={charity.id}>
                      <RadioGroupItem
                        value={charity.id.toString()}
                        id={`charity-${charity.id}`}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`charity-${charity.id}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <img
                          src={charity.imageUrl}
                          alt={charity.name}
                          className="mb-3 h-32 w-full rounded-md object-cover"
                        />
                        <h3 className="font-semibold">{charity.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {charity.description}
                        </p>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Donation Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="donorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <PaymentElement />

        <Button
          type="submit"
          className="w-full"
          disabled={donationMutation.isPending}
        >
          {donationMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Complete Donation
        </Button>
      </form>
    </Form>
  );
}

export default function DonatePage() {
  const { referralCode } = useParams();
  const { toast } = useToast();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkTheme(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  const { data: fundraiser, error: fundraiserError } = useQuery<{ user: FundraiserData }>({
    queryKey: [`/api/fundraiser/${referralCode}`],
  });

  if (fundraiserError) {
    toast({
      title: "Error loading fundraiser",
      description: fundraiserError.message,
      variant: "destructive",
    });
  }

  const paymentIntentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!fundraiser) return null;

  const options = {
    clientSecret: paymentIntentMutation.data?.clientSecret,
    appearance: {
      theme: isDarkTheme ? "night" : "stripe",
      variables: {
        colorPrimary: '#22c55e',
      }
    },
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDarkTheme ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="mx-auto max-w-5xl space-y-8">
        <Card className={`bg-primary/5 ${isDarkTheme ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              Support {fundraiser.user.fullName}'s Campaign
            </CardTitle>
            <CardDescription className="text-center">
              {fundraiser.user.total >= fundraiser.user.goalAmount
                ? "Goal achieved! Thank you for your support!"
                : `Help reach the goal of ₹${fundraiser.user.goalAmount.toLocaleString()}`}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              Choose a charity and make a difference today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentIntentMutation.data?.clientSecret ? (
              <Elements stripe={stripePromise} options={options}>
                <DonationForm
                  referralCode={referralCode!}
                  clientSecret={paymentIntentMutation.data.clientSecret}
                />
              </Elements>
            ) : (
              <Button
                onClick={() => paymentIntentMutation.mutate(50)}
                className="w-full"
              >
                Start Donation
              </Button>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          className={`fixed bottom-4 right-4 p-2 rounded-full ${isDarkTheme ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        >
          {isDarkTheme ? "🌞" : "🌙"}
        </Button>
      </div>
    </div>
  );
}
