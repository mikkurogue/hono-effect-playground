import { Data } from "effect";

export class RepositoryNotFoundError extends Data.TaggedError("RepositoryNotFoundError")<{
  id: string;
}> {}

export class RepositoriesNotFoundError extends Data.TaggedError("RepositoriesNotFoundError")<{}> {}

export class RepositoryValidationError extends Data.TaggedError("RepositoryValidationError")<{
  message: string;
}> {}

export class RepositoryDatabaseError extends Data.TaggedError("RepositoryDatabaseError")<{
  message: string;
}> {}

export class RepositoryOwnerNotFoundError extends Data.TaggedError("RepositoryOwnerNotFoundError")<{
  owner: string;
}> {}
