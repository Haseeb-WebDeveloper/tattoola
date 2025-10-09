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
  phone: z.string().trim().min(5, "Invalid phone"),
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
  favoriteStyles: z.array(z.string()).min(2, "Pick at least 2"),
  mainStyleId: z.string().trim().min(1, "Choose a primary style"),
}).refine((v) => v.favoriteStyles.includes(v.mainStyleId), {
  message: "Primary must be within favorites",
  path: ["mainStyleId"],
});

export const step9Schema = z.object({
  servicesOffered: z.array(z.string()).min(1, "Pick at least 1"),
});

export const step10Schema = z.object({
  bodyParts: z.array(z.string()).min(1, "Pick at least 1"),
});

export const step11Schema = z.object({
  minimumPrice: z.number().positive("Must be > 0"),
  hourlyRate: z.number().positive("Must be > 0"),
});

export const step12Schema = z.object({
  projects: z.array(z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    photos: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
  })).refine((arr) => arr.some((p) => (p.title && p.title.trim()) || (p.description && p.description.trim()) || (p.photos && p.photos.length > 0) || (p.videos && p.videos.length > 0)), {
    message: "Add at least one project",
    path: ["projects"],
  }),
});

export const step13Schema = z.object({
  selectedPlanId: z.string().trim().min(1, "Select a plan"),
});

export function isValid<T>(schema: z.ZodSchema<T>, data: T): boolean {
  return schema.safeParse(data).success;
}


