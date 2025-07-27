import DOMPurify from 'dompurify';

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input sanitization for chat messages
export const sanitizeMessage = (message: string): string => {
  // Remove dangerous HTML tags and scripts
  const sanitized = DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
  
  // Trim whitespace and limit length
  return sanitized.trim().slice(0, 1000);
};

// File validation for uploads
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocumentTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  return { isValid: true };
};

// Rate limiting for authentication attempts
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const authRateLimiter = new RateLimiter();

// Enhanced content filtering for inappropriate messages
export const containsInappropriateContent = (message: string): boolean => {
  // Enhanced inappropriate content detection with more comprehensive word list
  const inappropriateWords = [
    // Spam and scam related
    'spam', 'scam', 'hack', 'exploit', 'phishing', 'fraud', 'fake',
    // Hate speech and harassment (basic detection)
    'harassment', 'bully', 'threaten', 'abuse',
    // Explicit content markers
    'explicit', 'inappropriate', 'nsfw',
    // Malicious content
    'virus', 'malware', 'trojan', 'keylogger'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Check for inappropriate words
  if (inappropriateWords.some(word => lowerMessage.includes(word))) {
    return true;
  }
  
  // Check for excessive capitalization (potential shouting/spam)
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (message.length > 10 && capsRatio > 0.7) {
    return true;
  }
  
  // Check for excessive repetition of characters
  if (/(.)\1{4,}/.test(message)) {
    return true;
  }
  
  return false;
};

// Session timeout management
export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

export const isSessionExpired = (lastActivity: number): boolean => {
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
};

export const updateLastActivity = (): void => {
  localStorage.setItem('lastActivity', Date.now().toString());
};

export const getLastActivity = (): number => {
  const stored = localStorage.getItem('lastActivity');
  return stored ? parseInt(stored, 10) : Date.now();
};