import { z } from "zod";
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"), 
});

const validationResult = registerSchema.safeParse({});
if (!validationResult.success) {
    console.log(validationResult.error.errors);
    console.log(validationResult.error.issues);
}
