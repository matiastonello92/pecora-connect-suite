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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [invitationData, setInvitationData] = useState<any>(null);
  const { setLanguage } = useAuth();
  const { t } = useTranslation(selectedLanguage);
  const { toast } = useToast();

  // Check invitation validity on component mount
  useEffect(() => {
    const checkInvitation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'invite') {
        toast({
          title: "Error",
          description: "Invalid or missing invitation link",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        // Verify the invitation token
        const { data, error } = await supabase
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          toast({
            title: "Error",
            description: "Invalid or expired invitation",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setInvitationData(data);
        setEmail(data.email);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setRole(data.role);
        setLocation(data.location);
        setIsValidInvitation(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify invitation",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    checkInvitation();
  }, [searchParams, navigate, toast]);

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

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLanguage(selectedLanguage);

    try {
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

      // Mark invitation as completed
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', invitationData.id);

      if (updateError) {
        // Don't throw error as user creation was successful - just log internally
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });

      // Redirect to login
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

  if (!isValidInvitation) {
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
                minLength={6}
              />
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
                minLength={6}
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