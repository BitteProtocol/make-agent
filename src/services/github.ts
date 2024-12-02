import open from "open";


export async function authenticateWithGithub(): Promise<string> {
  // First, request a device code
  const deviceCodeResponse = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: "YOUR_CLIENT_ID",
      scope: "repo"
    })
  });

  const { device_code, user_code, verification_uri } = await deviceCodeResponse.json();

  // Show instructions to user
  console.log("\nPlease enter the following code at %s", verification_uri);
  console.log("User code: %s", user_code);
  
  // Optional: open the verification URL in the browser
  await open(verification_uri);

  // Poll for the token
  while (true) {
    try {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: "YOUR_CLIENT_ID",
          device_code,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code"
        })
      });

      const data = await tokenResponse.json();
      
      if (data.error === "authorization_pending") {
        // Wait and try again
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      if (data.access_token) {
        return data.access_token;
      }

      throw new Error("Authentication failed");
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  }
}