import { ApiReference } from "@scalar/nextjs-api-reference";
import baseSpec from "@/lib/swagger/openapi.json";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export const GET = ApiReference({
  content: {
    ...baseSpec,
    servers: [
      {
        url: apiBaseUrl || "/",
        description: apiBaseUrl
          ? "API server (NEXT_PUBLIC_API_URL)"
          : "Current server",
      },
    ],
  },
});
