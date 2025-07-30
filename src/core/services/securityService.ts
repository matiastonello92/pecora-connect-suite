/**
 * Security Service
 * Centralizes security validation logic from utils/security.ts
 */

import DOMPurify from 'dompurify';

// Password validation
export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Message sanitization
export function sanitizeMessage(message: string): string {
  return DOMPurify.sanitize(message, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// Content validation
export function containsInappropriateContent(content: string): boolean {
  const inappropriateWords = [
    // Add inappropriate words list here
    'spam', 'scam', 'hack'
  ];
  
  const lowerContent = content.toLowerCase();
  return inappropriateWords.some(word => lowerContent.includes(word));
}

// File upload validation
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFileUpload(file: File): FileValidationResult {
  const errors: string[] = [];
  const maxSizeMB = 10;
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain'
  ];
  
  // Size validation
  if (file.size > maxSizeMB * 1024 * 1024) {
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  // Type validation
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Name validation
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Input sanitization for XSS prevention
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}

// SQL injection prevention helper
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}