"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Define model type based on OpenRouter API
type Model = {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  category?: string;
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch models on component mount
  useEffect(() => {
    async function fetchModels() {
      try {
        // In a real implementation, this would be an API call to OpenRouter
        // For now, we'll use mock data
        const mockModels: Model[] = [
          {
            id: "openai/gpt-4o",
            name: "GPT-4o",
            description: "OpenAI's most advanced model, optimized for chat and multimodal tasks",
            context_length: 128000,
            pricing: {
              prompt: 0.01,
              completion: 0.03,
            },
            category: "chat",
          },
          {
            id: "anthropic/claude-3-opus",
            name: "Claude 3 Opus",
            description: "Anthropic's most capable model for complex reasoning tasks",
            context_length: 200000,
            pricing: {
              prompt: 0.015,
              completion: 0.075,
            },
            category: "reasoning",
          },
          {
            id: "anthropic/claude-3-sonnet",
            name: "Claude 3 Sonnet",
            description: "Balanced performance and cost for most tasks",
            context_length: 180000,
            pricing: {
              prompt: 0.003,
              completion: 0.015,
            },
            category: "writing",
          },
          {
            id: "anthropic/claude-3-haiku",
            name: "Claude 3 Haiku",
            description: "Fast and cost-effective for simpler tasks",
            context_length: 150000,
            pricing: {
              prompt: 0.00025,
              completion: 0.00125,
            },
            category: "chat",
          },
          {
            id: "openai/gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            description: "Fast and cost-effective for coding and simpler tasks",
            context_length: 16000,
            pricing: {
              prompt: 0.0005,
              completion: 0.0015,
            },
            category: "code",
          },
          {
            id: "mistralai/mistral-7b-instruct",
            name: "Mistral 7B Instruct",
            description: "Efficient open-source model for various tasks",
            context_length: 32000,
            pricing: {
              prompt: 0.0002,
              completion: 0.0002,
            },
            category: "code",
          },
          {
            id: "meta-llama/llama-3-70b-instruct",
            name: "Llama 3 70B Instruct",
            description: "Meta's powerful open-source model for complex tasks",
            context_length: 8000,
            pricing: {
              prompt: 0.0009,
              completion: 0.0009,
            },
            category: "reasoning",
          },
        ];

        setModels(mockModels);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Failed to fetch models. Please try again.");
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  // Filter models based on search query and category
  const filteredModels = models.filter((model) => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || model.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from models
  const categories = ["all", ...new Set(models.map(model => model.category || "other"))];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">AI Models</h1>
      <p className="text-muted-foreground mb-8">
        Browse available AI models and find the best one for your prompt.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:max-w-xs"
        />
        
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full md:w-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading models...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No models found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <Card key={model.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{model.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {model.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID:</span>
                    <span className="text-sm font-mono">{model.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Context Length:</span>
                    <span className="text-sm">{model.context_length.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pricing:</span>
                    <span className="text-sm">
                      ${model.pricing.prompt}/1K input, ${model.pricing.completion}/1K output
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <span className="text-sm capitalize">{model.category || "General"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => {
                  // In a real implementation, this would navigate to a page to use this model
                  toast.success(`Selected ${model.name}. Create a prompt to use this model.`);
                }}>
                  Use This Model
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
