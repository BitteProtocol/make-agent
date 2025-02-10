import { describe, it, expect, vi, beforeEach } from "vitest";

import { DEFAULT_PORT } from "../../src/config/constants";
import {
  getDeployedUrl,
  getVercelDeploymentUrl,
} from "../../src/utils/deployed-url";

describe("deployed-url utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  describe("getVercelDeploymentUrl", () => {
    it.each([
      {
        name: "production URL",
        env: {
          VERCEL_ENV: "production",
          VERCEL_PROJECT_PRODUCTION_URL: "my-app.vercel.app",
        },
        expected: "https://my-app.vercel.app",
      },
      {
        name: "preview URL",
        env: {
          VERCEL_ENV: "preview",
          VERCEL_BRANCH_URL: "preview-url.vercel.app",
        },
        expected: "https://preview-url.vercel.app",
      },
      {
        name: "preview URL with fallback",
        env: {
          VERCEL_ENV: "preview",
          VERCEL_URL: "fallback-preview.vercel.app",
        },
        expected: "https://fallback-preview.vercel.app",
      },
      // This one is unusual, but it's a real case
      {
        name: "unrecognized VERCEL_ENV",
        env: {
          VERCEL_ENV: "unrecognized",
          VERCEL_URL: "fallback-preview.vercel.app",
        },
        expected: "http://localhost:3000",
      },
      {
        name: "development URL",
        env: {
          VERCEL_ENV: "development",
          PORT: "4000",
        },
        expected: "http://localhost:4000",
      },
    ])("should return $name", ({ env, expected }) => {
      Object.assign(process.env, env);
      expect(getVercelDeploymentUrl()).toBe(expected);
    });
  });

  describe("getDeployedUrl", () => {
    it.each([
      {
        name: "Vercel",
        env: {
          VERCEL_ENV: "production",
          VERCEL_PROJECT_PRODUCTION_URL: "my-app.vercel.app",
        },
        expected: "https://my-app.vercel.app",
      },
      {
        name: "Netlify",
        env: { URL: "https://my-app.netlify.app" },
        expected: "https://my-app.netlify.app",
      },
      {
        name: "Heroku",
        env: { HEROKU_APP_NAME: "my-heroku-app" },
        expected: "https://my-heroku-app.herokuapp.com",
      },
      {
        name: "AWS Elastic Beanstalk",
        env: { EB_ENVIRONMENT_URL: "http://my-eb-env.elasticbeanstalk.com" },
        expected: "http://my-eb-env.elasticbeanstalk.com",
      },
      {
        name: "Google Cloud Run",
        env: { K_SERVICE: "my-service", K_REVISION: "rev1" },
        expected: "https://my-service-rev1.a.run.app",
      },
      {
        name: "Azure",
        env: { WEBSITE_HOSTNAME: "my-app.azurewebsites.net" },
        expected: "https://my-app.azurewebsites.net",
      },
      {
        name: "DigitalOcean",
        env: { DIGITALOCEAN_APP_URL: "https://my-app.ondigitalocean.app" },
        expected: "https://my-app.ondigitalocean.app",
      },
      {
        name: "Render",
        env: { RENDER_EXTERNAL_URL: "https://my-app.onrender.com" },
        expected: "https://my-app.onrender.com",
      },
      {
        name: "Bitte",
        env: { BITTE_AGENT_URL: "https://my-app.bitte.ai" },
        expected: "https://my-app.bitte.ai",
      },
    ])(
      "should return $name URL when in $name environment",
      ({ env, expected }) => {
        Object.assign(process.env, env);
        expect(getDeployedUrl()).toBe(expected);
      },
    );

    it.each([
      { port: 4000, expected: "http://localhost:4000" },
      { port: undefined, expected: `http://localhost:${DEFAULT_PORT}` },
    ])("should return localhost with $port", ({ port, expected }) => {
      expect(getDeployedUrl(port)).toBe(expected);
    });
  });
});
