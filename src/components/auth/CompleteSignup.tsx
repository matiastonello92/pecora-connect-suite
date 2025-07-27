import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/utils/security';
import { auditLogger, auditActions } from '@/utils/auditLog';

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
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidInvitation, setIsValidInvitation] = useState(false);
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [invitationError, setInvitationError] = useState<string>('');
  const [tokenFromUrl, setTokenFromUrl] = useState<string>('');
  const { setLanguage } = useAuth();
  const { t } = useTranslation(selectedLanguage);
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
        // Verify the invitation token with detailed logging
        console.log('Querying user_invitations for token:', token);
        
        const { data, error } = await supabase
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        console.log('Database query result:', { data, error });

        if (error) {
          console.error('Database error:', error);
          if (error.code === 'PGRST116') {
            // No rows returned - token not found or expired
            const { data: expiredCheck } = await supabase
              .from('user_invitations')
              .select('status, expires_at')
              .eq('invitation_token', token)
              .single();
            
            if (expiredCheck) {
              if (expiredCheck.status === 'completed') {
                setInvitationError('This invitation has already been used. If you need access, please contact your administrator for a new invitation.');
              } else if (new Date(expiredCheck.expires_at) < new Date()) {
                setInvitationError('This invitation has expired. Please contact your administrator for a new invitation.');
              } else {
                setInvitationError('This invitation is no longer valid. Please contact your administrator for a new invitation.');
              }
            } else {
              setInvitationError('Invalid invitation token. Please check your email for the correct link or contact your administrator.');
            }
          } else {
            setInvitationError('Failed to verify invitation. Please try again or contact support.');
          }
          setIsCheckingInvitation(false);
          return;
        }

        if (!data) {
          setInvitationError('Invalid or expired invitation. Please contact your administrator for a new invitation.');
          setIsCheckingInvitation(false);
          return;
        }

        console.log('Valid invitation found:', data);
        
        // Check if user already exists with this email
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('first_name', data.first_name)
          .eq('last_name', data.last_name)
          .single();

        if (existingUser) {
          setInvitationError('A user with this information already exists. Please contact your administrator.');
          setIsCheckingInvitation(false);
          return;
        }

        setInvitationData(data);
        setEmail(data.email);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setRole(data.role);
        setLocation(data.location);
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
    setLanguage(selectedLanguage);

    try {
      // Final token validation before user creation
      const { data: finalCheck, error: finalError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', tokenFromUrl)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (finalError || !finalCheck) {
        throw new Error('Invitation is no longer valid. Please request a new invitation.');
      }

      // Create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (signUpError || !signUpData.user) {
        throw new Error(signUpError?.message || 'Registration failed');
      }

      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: signUpData.user.id,
          first_name: firstName,
          last_name: lastName,
          role,
          location,
          department: location, // Use location as department for now
          position: 'Staff', // Default position
          status: 'active'
        });

      if (profileError) {
        throw new Error('Failed to create user profile');
      }

      // Mark invitation as completed and invalidate token
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', invitationData.id);

      if (updateError) {
        console.error('Failed to mark invitation as completed:', updateError);
        // Don't throw error as user creation was successful - just log internally
      }

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
        description: "Account created successfully! Welcome to the team!",
      });

      // Redirect to login - the real-time subscriptions will automatically update the user list
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking invitation
  if (isCheckingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Processing...</p>
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
            Complete Your Registration
          </CardTitle>
          <p className="text-muted-foreground font-inter">
            Set your password to complete your account setup
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
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