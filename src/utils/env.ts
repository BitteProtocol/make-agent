/**
 * Validates required environment variables for the playground
 * @throws Error if required environment variables are missing
 */
export function validateEnv(): void {
  const requiredEnvVars = ["BITTE_API_KEY"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please ensure these are set in your .env file",
    );
  }
}
