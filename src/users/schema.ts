import z from "zod";

export const userSchema = z.object({
	id: z.uuid(),
	username: z.string().min(3),
	email: z.email(),
	password: z.string().min(6),
});

export const createUserSchema = userSchema.omit({ id: true });
export const userResponseSchema = userSchema.omit({ password: true });
export const bulkDeleteUsersSchema = z.object({
	ids: z.array(z.uuid()),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>;


