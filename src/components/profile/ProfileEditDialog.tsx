import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { UserProfile } from '@/types/users';
import { supabase } from '@/integrations/supabase/client';
import { MultiLocationSelect } from '@/components/ui/location-select';
import { ValidatedInput } from '@/components/forms/ValidatedInput';
import { GenericForm } from '@/components/forms/GenericForm';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface ProfileEditDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditDialog = ({ user, isOpen, onOpenChange }: ProfileEditDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationError, setLocationError] = useState('');
  
  const { execute: saveProfile, isLoading: saving } = useAsyncOperation(
    async () => {
      // Validate locations first
      if (locations.length === 0) {
        setLocationError('At least one location must be selected.');
        throw new Error('At least one location must be selected.');
      }
      setLocationError('');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          locations: locations,
          location: locations[0], // Keep single location for backward compatibility
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      onOpenChange(false);
      // Refresh the page to show updated data
      window.location.reload();
    },
    {
      successMessage: 'Profile updated successfully',
      errorMessage: 'Failed to update profile'
    }
  );

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
      setLocations(user.locations || ['menton']);
      setLocationError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <GenericForm
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          cancelLabel="Cancel"
          onCancel={() => onOpenChange(false)}
          isLoading={saving}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ValidatedInput
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              required
            />
            <ValidatedInput
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <ValidatedInput
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            placeholder="Optional"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Locations <span className="text-destructive">*</span>
            </label>
            <MultiLocationSelect
              value={locations}
              onValueChange={setLocations}
              placeholder="Select locations"
              disabled={saving}
            />
            {locationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {locationError}
              </div>
            )}
          </div>
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
};