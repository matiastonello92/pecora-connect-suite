import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/components/ui/layouts/AuthLayout';
import { FormField } from '@/components/forms/FormField';
import { GenericForm } from '@/components/forms/GenericForm';
import { SmartButton } from '@/components/common/SmartButton';
import { useNotificationService } from '@/hooks/useNotificationService';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSimpleAuth();
  const { showSuccess, showError } = useNotificationService();

  // Check for registration success
  useEffect(() => {
    const registrationSuccess = searchParams.get('registration');
    const state = location.state as { message?: string; email?: string } | null;
    
    if (registrationSuccess === 'success' || state?.message) {
      setShowSuccessMessage(true);
      showSuccess(
        "Registration Successful!",
        state?.message || "Your account has been created successfully. Please log in."
      );
      
      if (state?.email) {
        setEmail(state.email);
      }
      
      // Clear the URL parameters
      navigate('/', { replace: true, state: null });
    }
  }, [searchParams, location.state, showSuccess, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      showError("Please fill in all fields");
      throw new Error("Please fill in all fields");
    }

    const result = await login(email, password);
    
    if (result.error) {
      const errorMsg = result.error?.message || String(result.error) || "Login failed";
      showError(errorMsg);
      throw new Error(errorMsg);
    } else {
      showSuccess("Welcome back!", "Successfully signed in to your account.");
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      {showSuccessMessage && (
        <Alert className="border-success/20 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            Registration completed successfully! You can now log in with your credentials.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="mario@pecoranegra.com"
          required
        />

        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
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

        <SmartButton
          asyncOperation={handleLogin}
          className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-medium text-base"
          loadingText="Signing in..."
        >
          Sign In
        </SmartButton>
      </div>

      <div className="text-center">
        <Link to="/auth/forgot-password" className="text-sm text-muted-foreground font-inter hover:underline">
          Forgot your password?
        </Link>
      </div>
    </AuthLayout>
  );
};