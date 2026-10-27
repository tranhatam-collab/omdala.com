type DbErrorKind = "timeout" | "unavailable" | "constraint" | "unknown";

type DbErrorParams = {
  kind: DbErrorKind;
  message: string;
  sqlState: string | undefined;
  operation: string | undefined;
};

export class DbQueryError extends Error {
  kind: DbErrorKind;
  sqlState: string | undefined;
  operation: string | undefined;

  constructor(params: DbErrorParams) {
    super(params.message);
    this.name = "DbQueryError";
    this.kind = params.kind;
    this.sqlState = params.sqlState;
    this.operation = params.operation;
  }
}

type PgLikeError = {
  code?: string;
  message?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getSqlState(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const code = (error as PgLikeError).code;
  return typeof code === "string" ? code : undefined;
}

function isTimeoutError(
  sqlState: string | undefined,
  message: string,
): boolean {
  if (sqlState === "57014") {
    return true;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("etimedout") ||
    normalized.includes("statement timeout")
  );
}

function isUnavailableError(
  sqlState: string | undefined,
  message: string,
): boolean {
  if (
    (sqlState && sqlState.startsWith("08")) ||
    sqlState === "57P03" ||
    sqlState === "53300"
  ) {
    return true;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("could not connect") ||
    normalized.includes("connection terminated") ||
    normalized.includes("server closed the connection")
  );
}

function isConstraintError(sqlState: string | undefined): boolean {
  return Boolean(sqlState && sqlState.startsWith("23"));
}

function withOptionalState<T extends object>(
  payload: T,
  sqlState: string | undefined,
): T & { sqlState?: string } {
  if (!sqlState) {
    return payload;
  }
  return { ...payload, sqlState };
}

export function toDbQueryError(
  error: unknown,
  operation?: string,
): DbQueryError {
  if (error instanceof DbQueryError) {
    if (operation && !error.operation) {
      return new DbQueryError({
        kind: error.kind,
        message: error.message,
        sqlState: error.sqlState,
        operation,
      });
    }
    return error;
  }

  const message = getErrorMessage(error);
  const sqlState = getSqlState(error);

  if (isTimeoutError(sqlState, message)) {
    return new DbQueryError({
      kind: "timeout",
      message,
      sqlState,
      operation,
    });
  }

  if (isUnavailableError(sqlState, message)) {
    return new DbQueryError({
      kind: "unavailable",
      message,
      sqlState,
      operation,
    });
  }

  if (isConstraintError(sqlState)) {
    return new DbQueryError({
      kind: "constraint",
      message,
      sqlState,
      operation,
    });
  }

  return new DbQueryError({
    kind: "unknown",
    message,
    sqlState,
    operation,
  });
}

export function mapDbErrorToHttp(error: unknown): {
  status: 422 | 500 | 502 | 504;
  errorCode: string;
  message: string;
  sqlState?: string;
} {
  const normalized = toDbQueryError(error);

  if (normalized.kind === "timeout") {
    return withOptionalState(
      {
        status: 504,
        errorCode: "DATABASE_TIMEOUT",
        message: "Database request timed out",
      },
      normalized.sqlState,
    );
  }

  if (normalized.kind === "unavailable") {
    return withOptionalState(
      {
        status: 502,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Database connection unavailable",
      },
      normalized.sqlState,
    );
  }

  if (normalized.kind === "constraint") {
    if (normalized.sqlState === "23503") {
      return withOptionalState(
        {
          status: 422,
          errorCode: "DATABASE_CONSTRAINT_FOREIGN_KEY",
          message: "Referenced record does not exist",
        },
        normalized.sqlState,
      );
    }

    if (normalized.sqlState === "23505") {
      return withOptionalState(
        {
          status: 422,
          errorCode: "DATABASE_CONSTRAINT_UNIQUE",
          message: "Duplicate value violates unique constraint",
        },
        normalized.sqlState,
      );
    }

    return withOptionalState(
      {
        status: 422,
        errorCode: "DATABASE_CONSTRAINT_VIOLATION",
        message: "Database constraint violation",
      },
      normalized.sqlState,
    );
  }

  return withOptionalState(
    {
      status: 500,
      errorCode: "INTERNAL_ERROR",
      message: "Unexpected server error",
    },
    normalized.sqlState,
  );
}
