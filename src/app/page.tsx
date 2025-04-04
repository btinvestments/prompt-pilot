import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="w-full py-6">
        <div className="container space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to PromptPilot, your AI prompt engineering assistant.
          </p>
        </div>
      </section>

      <section className="w-full">
        <div className="container">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Get Started</h2>
            <Button asChild>
              <Link href="/prompt/new">
                <span className="mr-2">+</span>
                New Prompt
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Generate a Prompt</CardTitle>
                <CardDescription>
                  Create an effective prompt based on your goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to achieve, and we'll craft a well-structured prompt for you.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/prompt/new?mode=generate">
                    Generate
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improve a Prompt</CardTitle>
                <CardDescription>
                  Enhance an existing prompt for better results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Paste your existing prompt and get suggestions to make it more effective.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/prompt/new?mode=improve">
                    Improve
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Find the Right Model</CardTitle>
                <CardDescription>
                  Get model recommendations for your prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your prompt and suggest the best models for your specific use case.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/models">
                    Explore Models
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          
          <Tabs defaultValue="prompts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="prompts">Your Prompts</TabsTrigger>
              <TabsTrigger value="models">Used Models</TabsTrigger>
            </TabsList>
            <TabsContent value="prompts">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Prompts</CardTitle>
                  <CardDescription>
                    Your prompt history will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground text-center">
                      You haven't created any prompts yet. Get started by generating a new prompt.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button asChild variant="outline">
                    <Link href="/history">View All History</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/prompt/new">Create New</Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="models">
              <Card>
                <CardHeader>
                  <CardTitle>Model Usage</CardTitle>
                  <CardDescription>
                    Models you've used recently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground text-center">
                      You haven't used any models yet. Try sending a prompt to an AI model.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/models">Explore Models</Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
