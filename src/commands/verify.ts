import { Command } from "commander";

//import { authenticateWithGithub } from "../services/github";
//import { PluginService } from "../services/plugin";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getHostname, getSpecUrl } from "../utils/url-utils";
import { getGithubLink } from "@typescript/github-link";

export const verifyCommand = new Command()
  .name("verify")
  .description("Request verification of your deployed AI agent plugin")
  .requiredOption("-u, --url <url>", "Specify the URL where the plugin is deployed")
  .action(async (options) => {
    //const pluginService = new PluginService();
    const url = options.url;

    const pluginId = getHostname(url);
    const specUrl = getSpecUrl(url);
    const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

    console.log(`isValid ${isValid}; accountId ${accountId}; pluginId ${pluginId}`);


    if (!isValid) {
      console.error("OpenAPI specification validation failed.");
      return;
    }

    if (!accountId) {
      console.error("Failed to parse account ID from OpenAPI specification.");
      return;
    }

    // try {
    //   const githubToken = await authenticateWithGithub();
    //   if (!githubToken) {
    //     console.error("GitHub authentication failed");
    //   }
    //   await pluginService.verify(pluginId, accountId, githubToken);

    // } catch (error) {
    //   console.error("Authentication failed");
    // }
    const githubLink = await getGithubLink("");
    console.log(githubLink);
    

    const githubPAT = process.env.GITHUB_PAT;
    const repos = await fetch("https://api.github.com/user/repos", {
      method: "GET",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${githubPAT}`,
        "X-GitHub-Api-Version": "2022-11-28",
      }
    });
    //console.log(await repos.json());
    
  });