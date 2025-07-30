import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useEnhancedAuth();
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message };
  };
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(email);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setIsSubmitted(true);
      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions",
      });
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl font-playfair text-primary">
              Check Your Email
            </CardTitle>
            <p className="text-muted-foreground font-inter">
              We've sent a password reset link to {email}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full font-inter"
              >
                Try Another Email
              </Button>
              
              <Link to="/" className="block">
                <Button variant="link" className="w-full font-inter">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-playfair text-primary">
            Reset Password
          </CardTitle>
          <p className="text-muted-foreground font-inter">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-inter">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
                className="font-inter"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="Sending Reset Link..." />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/" className="block">
              <Button variant="link" className="text-sm text-muted-foreground font-inter">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};