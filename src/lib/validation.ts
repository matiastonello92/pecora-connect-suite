import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const requiredStringSchema = z.string().min(1, 'This field is required');
export const optionalStringSchema = z.string().optional();
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format');

// User validation schemas
export const userValidationSchema = z.object({
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
  email: emailSchema,
  role: z.enum(['base', 'manager', 'super_admin']),
  restaurantRole: z.enum(['chef', 'sous_chef', 'cook', 'server', 'bartender', 'host', 'manager', 'assistant_manager', 'dishwasher', 'cleaner']).optional(),
  accessLevel: z.enum(['base', 'enhanced', 'full']),
  locations: z.array(z.string()).min(1, 'At least one location must be selected'),
  department: optionalStringSchema,
  position: optionalStringSchema
});

// Common validation functions
export function validateField(value: any, schema: z.ZodSchema): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Validation error';
    }
    return 'Validation error';
  }
}

export function validateForm<T>(data: T, schema: z.ZodSchema<T>): { 
  errors: Record<string, string>;
  isValid: boolean;
} {
  try {
    schema.parse(data);
    return { errors: {}, isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { errors, isValid: false };
    }
    return { errors: { general: 'Validation error' }, isValid: false };
  }
}