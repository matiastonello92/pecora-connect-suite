/**
 * Validation Schemas
 * Consolidates validation logic from lib/validation.ts and utils/*Validation.ts
 */

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const requiredStringSchema = z.string().min(1, 'This field is required');
export const optionalStringSchema = z.string().optional();
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// User validation schemas (from /lib/validation.ts)
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

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
});

// Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Common validation functions (from /lib/validation.ts)
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