/**
 * Validates required environment variables for the playground
 * @throws Error if required environment variables are missing
 */
export function validateEnv() {
  const requiredEnvVars = ["BITTE_API_KEY", "BITTE_API_URL"];

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
