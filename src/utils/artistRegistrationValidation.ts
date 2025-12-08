import { z } from "zod";

export const step3Schema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  avatar: z.string().trim().min(1, "Required"),
});

export const step4Schema = z.object({
  workArrangement: z.enum(["FREELANCE", "STUDIO_EMPLOYEE", "STUDIO_OWNER"], {
    required_error: "Required",
    invalid_type_error: "Invalid",
  }),
});

export const step5Schema = z.object({
  studioName: z.string().trim().min(1, "Required"),
  province: z.string().trim().min(1, "Required"),
  municipality: z.string().trim().min(1, "Required"),
  studioAddress: z.string().trim().min(1, "Required"),
  website: z.string().url().optional().or(z.literal("")).optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(
      (val) => {
        // Must start with + and country code
        return /^\+[1-9]\d+$/.test(val);
      },
      {
        message: "Please enter a valid phone number",
      }
    )
    .refine(
      (val) => {
        // Extract all digits (excluding the +)
        const allDigits = val.replace(/[^0-9]/g, "");
        const totalDigits = allDigits.length;

        // Minimum total must be at least 10 digits (1 digit country code + 9 digit phone minimum)
        // Maximum total can be up to 19 digits (4 digit country code + 15 digit phone maximum)
        if (totalDigits < 10 || totalDigits > 19) {
          return false;
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
        return false;
      },
      {
        message: "Please enter a valid phone number",
      }
    ),
});

export const step6Schema = z.object({
  certificateUrl: z.string().trim().min(1, "Required"),
});

export const step7Schema = z.object({
  bio: z.string().trim().min(1, "Required"),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
});

export const step8Schema = z.object({
  // All styles selected via checkboxes
  styles: z.array(z.string()).min(1, "Pick at least 1 styles"),
  // Optional subset marked as favorites via star icons
  favoriteStyles: z.array(z.string()).optional(),
});

export const step9Schema = z.object({
  servicesOffered: z.array(z.string()).min(1, "Pick at least 1"),
});

export const step10Schema = z.object({
  bodyParts: z.array(z.string()).min(1, "Pick at least 1"),
});

export const step11Schema = z.object({
  minimumPrice: z.number().positive("Must be > 0"),
  hourlyRate: z
    .union([z.number().positive("Must be > 0"), z.undefined()])
    .optional(),
});

export const step12Schema = z.object({
  projects: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        photos: z.array(z.string()).optional(),
        videos: z.array(z.string()).optional(),
      })
    )
    .refine(
      (arr) =>
        arr.some(
          (p) =>
            (p.title && p.title.trim()) ||
            (p.description && p.description.trim()) ||
            (p.photos && p.photos.length > 0) ||
            (p.videos && p.videos.length > 0)
        ),
      {
        message: "Add at least one project",
        path: ["projects"],
      }
    ),
});

export const step13Schema = z.object({
  selectedPlanId: z.string().trim().min(1, "Select a plan"),
});

export function isValid<T>(schema: z.ZodSchema<T>, data: T): boolean {
  return schema.safeParse(data).success;
}
