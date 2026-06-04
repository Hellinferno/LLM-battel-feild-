import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { safeErrorMessage } from "@/lib/security/secret-redaction";

export function apiError(error: unknown, status = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: error.issues.map((issue) => issue.message).join(", ")
        }
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: status >= 500 ? "internal_error" : "request_error",
        message: safeErrorMessage(error)
      }
    },
    { status }
  );
}

