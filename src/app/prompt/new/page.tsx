"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for prompt generation
const generateFormSchema = z.object({
  goal: z.string().min(5, {
    message: "Goal must be at least 5 characters.",
  }),
  context: z.string().optional(),
});

// Form schema for prompt improvement
const improveFormSchema = z.object({
  prompt: z.string().min(5, {
    message: "Prompt must be at least 5 characters.",
  }),
  feedback: z.string().optional(),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;
type ImproveFormValues = z.infer<typeof improveFormSchema>;

// The actual content of the New Prompt page
function NewPromptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "generate";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [modelRecommendation, setModelRecommendation] = useState<string[]>([]);
  
  // Form for generating a new prompt
  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      goal: "",
      context: "",
    },
  });

  // Form for improving an existing prompt
  const improveForm = useForm<ImproveFormValues>({
    resolver: zodResolver(improveFormSchema),
    defaultValues: {
      prompt: "",
      feedback: "",
    },
  });

  // State for tracking email confirmation issues
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");
  
  // Handle generate prompt submission
  async function onGenerateSubmit(values: GenerateFormValues) {
    setIsSubmitting(true);
    setNeedsEmailConfirmation(false); // Reset email confirmation state
    
    try {
      console.log('Submitting generate prompt request with values:', values);
      
      const response = await fetch("/api/prompt/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Include cookies and authentication credentials
      });

      console.log('Response status:', response.status);
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error('Authentication error: User is not authenticated');
        toast.error('You must be signed in to generate prompts');
        router.push('/sign-in?redirect=/prompt/new');
        setIsSubmitting(false);
        return;
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error(`Invalid JSON response`);
      }
      
      if (!response.ok) {
        // Extract error information from the response data
        const errorMessage = data.details || data.error || "Failed to generate prompt";
        console.error("API error:", data);
        
        // Check for email confirmation errors
        if (data.code === "email_not_confirmed" || 
            (errorMessage && errorMessage.toLowerCase().includes('email') && 
             errorMessage.toLowerCase().includes('confirm'))) {
          console.log('Email not confirmed error detected');
          setNeedsEmailConfirmation(true);
          setEmailForResend(data.email || "");
          toast.error('Please confirm your email address to continue');
          return;
        }
        
        // Check if this is an auth-related error
        if (errorMessage.toLowerCase().includes('unauthorized') || 
            errorMessage.toLowerCase().includes('authentication') || 
            errorMessage.toLowerCase().includes('sign in')) {
          toast.error('Authentication error: Please sign in again');
          router.push('/sign-in?redirect=/prompt/new');
          return;
        }
        
        throw new Error(errorMessage);
      }

      if (!data.prompt) {
        console.error('Response missing prompt field:', data);
        throw new Error("No prompt was generated. Please try again.");
      }
      
      setGeneratedPrompt(data.prompt);
      console.log('Generated prompt set successfully:', data.prompt);
      
      // Get model recommendation
      await getModelRecommendation(data.prompt);
      
      toast.success("Prompt generated successfully!");
      
      // Reset email confirmation state if successful
      setNeedsEmailConfirmation(false);
    } catch (error) {
      console.error("Error generating prompt:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate prompt. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle improve prompt submission
  async function onImproveSubmit(values: ImproveFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/prompt/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to improve prompt");
      }

      const data = await response.json();
      setImprovedPrompt(data.improved);
      
      // Get model recommendation
      await getModelRecommendation(data.improved);
      
      toast.success("Prompt improved successfully!");
    } catch (error) {
      console.error("Error improving prompt:", error);
      toast.error("Failed to improve prompt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get model recommendation
  async function getModelRecommendation(prompt: string) {
    try {
      const response = await fetch("/api/model/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to get model recommendation");
      }

      const data = await response.json();
      setModelRecommendation(data.recommendedModels);
    } catch (error) {
      console.error("Error getting model recommendation:", error);
      toast.error("Failed to get model recommendation.");
    }
  }

  // Send prompt to AI model
  async function sendToModel(model: string, prompt: string) {
    try {
      const response = await fetch("/api/ai/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send prompt to model");
      }

      const data = await response.json();
      toast.success(`Prompt sent to ${model} successfully!`);
      
      // Here you would typically navigate to a results page
      // router.push(`/results?id=${data.id}`);
    } catch (error) {
      console.error("Error sending prompt to model:", error);
      toast.error("Failed to send prompt to model. Please try again.");
    }
  }

  // Handle resend confirmation email
  async function handleResendConfirmation() {
    if (!emailForResend) {
      toast.error("No email address available for resending confirmation");
      return;
    }
    
    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailForResend }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend confirmation email");
      }
      
      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend confirmation email");
    }
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Prompt</h1>
      
      {needsEmailConfirmation && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your email address needs to be confirmed before you can generate prompts.
              </p>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResendConfirmation}
                >
                  Resend Confirmation Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue={mode} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generate" onClick={() => router.push("/prompt/new?mode=generate")}>
            Generate New
          </TabsTrigger>
          <TabsTrigger value="improve" onClick={() => router.push("/prompt/new?mode=improve")}>
            Improve Existing
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate a Prompt</CardTitle>
                <CardDescription>
                  Describe your goal and we'll create an effective prompt for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generateForm}>
                  <form onSubmit={generateForm.handleSubmit(onGenerateSubmit)} className="space-y-4">
                    <FormField
                      control={generateForm.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Goal</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what you want to achieve with this prompt..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific about what you want the AI to do.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generateForm.control}
                      name="context"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Context (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any relevant background information..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide any context that might help create a better prompt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Generating..." : "Generate Prompt"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {generatedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Prompt</CardTitle>
                  <CardDescription>
                    Here's your AI-generated prompt based on your goal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-md bg-muted">
                    <p className="whitespace-pre-wrap">{generatedPrompt}</p>
                  </div>
                  
                  {modelRecommendation.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Recommended Models</h3>
                      <div className="space-y-2">
                        {modelRecommendation.map((model) => (
                          <div key={model} className="flex items-center justify-between">
                            <span>{model}</span>
                            <Button
                              size="sm"
                              onClick={() => sendToModel(model, generatedPrompt)}
                            >
                              Use This Model
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(generatedPrompt);
                    toast.success("Prompt copied to clipboard!");
                  }}>
                    Copy Prompt
                  </Button>
                  <Button variant="outline" onClick={() => {
                    improveForm.setValue("prompt", generatedPrompt);
                    router.push("/prompt/new?mode=improve");
                  }}>
                    Improve This Prompt
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="improve">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Improve a Prompt</CardTitle>
                <CardDescription>
                  Paste an existing prompt and we'll help you make it better.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...improveForm}>
                  <form onSubmit={improveForm.handleSubmit(onImproveSubmit)} className="space-y-4">
                    <FormField
                      control={improveForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Existing Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste your existing prompt here..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the prompt you want to improve.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={improveForm.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Improvement Feedback (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What specific aspects would you like to improve?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Let us know what issues you're having with the current prompt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Improving..." : "Improve Prompt"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {improvedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Improved Prompt</CardTitle>
                  <CardDescription>
                    Here's your improved prompt with enhanced effectiveness.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-md bg-muted">
                    <p className="whitespace-pre-wrap">{improvedPrompt}</p>
                  </div>
                  
                  {modelRecommendation.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Recommended Models</h3>
                      <div className="space-y-2">
                        {modelRecommendation.map((model) => (
                          <div key={model} className="flex items-center justify-between">
                            <span>{model}</span>
                            <Button
                              size="sm"
                              onClick={() => sendToModel(model, improvedPrompt)}
                            >
                              Use This Model
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(improvedPrompt);
                    toast.success("Prompt copied to clipboard!");
                  }}>
                    Copy Prompt
                  </Button>
                  <Button variant="outline" onClick={() => {
                    improveForm.setValue("prompt", improvedPrompt);
                    toast.success("Prompt set for further improvement!");
                  }}>
                    Improve Further
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main component that handles authentication
export default function NewPromptPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Use Clerk's built-in components to handle authentication
  return (
    <>
      <SignedIn>
        <NewPromptContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/prompt/new" />
      </SignedOut>
    </>
  );
}
