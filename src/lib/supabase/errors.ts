type ErrorLike = { code?: unknown; message?: unknown };

const friendlyMessages: Record<string, string> = {
  invalid_credentials: "El correo o la contraseña no son correctos.",
  email_not_confirmed: "Debes verificar tu correo antes de iniciar sesión.",
  user_already_exists: "Ya existe una cuenta con este correo.",
  over_email_send_rate_limit: "Espera unos minutos antes de solicitar otro correo.",
  "23505": "Ya existe un registro con esos datos.",
  "23503": "El registro está relacionado con otros datos.",
  "42501": "No tienes permisos para realizar esta operación.",
};

export class AppError extends Error {
  constructor(
    message: string,
    readonly code = "unknown",
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(cause: unknown, fallback: string) {
  if (cause instanceof AppError) return cause;
  const candidate = cause && typeof cause === "object" ? (cause as ErrorLike) : null;
  const code = typeof candidate?.code === "string" ? candidate.code : "unknown";
  const sourceMessage = typeof candidate?.message === "string" ? candidate.message : null;
  return new AppError(friendlyMessages[code] ?? sourceMessage ?? fallback, code, cause);
}
