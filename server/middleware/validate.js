import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    return res.status(400).json({ message: 'Invalid request payload.' });
  }
};

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().optional(),
  inviteToken: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  discount: z.number().optional().default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().optional(),
    description: z.string().min(1, "Item description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    rate: z.number().min(0, "Rate cannot be negative"),
    tax: z.number().min(0, "Tax cannot be negative").default(0)
  })).min(1, "At least one item is required")
});
