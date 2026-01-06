import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { MdAdd, MdShare, MdBarChart } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen bg-background text-foreground transition-colors duration-300`}
    >
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">QuizMaster</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild>
              <Link href="/admin/login">Admin Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-32 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-6xl font-extrabold text-foreground mb-8 tracking-tight">
            Create & Share Quizzes
            <br />
            <span className="text-primary bg-primary/10 px-4 rounded-xl -rotate-1 inline-block transform">Effortlessly</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Build engaging quizzes with multiple choice, true/false, and text
            questions. Share them with anyone and get instant results.
            </p>

            <div className="flex gap-6 justify-center">
            <Button asChild size="lg" className="text-lg h-auto py-6 px-10 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                <Link href="/admin/login">Start Creating Quizzes</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg h-auto py-6 px-10 rounded-2xl hover:bg-muted/50 transition-all">
                <Link href="#features">Learn More</Link>
            </Button>
            </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mt-32">
          <Card className="border shadow-lg bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MdAdd className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">Easy Creation</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8 px-6 text-lg">
              Create quizzes in minutes with our intuitive question builder. Support for MCQ, True/False, and text answers.
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MdShare className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">Easy Sharing</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8 px-6 text-lg">
              Get a unique link for each quiz. Share via email, social media, or anywhere else. No signup required for takers.
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MdBarChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">Instant Results</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8 px-6 text-lg">
              Quiz takers see their scores immediately after submission with detailed answer review.
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm">
        <p>Built with Next.js and Django</p>
      </footer>
    </div>
  );
}
