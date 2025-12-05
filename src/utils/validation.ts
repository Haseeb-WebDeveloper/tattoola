import type { FormErrors, ValidationRule } from "../types/auth";

export class ValidationUtils {
  /**
   * Validate a single field
   */
  static validateField(value: any, rules: ValidationRule): string | null {
    if (
      rules.required &&
      (!value || (typeof value === "string" && value.trim() === ""))
    ) {
      return "Questo campo è obbligatorio";
    }

    if (value && typeof value === "string") {
      if (rules.minLength && value.length < rules.minLength) {
        return `Deve contenere almeno ${rules.minLength} caratteri`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `Non può superare i ${rules.maxLength} caratteri`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        // For username, we provide specific error in custom validation
        // For other fields, use generic message
        return "Formato non valido";
      }
    }

    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === "string") {
        return result;
      }
      if (result === false) {
        return "Valore non valido";
      }
    }

    return null;
  }

  /**
   * Validate multiple fields
   */
  static validateForm(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): FormErrors {
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
        return "La password deve contenere almeno un numero";
      }
      return true;
    },
  },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== password) {
        return "Le password non coincidono";
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

      // Check for spaces
      if (/\s/.test(value)) {
        return "Non sono consentiti spazi";
      }

      // Check if starts with a letter
      if (!/^[a-zA-Z]/.test(value)) {
        return "Lo username deve iniziare con una lettera";
      }

      // Check for invalid characters (pattern check happens before custom, but we provide specific message)
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return "Sono consentite solo lettere, numeri e underscore";
      }

      // Check length (minLength and maxLength are checked before custom, but we provide specific message)
      if (value.length < 3) {
        return "Lo username deve contenere almeno 3 caratteri";
      }
      if (value.length > 30) {
        return "Lo username non può superare i 30 caratteri";
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
    custom: (value: string) => {
      if (!value || value.trim() === "") {
        return "Questo campo è obbligatorio";
      }
      // E.164 format: +[country code][number]
      // Check format first
      if (!/^\+[1-9]\d+$/.test(value)) {
        return "Please enter a valid phone number";
      }
      // Extract all digits (excluding the +)
      const allDigits = value.replace(/[^0-9]/g, "");
      const totalDigits = allDigits.length;

      // Minimum total must be at least 10 digits (1 digit country code + 9 digit phone minimum)
      // Maximum total can be up to 19 digits (4 digit country code + 15 digit phone maximum)
      if (totalDigits < 10 || totalDigits > 19) {
        return "Please enter a valid phone number";
      }

      // Try country code lengths from 1 to 4 (to handle 4-digit country codes)
      // Check if there's at least ONE valid split where phone number is 10-15 digits
      // We don't require ALL splits to be valid, just that a valid split exists
      for (
        let ccLength = 1;
        ccLength <= 4 && ccLength < totalDigits;
        ccLength++
      ) {
        const phoneNumberLength = totalDigits - ccLength;
        // If we find at least one valid split, the phone number is valid
        if (phoneNumberLength >= 10 && phoneNumberLength <= 15) {
          return true;
        }
      }

      // No valid split found
      return "Please enter a valid phone number";
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
        return "Price must be positive";
      }
      return true;
    },
  },
  hourlyRate: {
    custom: (value: number) => {
      if (value !== undefined && value !== null && value < 0) {
        return "Rate must be positive";
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
        return "Seleziona almeno uno stile preferito";
      }
      if (value.length > 4) {
        return "Seleziona al massimo 4 stili preferiti";
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
        return "Seleziona almeno uno stile preferito";
      }
      if (value.length > 2) {
        return "Per il piano Basic puoi selezionare al massimo 2 stili preferiti";
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
        return "Seleziona almeno un servizio";
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
        return "Seleziona almeno una parte del corpo";
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
        return "Aggiungi esattamente 4 progetti al portfolio";
      }

      for (let i = 0; i < value.length; i++) {
        const project = value[i];
        if (
          !project.media ||
          !Array.isArray(project.media) ||
          project.media.length === 0
        ) {
          return `Il progetto ${i + 1} deve avere almeno un file multimediale`;
        }
        if (
          !project.styles ||
          !Array.isArray(project.styles) ||
          project.styles.length === 0
        ) {
          return `Il progetto ${i + 1} deve avere almeno uno stile selezionato`;
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
