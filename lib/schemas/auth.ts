import { z } from "zod";
export const signupSchema = z.object({
  email: z.email("Enter a valid email").trim().min(1, "Email is required"),
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(64, "Username must be at most 64 characters")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
      "Use only letters, numbers and . _ - (must start with a letter or number)",
    ),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type SignupSchema = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.email("Enter a valid email").trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type SigninSchema = z.infer<typeof signinSchema>;

export const codeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});
export type CodeSchema = z.infer<typeof codeSchema>;
