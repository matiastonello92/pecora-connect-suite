import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { LoadingSpinner, FullPageLoader } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/utils/security';
import { auditLogger, auditActions } from '@/utils/auditLog';
import { validateInvitationToken, getInvitationErrorMessage, cleanupExpiredInvitations } from '@/utils/invitationValidation';

export const CompleteSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidInvitation, setIsValidInvitation] = useState(false);
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [invitationError, setInvitationError] = useState<string>('');
  const [tokenFromUrl, setTokenFromUrl] = useState<string>('');
  const { toast } = useToast();

  // Check invitation validity on component mount
  useEffect(() => {
    const checkInvitation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      console.log('Checking invitation with token:', token, 'type:', type);
      
      if (!token || type !== 'invite') {
        setInvitationError('Invalid or missing invitation link. Please check your email for the correct link.');
        setIsCheckingInvitation(false);
        return;
      }

      setTokenFromUrl(token);

      try {
        // Clean up expired invitations first
        await cleanupExpiredInvitations();
        
        // Use the comprehensive validation function
        const validationResult = await validateInvitationToken(token);
        
        if (!validationResult.isValid) {
          const errorMessage = validationResult.errorMessage || 
                             getInvitationErrorMessage(validationResult.errorCode || 'UNKNOWN');
          setInvitationError(errorMessage);
          setIsCheckingInvitation(false);
          return;
        }

        const invitationData = validationResult.invitationData;
        if (!invitationData) {
          setInvitationError('Invalid invitation data. Please contact your administrator.');
          setIsCheckingInvitation(false);
          return;
        }

        console.log('Valid invitation found:', invitationData);
        
      // Check if user already exists with this email (proper email check)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', invitationData.email)
        .single();

        if (existingUser) {
          setInvitationError('A user with this information already exists. Please contact your administrator.');
          setIsCheckingInvitation(false);
          return;
        }

        setInvitationData(invitationData);
        setEmail(invitationData.email);
        setFirstName(invitationData.first_name);
        setLastName(invitationData.last_name);
        setRole(invitationData.role);
        setLocation(invitationData.location);
        setIsValidInvitation(true);
        setIsCheckingInvitation(false);
        
        console.log('Invitation validation successful');
      } catch (error) {
        console.error('Error during invitation check:', error);
        setInvitationError('Failed to verify invitation. Please try again or contact support.');
        setIsCheckingInvitation(false);
      }
    };

    checkInvitation();
  }, [searchParams]);

  const retryInvitationCheck = () => {
    setIsCheckingInvitation(true);
    setInvitationError('');
    // Trigger re-check
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements",
        description: passwordValidation.errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Final token validation before user creation
      const finalValidation = await validateInvitationToken(tokenFromUrl);
      
      if (!finalValidation.isValid) {
        const errorMessage = finalValidation.errorMessage || 
                           getInvitationErrorMessage(finalValidation.errorCode || 'UNKNOWN');
        throw new Error(errorMessage);
      }

      console.log('Starting signup process for email:', email);
      
      // Create the user account
      const redirectUrl = `${window.location.origin}/app/dashboard`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (signUpError || !signUpData.user) {
        console.error('Signup error:', signUpError);
        throw new Error(signUpError?.message || 'Registration failed');
      }

      console.log('User account created successfully:', signUpData.user.id);

      
      // Use the comprehensive completion function
      const { data: completionResult, error: completionError } = await supabase
        .rpc('complete_invitation_signup', {
          token_to_complete: tokenFromUrl,
          user_email: email,
          new_user_id: signUpData.user.id
        });

      if (completionError || !completionResult || completionResult.length === 0) {
        console.error('Invitation completion error:', completionError);
        
        // Clean up the auth user since invitation completion failed
        try {
          await supabase.auth.admin.deleteUser(signUpData.user.id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error('Failed to complete invitation process. Please contact support.');
      }

      const result = completionResult[0];
      if (!result.success) {
        console.error('Invitation completion failed:', result.error_message);
        
        // Clean up the auth user since invitation completion failed
        try {
          await supabase.auth.admin.deleteUser(signUpData.user.id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error(result.error_message || 'Failed to complete registration.');
      }

      console.log('Invitation completed successfully');

      // Audit log the successful registration
      await auditLogger.logUserAction(
        signUpData.user.id, 
        auditActions.USER_CREATED, 
        undefined, 
        { 
          email, 
          role, 
          location, 
          invitation_used: invitationData.id,
          registration_method: 'invitation' 
        }
      );

      toast({
        title: "Success", 
        description: "Account created successfully! Please check your email to verify your account.",
      });

      // Redirect to login with success state
      navigate('/?registration=success', { 
        state: { 
          message: "Registration completed successfully! Please log in with your credentials.",
          email: email 
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = error.message;
      
      // Handle specific Supabase errors
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message?.includes('Invalid token')) {
        errorMessage = 'This invitation link is invalid or has expired. Please request a new invitation.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before proceeding.';
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking invitation
  if (isCheckingInvitation) {
    return <FullPageLoader text="Verifying invitation..." />;
  }

  // Show error state for invalid invitations
  if (invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-playfair text-destructive">
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground font-inter">
              {invitationError}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={retryInvitationCheck}
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="default"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Need help? Contact your administrator to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
                <li>Request a new invitation</li>
                <li>Verify your email address</li>
                <li>Check invitation expiry</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidInvitation) {
    return <FullPageLoader text="Processing..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-playfair text-primary">
            Complete Your Registration
          </CardTitle>
          <p className="text-muted-foreground font-inter">
            Set your password to complete your account setup
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-inter">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="font-inter bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-inter">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  className="font-inter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-inter">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  className="font-inter"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="font-inter">
                Role
              </Label>
              <Input
                id="role"
                type="text"
                value={role}
                disabled
                className="font-inter bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-inter">
                Location
              </Label>
              <Input
                id="location"
                type="text"
                value={location}
                disabled
                className="font-inter bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-inter">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="font-inter"
                required
                minLength={8}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-inter">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="font-inter"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="Creating Account..." />
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};