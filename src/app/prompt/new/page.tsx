"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

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

export default function NewPromptPage() {
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

  // Handle generate prompt submission
  async function onGenerateSubmit(values: GenerateFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/prompt/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      
      // Get model recommendation
      await getModelRecommendation(data.prompt);
      
      toast.success("Prompt generated successfully!");
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error("Failed to generate prompt. Please try again.");
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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Prompt</h1>
      
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
                    Copy to Clipboard
                  </Button>
                  <Button onClick={() => improveForm.setValue("prompt", generatedPrompt)}>
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
                  Paste your existing prompt and we'll help you improve it.
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
                          <FormLabel>Your Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste your existing prompt here..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The prompt you want to improve.
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
                              placeholder="What aspects would you like to improve?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Specify what you'd like to improve about the prompt.
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
                    Here's your improved prompt.
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
                    Copy to Clipboard
                  </Button>
                  <Button onClick={() => improveForm.setValue("prompt", improvedPrompt)}>
                    Improve Again
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
