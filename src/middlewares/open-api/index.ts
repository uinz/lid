import { TSchema } from "@sinclair/typebox";
import { HTTPMethod } from "find-my-way";

interface Info {
  title: string;
  version: `${number}.${number}.${number}`;
}

interface Schemas {
  query: TSchema;
  body: TSchema;
  response: TSchema;
}

export function openAPI(info: Info) {
  return (method: HTTPMethod, path: string, type: string, schemas: Schemas) => {
    return {
      openapi: "3.1.0",
      info,
      webhooks: {
        newPet: {
          post: {
            requestBody: {
              description: "Information about a new pet in the system",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
            responses: {
              "200": {
                description:
                  "Return a 200 status to indicate that the data was received successfully",
              },
            },
          },
        },
      },
    };
  };
}
