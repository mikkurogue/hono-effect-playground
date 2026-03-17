import z from "zod";

export const repositorySchema = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	owner: z.uuid(),
});

export const createRepositorySchema = repositorySchema.omit({ id: true });
export const repositoryResponseSchema = repositorySchema;
export const bulkDeleteRepositoriesSchema = z.object({
	ids: z.array(z.uuid()),
});

export const repositoryFilterSchema = z.object({
	owner: z.uuid().optional(),
	name: z.string().optional(),
});

export type Repository = z.infer<typeof repositorySchema>;
export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
export type RepositoryResponse = z.infer<typeof repositoryResponseSchema>;
export type RepositoryFilter = z.infer<typeof repositoryFilterSchema>;
export type BulkDeleteRepositoriesInput = z.infer<
	typeof bulkDeleteRepositoriesSchema
>;

