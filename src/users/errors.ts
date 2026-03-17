import { Data } from "effect";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  id: string;
}> {}

export class UsersNotFoundError extends Data.TaggedError("UsersNotFoundError")<{}> {}

export class UserAlreadyExistsError extends Data.TaggedError("UserAlreadyExistsError")<{}> {}

export class UserValidationError extends Data.TaggedError("UserValidationError")<{
  message: string;
}> {}

export class UserDatabaseError extends Data.TaggedError("UserDatabaseError")<{
  message: string;
}> {}
