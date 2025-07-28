import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export const AuthLayout = ({ title, subtitle, children, className = "" }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-3 sm:p-4 lg:p-8">
      <Card className={`w-full max-w-sm sm:max-w-md shadow-elegant ${className}`}>
        <CardHeader className="text-center pb-6 sm:pb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Logo size="lg" className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-playfair text-primary">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground font-inter">
              {subtitle}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};