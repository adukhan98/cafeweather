export type FieldErrors = Record<string, string[]>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
  }
}

export function errorResponse(error: HttpError, requestId: string): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        requestId,
      },
    },
    { status: error.status },
  );
}
