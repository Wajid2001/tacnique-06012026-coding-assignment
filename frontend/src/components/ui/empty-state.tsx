import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionLink,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-12 border-dashed border rounded-xl shadow-sm bg-card animate-in fade-in zoom-in-95 duration-500", className)}>
      {Icon && (
        <div className="text-muted-foreground mb-4 p-4 bg-muted/50 rounded-full">
          <Icon className="w-12 h-12 opacity-50" />
        </div>
      )}
      <h3 className="text-xl font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      {actionLabel && actionLink && (
        <Button size="lg" asChild className="transition-all hover:scale-105">
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
