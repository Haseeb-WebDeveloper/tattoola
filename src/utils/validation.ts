import type { FormErrors, ValidationRule } from '../types/auth';

export class ValidationUtils {
  /**
   * Validate a single field
   */
  static validateField(value: any, rules: ValidationRule): string | null {
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    if (value && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters long`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `Must be no more than ${rules.maxLength} characters long`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return 'Invalid value';
      }
    }

    return null;
  }

  /**
   * Validate multiple fields
   */
  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): FormErrors {
    const errors: FormErrors = {};

    Object.keys(rules).forEach((field) => {
      const error = this.validateField(data[field], rules[field]);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }

  /**
   * Check if form has any errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

// Common validation rules
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return true;
      if (!/(?=.*[0-9])/.test(value)) {
        return 'Password must contain at least one number';
      }
      return true;
    },
  },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== password) {
        return 'Passwords do not match';
      }
      return true;
    },
  }),
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (!value) return true;
      if (!/^[a-zA-Z]/.test(value)) {
        return 'Username must start with a letter';
      }
      return true;
    },
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  phone: {
    required: true,
    pattern: /^\+[1-9]\d{1,14}$/,
    custom: (value: string) => {
      if (!value) return true;
      // E.164 format: +[country code][number]
      // Length should be between 8 and 15 characters (including +)
      if (value.length < 8 || value.length > 16) {
        return 'Phone number must be between 8 and 15 digits';
      }
      return true;
    },
  },
  businessName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  studioAddress: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  website: {
    pattern: /^https?:\/\/.+\..+/,
  },
  instagram: {
    pattern: /^[a-zA-Z0-9_.]+$/,
    maxLength: 30,
  },
  tiktok: {
    pattern: /^[a-zA-Z0-9_.]+$/,
    maxLength: 24,
  },
  bio: {
    maxLength: 500,
  },
  minimumPrice: {
    custom: (value: number) => {
      if (value !== undefined && value !== null && value < 0) {
        return 'Price must be positive';
      }
      return true;
    },
  },
  hourlyRate: {
    custom: (value: number) => {
      if (value !== undefined && value !== null && value < 0) {
        return 'Rate must be positive';
      }
      return true;
    },
  },
};

// Form validation schemas
export const LoginValidationSchema = {
  email: ValidationRules.email,
  password: { required: true },
};

export const RegisterValidationSchema = {
  username: ValidationRules.username,
  email: ValidationRules.email,
  password: ValidationRules.password,
};

export const UserStep3ValidationSchema = {
  firstName: ValidationRules.firstName,
  lastName: ValidationRules.lastName,
  phone: ValidationRules.phone,
  province: { required: true },
  municipality: { required: true },
};

export const UserStep4ValidationSchema = {
  // Avatar is optional, no validation needed
};

export const UserStep5ValidationSchema = {
  instagram: ValidationRules.instagram,
  tiktok: ValidationRules.tiktok,
};

export const UserStep6ValidationSchema = {
  favoriteStyles: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one favorite style';
      }
      if (value.length > 4) {
        return 'Please select no more than 4 favorite styles';
      }
      return true;
    },
  },
};

export const ArtistStep2ValidationSchema = {
  firstName: ValidationRules.firstName,
  lastName: ValidationRules.lastName,
};

export const ArtistStep4ValidationSchema = {
  workArrangement: { required: true },
};

export const ArtistStep5ValidationSchema = {
  businessName: ValidationRules.businessName,
  province: { required: true },
  municipality: { required: true },
  studioAddress: ValidationRules.studioAddress,
  phone: ValidationRules.phone,
  certificateUrl: { required: true },
  website: ValidationRules.website,
};

export const ArtistStep7ValidationSchema = {
  favoriteStyles: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one favorite style';
      }
      if (value.length > 2) {
        return 'Please select no more than 2 favorite styles for basic plan';
      }
      return true;
    },
  },
};

export const ArtistStep8ValidationSchema = {
  mainStyleId: { required: true },
};

export const ArtistStep9ValidationSchema = {
  services: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one service';
      }
      return true;
    },
  },
};

export const ArtistStep10ValidationSchema = {
  bodyParts: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one body part';
      }
      return true;
    },
  },
};

export const ArtistStep11ValidationSchema = {
  minimumPrice: ValidationRules.minimumPrice,
  hourlyRate: ValidationRules.hourlyRate,
};

export const ArtistStep12ValidationSchema = {
  projects: {
    required: true,
    custom: (value: any[]) => {
      if (!Array.isArray(value) || value.length !== 4) {
        return 'Please add exactly 4 portfolio projects';
      }
      
      for (let i = 0; i < value.length; i++) {
        const project = value[i];
        if (!project.media || !Array.isArray(project.media) || project.media.length === 0) {
          return `Project ${i + 1} must have at least one media file`;
        }
        if (!project.styles || !Array.isArray(project.styles) || project.styles.length === 0) {
          return `Project ${i + 1} must have at least one style selected`;
        }
      }
      
      return true;
    },
  },
};

export const ForgotPasswordValidationSchema = {
  email: ValidationRules.email,
};

export const ResetPasswordValidationSchema = {
  password: ValidationRules.password,
  confirmPassword: ValidationRules.confirmPassword,
};
