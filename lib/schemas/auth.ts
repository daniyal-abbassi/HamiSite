import { z } from "zod";

export const loginSchema = z.object({
  /** Username OR phone number. Trimmed — mobile keyboards love a trailing space. */
  identifier: z.string().trim().min(3).max(50),
  password: z.string().min(1).max(100),
});
