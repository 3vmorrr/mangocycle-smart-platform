import { z } from "zod";
import { USER_ROLES } from "@/data/contracts/auth";

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Full name cannot exceed 200 characters"),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

export type CreateUserFormInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Full name cannot exceed 200 characters")
    .optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserFormInput = z.infer<typeof updateUserSchema>;

export const systemSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required").max(100),
  organizationName: z.string().min(1, "Organization name is required").max(200),
  contactEmail: z.string().email("Please enter a valid contact email"),
  publicTraceabilityEnabled: z.boolean(),
});

export type SystemSettingsFormInput = z.infer<typeof systemSettingsSchema>;
