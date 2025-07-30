/**
 * Validation Rules
 * Business validation logic
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRequired(value: any, fieldName: string): ValidationResult {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} is required`]
  };
}

export function validateMinLength(value: string, min: number, fieldName: string): ValidationResult {
  const isValid = value && value.length >= min;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be at least ${min} characters`]
  };
}

export function validateMaxLength(value: string, max: number, fieldName: string): ValidationResult {
  const isValid = !value || value.length <= max;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be no more than ${max} characters`]
  };
}