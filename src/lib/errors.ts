import { Data } from "effect";

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string;
  id: string;
}> {}

export class EntitiesNotFoundError extends Data.TaggedError("EntitiesNotFoundError")<{
  entity: string;
}> {}

export class AlreadyExistsError extends Data.TaggedError("AlreadyExistsError")<{
  entity: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  entity: string;
  message: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  entity: string;
  message: string;
}> {}

export class RelationNotFoundError extends Data.TaggedError("RelationNotFoundError")<{
  entity: string;
  relation: string;
  id: string;
}> {}
