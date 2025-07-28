import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useTranslation, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { FormField } from '@/components/forms/FormField';
import { GenericForm } from '@/components/forms/GenericForm';

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
    <AuthLayout title={t('welcome')} subtitle={t('welcomeMessage')}>
      {showSuccessMessage && (
        <Alert className="border-success/20 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            Registration completed successfully! You can now log in with your credentials.
          </AlertDescription>
        </Alert>
      )}

      <FormField
        label={t('language')}
        type="select"
        value={selectedLanguage}
        onChange={(value) => setSelectedLanguage(value as Language)}
        selectOptions={[
          { value: 'en', label: 'English' },
          { value: 'fr', label: 'Français' },
          { value: 'it', label: 'Italiano' }
        ]}
        disabled={isLoading}
      />

      <GenericForm 
        onSubmit={handleSubmit}
        submitLabel={isLoading ? `${t('login')}...` : t('login')}
        isLoading={isLoading}
        showActions={false}
      >
        <FormField
          label={t('email')}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="mario@pecoranegra.com"
          disabled={isLoading}
          required
        />

        <FormField
          label={t('password')}
          type="password"
          value={password}
          onChange={setPassword}
          disabled={isLoading}
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
      </GenericForm>

      <div className="text-center">
        <Link to="/auth/forgot-password">
          <Button variant="link" className="text-sm text-muted-foreground font-inter">
            {t('forgotPassword')}
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
};