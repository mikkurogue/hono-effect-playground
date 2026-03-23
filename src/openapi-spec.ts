import type { OpenAPIV3 } from "openapi-types";

export const apiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "My API",
    version: "1.0.0",
    description: "Hono + Effect playground API",
  },
  paths: {
    "/": {
      get: {
        summary: "Health check",
        operationId: "getRoot",
        tags: ["General"],
        responses: {
          "200": {
            description: "Returns a greeting",
            content: { "text/plain": { schema: { type: "string", example: "Hello Hono!" } } },
          },
        },
      },
    },
    "/users": {
      get: {
        summary: "List all users",
        operationId: "getUsers",
        tags: ["Users"],
        responses: {
          "200": {
            description: "A list of users",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/UserResponse" } },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        summary: "Create a user",
        operationId: "createUser",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateUserInput" } },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "User already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/users/{id}": {
      get: {
        summary: "Get a user by ID",
        operationId: "getUserById",
        tags: ["Users"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "The user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } },
          },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      delete: {
        summary: "Delete a user by ID",
        operationId: "deleteUserById",
        tags: ["Users"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "User deleted" },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/users/bulk": {
      delete: {
        summary: "Bulk delete users",
        operationId: "bulkDeleteUsers",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkDeleteInput" },
            },
          },
        },
        responses: {
          "204": { description: "Users deleted" },
          "404": { description: "Users not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/repositories/search": {
      post: {
        summary: "Search repositories",
        operationId: "searchRepositories",
        tags: ["Repositories"],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RepositoryFilter" } },
          },
        },
        responses: {
          "200": {
            description: "Matching repositories",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/RepositoryResponse" } },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/repositories": {
      post: {
        summary: "Create a repository",
        operationId: "createRepository",
        tags: ["Repositories"],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateRepositoryInput" } },
          },
        },
        responses: {
          "201": {
            description: "Repository created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    repository: { $ref: "#/components/schemas/RepositoryResponse" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Owner not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/repositories/{id}": {
      get: {
        summary: "Get a repository by ID",
        operationId: "getRepositoryById",
        tags: ["Repositories"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "The repository",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RepositoryResponse" } } },
          },
          "404": { description: "Repository not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      delete: {
        summary: "Delete a repository by ID",
        operationId: "deleteRepositoryById",
        tags: ["Repositories"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Repository deleted" },
          "404": { description: "Repository not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/repositories/bulk": {
      delete: {
        summary: "Bulk delete repositories",
        operationId: "bulkDeleteRepositories",
        tags: ["Repositories"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkDeleteInput" },
            },
          },
        },
        responses: {
          "204": { description: "Repositories deleted" },
          "404": { description: "Repositories not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
  },

  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
      UserResponse: {
        type: "object",
        required: ["id", "username", "email"],
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string", minLength: 3 },
          email: { type: "string", format: "email" },
        },
      },
      CreateUserInput: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      RepositoryResponse: {
        type: "object",
        required: ["id", "name", "owner"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", minLength: 1 },
          owner: { type: "string", format: "uuid" },
        },
      },
      CreateRepositoryInput: {
        type: "object",
        required: ["name", "owner"],
        properties: {
          name: { type: "string", minLength: 1 },
          owner: { type: "string", format: "uuid" },
        },
      },
      RepositoryFilter: {
        type: "object",
        properties: {
          owner: { type: "string", format: "uuid" },
          name: { type: "string" },
        },
      },
      BulkDeleteInput: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string", format: "uuid" } },
        },
      },
    },
  },
};
