import { DEFAULT_PORT } from "../config/constants";

export function getVercelDeploymentUrl(): string {
  switch (process.env.VERCEL_ENV) {
    case "production":
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    case "preview":
      return `https://${process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL}`;
    case "development":
      return `http://localhost:${process.env.PORT || DEFAULT_PORT}`;
    default:
      console.warn(
        `Unrecognized VERCEL_ENV=${process.env.VERCEL_ENV} using fallback url (localhost)`,
      );
      return `http://localhost:${process.env.PORT || DEFAULT_PORT}`;
  }
}

export const getDeployedUrl = (port?: number): string => {
  // Vercel
  if (process.env.VERCEL_ENV) {
    return getVercelDeploymentUrl();
  }

  // Netlify
  if (process.env.URL) {
    return process.env.URL;
  }

  // Heroku
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }

  // AWS Elastic Beanstalk
  if (process.env.EB_ENVIRONMENT_URL) {
    return process.env.EB_ENVIRONMENT_URL;
  }

  // Google Cloud Run
  if (process.env.K_SERVICE && process.env.K_REVISION) {
    return `https://${process.env.K_SERVICE}-${process.env.K_REVISION}.a.run.app`;
  }

  // Azure App Service
  if (process.env.WEBSITE_HOSTNAME) {
    return `https://${process.env.WEBSITE_HOSTNAME}`;
  }

  // DigitalOcean App Platform
  if (process.env.DIGITALOCEAN_APP_URL) {
    return process.env.DIGITALOCEAN_APP_URL;
  }

  // Render
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }

  // Bitte Env
  if (process.env.BITTE_AGENT_URL) {
    return process.env.BITTE_AGENT_URL;
  }

  // Fallback to localhost if no deployment URL is found
  return `http://localhost:${port || DEFAULT_PORT}`;
};

export const deployedUrl = getDeployedUrl();
