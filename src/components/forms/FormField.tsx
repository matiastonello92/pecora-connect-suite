import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'custom';
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  children?: ReactNode; // For select options or custom components
  className?: string;
  selectOptions?: { value: string; label: string }[];
}

export const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  children,
  className = "",
  selectOptions
}: FormFieldProps) => {
  const fieldId = label.toLowerCase().replace(/\s+/g, '-');

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`font-inter ${error ? 'border-destructive' : ''}`}
            required={required}
          />
        );

      case 'select':
        return (
          <Select value={String(value)} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {children}
            </SelectContent>
          </Select>
        );

      case 'custom':
        return children;

      default:
        return (
          <Input
            id={fieldId}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`font-inter ${error ? 'border-destructive' : ''}`}
            required={required}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className="font-inter">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
};