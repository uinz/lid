import { HTTPMethod } from "@lid-http/core";
import { TSchema } from "@sinclair/typebox";

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
  return (_method: HTTPMethod, _path: string, _type: string, _schemas: Schemas) => {
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
