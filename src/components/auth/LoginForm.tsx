import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useTranslation, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useSimpleAuth();
  const { t } = useTranslation(selectedLanguage);
  const { toast } = useToast();

  // Check for registration success
  useEffect(() => {
    const registrationSuccess = searchParams.get('registration');
    const state = location.state as { message?: string; email?: string } | null;
    
    if (registrationSuccess === 'success' || state?.message) {
      setShowSuccessMessage(true);
      toast({
        title: "Registration Successful!",
        description: state?.message || "Your account has been created successfully. Please log in.",
      });
      
      if (state?.email) {
        setEmail(state.email);
      }
      
      // Clear the URL parameters
      navigate('/', { replace: true, state: null });
    }
  }, [searchParams, location.state, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const result = await login(email, password);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error?.message || String(result.error) || "Login failed",
        variant: "destructive",
      });
    } else {
      toast({
        title: t('welcome'),
        description: t('welcomeMessage'),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-3 sm:p-4 lg:p-8">
      <Card className="w-full max-w-sm sm:max-w-md shadow-elegant">
        <CardHeader className="text-center pb-6 sm:pb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Logo size="lg" className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-playfair text-primary">
            {t('welcome')}
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground font-inter">
            {t('welcomeMessage')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6">
          {showSuccessMessage && (
            <Alert className="border-success/20 bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                Registration completed successfully! You can now log in with your credentials.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="language" className="font-inter">
              {t('language')}
            </Label>
            <Select value={selectedLanguage} onValueChange={(value: Language) => setSelectedLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-inter">
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario@pecoranegra.com"
                disabled={isLoading}
                className="font-inter h-11 sm:h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-inter">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="font-inter h-11 sm:h-12 text-base"
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-medium text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('login')}...
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/auth/forgot-password">
              <Button variant="link" className="text-sm text-muted-foreground font-inter">
                {t('forgotPassword')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};