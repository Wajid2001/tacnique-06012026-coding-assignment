import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MdViewSidebar, MdLogout, MdDashboard } from "react-icons/md";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-muted/40 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
             {/* Mobile Menu Trigger could go here if we had a side nav */}
             <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <MdDashboard className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground hidden sm:block">QuizAdmin</span>
             </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-foreground">{user?.username}</span>
                <span className="text-xs text-muted-foreground">Administrator</span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <MdLogout className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {(title || actions) && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            {title && <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        )}
        {children}
      </main>
    </div>
  );
}
