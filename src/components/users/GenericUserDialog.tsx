import { useState, useEffect } from 'react';
import { Edit, Save, UserPlus } from 'lucide-react';
import { DialogLayout } from '@/components/ui/layouts/DialogLayout';
import { FormField } from '@/components/forms/FormField';
import { GenericForm } from '@/components/forms/GenericForm';
import { FlexLayout } from '@/components/ui/layouts/FlexLayout';
import { MultiLocationSelect } from '@/components/ui/location-select';
import { 
  UserProfile, 
  UserRole,
  RestaurantRole, 
  AccessLevel,
  RESTAURANT_ROLE_LABELS,
  ACCESS_LEVEL_LABELS
} from '@/types/users';
import { userValidationSchema, validateForm } from '@/core/validation';
import { handleError, showSuccessToast, showErrorToast } from '@/core/utils';
import { supabase } from '@/integrations/supabase/client';

interface GenericUserDialogProps {
  user?: UserProfile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSaved: () => void;
  mode: 'create' | 'edit';
}

export const GenericUserDialog = ({ 
  user, 
  isOpen, 
  onOpenChange, 
  onUserSaved, 
  mode 
}: GenericUserDialogProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'base' as UserRole,
    restaurantRole: 'none' as RestaurantRole | 'none',
    accessLevel: 'base' as AccessLevel,
    locations: [] as string[],
    department: '',
    position: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          restaurantRole: user.restaurantRole || 'none',
          accessLevel: user.accessLevel,
          locations: user.locations || ['menton', 'lyon'],
          department: user.department,
          position: user.position
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          role: 'base',
          restaurantRole: 'none',
          accessLevel: 'base',
          locations: ['menton', 'lyon'],
          department: '',
          position: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, user, mode]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    // Validate locations first
    if (formData.locations.length === 0) {
      setErrors({ locations: 'At least one location must be selected' });
      showErrorToast('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          restaurant_role: formData.restaurantRole === 'none' ? null : formData.restaurantRole,
          access_level: formData.accessLevel,
          
          locations: formData.locations,
          department: formData.department,
          position: formData.position,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.user_id);

      if (error) throw error;

      showSuccessToast(`User ${mode === 'create' ? 'created' : 'updated'} successfully`);

      onUserSaved();
      onOpenChange(false);
    } catch (error) {
      showErrorToast(`Failed to ${mode} user: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const restaurantRoleOptions = [
    { value: 'none', label: 'No specific role' },
    ...Object.entries(RESTAURANT_ROLE_LABELS).map(([value, label]) => ({ value, label }))
  ];

  const accessLevelOptions = Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => ({ 
    value, 
    label 
  }));

  const roleOptions = [
    { value: 'base', label: 'Base User' },
    { value: 'manager', label: 'Manager' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  return (
    <DialogLayout
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create User' : 'Edit User Profile'}
      icon={mode === 'create' ? UserPlus : Edit}
      onSave={handleSave}
      saveLabel={mode === 'create' ? 'Create User' : 'Save Changes'}
      isSaving={saving}
      maxWidth="2xl"
    >
      <GenericForm onSubmit={(e) => { e.preventDefault(); handleSave(); }} showActions={false}>
        <FlexLayout direction="col" gap="md">
          {/* Basic Information */}
          <FlexLayout direction="row" gap="md" wrap>
            <div className="flex-1 min-w-64">
              <FormField
                label="First Name"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                required
                disabled={saving}
                error={errors.firstName}
              />
            </div>
            <div className="flex-1 min-w-64">
              <FormField
                label="Last Name"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                required
                disabled={saving}
                error={errors.lastName}
              />
            </div>
          </FlexLayout>

          <FlexLayout direction="row" gap="md" wrap>
            <div className="flex-1 min-w-64">
              <FormField
                label="Department"
                value={formData.department}
                onChange={(value) => handleInputChange('department', value)}
                disabled={saving}
                error={errors.department}
              />
            </div>
            <div className="flex-1 min-w-64">
              <FormField
                label="Position"
                value={formData.position}
                onChange={(value) => handleInputChange('position', value)}
                disabled={saving}
                error={errors.position}
              />
            </div>
          </FlexLayout>

          {/* Locations */}
          <FormField
            label="Locations"
            type="custom"
            required
            error={errors.locations}
          >
            <MultiLocationSelect
              value={formData.locations}
              onValueChange={(value) => handleInputChange('locations', value)}
              placeholder="Select locations"
              disabled={saving}
            />
          </FormField>

          {/* Roles and Access */}
          <FlexLayout direction="row" gap="md" wrap>
            <div className="flex-1 min-w-64">
              <FormField
                label="Restaurant Role"
                type="select"
                value={formData.restaurantRole}
                onChange={(value) => handleInputChange('restaurantRole', value)}
                selectOptions={restaurantRoleOptions}
                disabled={saving}
              />
            </div>
            <div className="flex-1 min-w-64">
              <FormField
                label="Access Level"
                type="select"
                value={formData.accessLevel}
                onChange={(value) => handleInputChange('accessLevel', value)}
                selectOptions={accessLevelOptions}
                disabled={saving}
                required
              />
            </div>
          </FlexLayout>

          <FormField
            label="System Role"
            type="select"
            value={formData.role}
            onChange={(value) => handleInputChange('role', value)}
            selectOptions={roleOptions}
            disabled={saving}
            required
          />
        </FlexLayout>
      </GenericForm>
    </DialogLayout>
  );
};