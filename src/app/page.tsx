import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Create and Vote on
            <span className="text-primary"> Polls</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern polling platform for gathering community opinions. 
            Create engaging polls, vote on interesting questions, and see real-time results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/polls">
              <Button size="lg" className="text-lg px-8">
                Browse Polls
              </Button>
            </Link>
            <Link href="/create-poll">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create Poll
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose PollApp?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">📊</span>
                  </div>
                  Real-time Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See live voting results as they come in. Watch the percentages update in real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">🎯</span>
                  </div>
                  Easy Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create polls in seconds with our intuitive interface. Add multiple options and descriptions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">🔒</span>
                  </div>
                  Secure Voting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  One vote per user ensures fair and accurate results. Your privacy is protected.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Polls Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Recent Polls</h2>
            <Link href="/polls">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's your favorite programming language?</CardTitle>
                <CardDescription>Let's see which programming language is most popular among developers.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>JavaScript</span>
                    <span className="text-muted-foreground">45 votes (35%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Python</span>
                    <span className="text-muted-foreground">38 votes (29%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TypeScript</span>
                    <span className="text-muted-foreground">32 votes (25%)</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">130 total votes</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Which framework do you prefer?</CardTitle>
                <CardDescription>Share your experience with different web frameworks.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>React</span>
                    <span className="text-muted-foreground">52 votes (46%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vue</span>
                    <span className="text-muted-foreground">28 votes (25%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Angular</span>
                    <span className="text-muted-foreground">20 votes (18%)</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">112 total votes</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's your preferred database?</CardTitle>
                <CardDescription>Which database technology do you use most often?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>PostgreSQL</span>
                    <span className="text-muted-foreground">42 votes (40%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>MongoDB</span>
                    <span className="text-muted-foreground">35 votes (33%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>MySQL</span>
                    <span className="text-muted-foreground">28 votes (27%)</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">105 total votes</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users creating and voting on polls every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
            <Link href="/polls">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Explore Polls
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
