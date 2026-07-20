const MINIMUM_SECRET_LENGTH = 64;

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const jwtSecret = String(config.JWT_SECRET ?? '');
  const jwtRefreshSecret = String(config.JWT_REFRESH_SECRET ?? '');

  if (jwtSecret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }
  if (jwtRefreshSecret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `JWT_REFRESH_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }
  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  return config;
}
