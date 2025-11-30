import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";
import {
  ArrowRight,
  Database,
  Github,
  HardDrive,
  Lock,
  Server,
  Share2,
} from "lucide-react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 flex items-center gap-2">
              <Github className="h-3.5 w-3.5" />
              Open Source & Self-Hosted
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl max-w-4xl text-balance">
              Your Data, Your Infrastructure. <br />
              <span className="text-primary">Complete Control.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-balance">
              A modern, high-performance file storage solution designed for
              self-hosting. Keep your files on your own server without
              sacrificing the user experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <SignedOut>
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <a href="/auth/sign-in">
                    Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <a
                    href="https://github.com/renzynx/buh1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <a href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-24 border-y">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Why self-host?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Take back control of your digital assets with a platform built
                for privacy and performance.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-card/50 backdrop-blur-sm border shadow-sm">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Server className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Data Sovereignty</CardTitle>
                  <CardDescription>
                    Your files live on your hardware. No third-party snooping,
                    no unexpected terms of service changes, and complete
                    ownership.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border shadow-sm">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Privacy First</CardTitle>
                  <CardDescription>
                    Built with privacy in mind. Manage user access with granular
                    permissions and keep your internal documents truly internal.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border shadow-sm">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Seamless Sharing</CardTitle>
                  <CardDescription>
                    Generate secure, expiring links for external sharing.
                    Integrate with tools like ShareX for instant screenshot
                    uploads.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Tech Specs Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                Modern Stack, Robust Performance
              </h2>
              <p className="text-lg text-muted-foreground">
                Built with the latest web technologies to ensure speed,
                reliability, and ease of maintenance for administrators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {[
                  {
                    icon: Database,
                    label: "SQLite / Better-SQLite3",
                    desc: "Lightweight & Fast",
                  },
                  {
                    icon: HardDrive,
                    label: "Local Storage",
                    desc: "Direct disk access",
                  },
                  {
                    icon: Server,
                    label: "Docker Ready",
                    desc: "Easy deployment",
                  },
                  {
                    icon: Lock,
                    label: "Role-Based Access",
                    desc: "Admin & User roles",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 items-start">
                    <div className="mt-1 bg-muted p-2 rounded-md">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal/Code Visual */}
            <div className="relative rounded-xl border bg-zinc-950 p-4 sm:p-6 shadow-2xl overflow-hidden">
              <div className="flex gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500/20" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                <div className="h-3 w-3 rounded-full bg-green-500/20" />
              </div>
              <div className="overflow-x-auto">
                <div className="space-y-2 font-mono text-xs sm:text-sm">
                  <div className="flex gap-2 text-zinc-400">
                    <span className="text-green-400">➜</span>
                    <span>~</span>
                    <span className="text-zinc-100">
                      docker pull ghcr.io/renzynx/buh1:latest
                    </span>
                  </div>
                  <div className="text-zinc-500">
                    Using default tag: latest <br />
                    latest: Pulling from renzynx/buh1 <br />
                    Digest: sha256:7a...
                  </div>
                  <div className="flex gap-2 text-zinc-400 pt-2">
                    <span className="text-green-400 flex-shrink-0">➜</span>
                    <span className="flex-shrink-0">~</span>
                    <div className="text-zinc-100">
                      <div>docker run -d \</div>
                      <div className="ml-2">-p 3000:3000 \</div>
                      <div className="ml-2">
                        -v "$(pwd)/storage:/app/storage" \
                      </div>
                      <div className="ml-2">-v "$(pwd)/db:/app/db" \</div>
                      <div className="ml-2">
                        -e DATABASE_URL=/app/db/sqlite.db \
                      </div>
                      <div className="ml-2">-e AUTH_SECRET=your_secret \</div>
                      <div className="ml-2">
                        -e AUTH_BASE_URL=https://your-domain.com \
                      </div>
                      <div className="ml-2">ghcr.io/renzynx/buh1:latest</div>
                    </div>
                  </div>
                  <div className="text-zinc-100 pt-2">
                    <span className="text-green-400">✓</span> Server started on
                    http://localhost:3000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <HardDrive className="h-5 w-5" />
            Buh
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            MIT License. Built for the community.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/renzynx/buh1"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
