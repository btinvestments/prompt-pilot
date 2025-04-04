"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Define prompt history type
type PromptHistory = {
  id: string;
  original_text: string;
  improved_text: string;
  category: string;
  model_used: string;
  tokens: number;
  quality_score: number;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch prompt history on component mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        // In a real implementation, this would be an API call to your backend
        // For now, we'll use mock data
        const mockHistory: PromptHistory[] = [
          {
            id: "1",
            original_text: "Write a blog post about AI",
            improved_text: "Write a comprehensive blog post about the evolution of artificial intelligence from its inception to current applications, focusing on machine learning breakthroughs and ethical considerations.",
            category: "writing",
            model_used: "anthropic/claude-3-sonnet",
            tokens: 256,
            quality_score: 8,
            created_at: "2025-04-03T14:30:00Z",
          },
          {
            id: "2",
            original_text: "Help me debug my React code",
            improved_text: "Analyze and debug my React component that's causing rendering issues. The component re-renders excessively when state updates, despite using useCallback and useMemo hooks. Provide a step-by-step approach to identify and fix performance bottlenecks.",
            category: "code",
            model_used: "openai/gpt-3.5-turbo",
            tokens: 189,
            quality_score: 9,
            created_at: "2025-04-02T10:15:00Z",
          },
          {
            id: "3",
            original_text: "Explain quantum computing",
            improved_text: "Explain quantum computing principles to a computer science undergraduate, covering qubits, superposition, entanglement, and quantum gates. Include practical examples of quantum algorithms like Shor's and Grover's, and discuss current limitations and future potential.",
            category: "reasoning",
            model_used: "anthropic/claude-3-opus",
            tokens: 215,
            quality_score: 10,
            created_at: "2025-04-01T16:45:00Z",
          },
        ];

        setHistory(mockHistory);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching history:", error);
        toast.error("Failed to fetch prompt history. Please try again.");
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Filter history based on search query
  const filteredHistory = history.filter((item) => {
    return (
      item.original_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.improved_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_used.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Prompt History</h1>
      <p className="text-muted-foreground mb-8">
        View and reuse your previous prompts.
      </p>

      <div className="flex justify-between items-center mb-8">
        <Input
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        
        <Button onClick={() => router.push("/prompt/new")}>
          Create New Prompt
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No prompt history found.</p>
            <Button onClick={() => router.push("/prompt/new")}>
              Create Your First Prompt
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1">{item.original_text}</CardTitle>
                    <CardDescription>
                      {formatDate(item.created_at)} • {item.category} • {item.tokens} tokens
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm px-2 py-1 rounded-full bg-muted">
                      {item.model_used.split('/')[1]}
                    </div>
                    <div className="text-sm px-2 py-1 rounded-full bg-muted">
                      Score: {item.quality_score}/10
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Original Prompt</h3>
                    <p className="text-sm">{item.original_text}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Improved Prompt</h3>
                    <p className="text-sm">{item.improved_text}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(item.improved_text);
                  toast.success("Prompt copied to clipboard!");
                }}>
                  Copy to Clipboard
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    router.push(`/prompt/new?mode=improve&prompt=${encodeURIComponent(item.improved_text)}`);
                  }}>
                    Improve
                  </Button>
                  <Button onClick={() => {
                    // In a real implementation, this would navigate to a page to use this prompt with a model
                    toast.success(`Prompt selected. Choose a model to use this prompt.`);
                    router.push(`/models?prompt=${encodeURIComponent(item.improved_text)}`);
                  }}>
                    Use Prompt
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
