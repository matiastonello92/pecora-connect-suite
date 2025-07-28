import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}

export const PageLayout = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  headerActions,
  className = ""
}: PageLayoutProps) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-secondary/20 via-background to-accent/10 ${className}`}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-playfair text-foreground flex items-center gap-3">
              {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground font-inter text-sm sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex flex-wrap gap-2">
              {headerActions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};