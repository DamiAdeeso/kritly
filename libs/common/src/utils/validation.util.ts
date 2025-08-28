import { ValidationError } from 'class-validator';

export function formatValidationErrors(errors: ValidationError[]): string[] {
  const formattedErrors: string[] = [];

  function extractErrors(errors: ValidationError[], prefix = ''): void {
    for (const error of errors) {
      const field = prefix ? `${prefix}.${error.property}` : error.property;
      
      if (error.constraints) {
        for (const constraint of Object.values(error.constraints)) {
          formattedErrors.push(`${field}: ${constraint}`);
        }
      }

      if (error.children && error.children.length > 0) {
        extractErrors(error.children, field);
      }
    }
  }

  extractErrors(errors);
  return formattedErrors;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
