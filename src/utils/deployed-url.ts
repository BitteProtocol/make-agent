export const {
  VERCEL_ENV,
  VERCEL_URL,
  VERCEL_BRANCH_URL,
  VERCEL_PROJECT_PRODUCTION_URL,
} = process.env;

export const VERCEL_DEPLOYMENT_URL = (() => {
  switch (VERCEL_ENV) {
    case "production":
      return `https://${VERCEL_PROJECT_PRODUCTION_URL}`;
    case "preview":
      return `https://${VERCEL_BRANCH_URL || VERCEL_URL}`;
    default:
      return "http://localhost:3000";
  }
})();

const getDeployedUrl = (): string => {
  // Vercel
  if (VERCEL_ENV) {
    return VERCEL_DEPLOYMENT_URL;
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
  return "http://localhost:3000";
};

export const deployedUrl = getDeployedUrl();
