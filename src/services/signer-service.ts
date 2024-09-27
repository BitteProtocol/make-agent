import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import open from "open";
import dotenv from "dotenv";
import crypto from "crypto";
import { appendToEnv } from "../utils/file-utils";
import {
  verifyMessage,
  type KeySignMessageParams,
} from "../utils/verify-msg-utils";
import {
  SIGN_MESSAGE,
  SIGN_MESSAGE_PORT,
  SIGN_MESSAGE_URL,
} from "../config/constants";

dotenv.config();

/**
 * Checks if there is a BITTE_KEY in the environment, verifies it, and returns the signed message.
 * @returns {Promise<string | null>} A promise that resolves to the signed message if authenticated, null otherwise.
 */
export async function getAuthentication(
  accountId: string | undefined
): Promise<string | null> {
  const bitteKeyString = process.env.BITTE_KEY;
  if (!bitteKeyString) return null;

  const parsedKey = JSON.parse(bitteKeyString) as KeySignMessageParams;
  if (accountId && (await verifyMessage(parsedKey, accountId))) {
    return bitteKeyString;
  }

  return null;
}
/**
 * Checks if there is a BITTE_KEY in the environment. If not, redirects to Bitte wallet
 * for message signing and stores the signed message as an environment variable.
 * @param {string | undefined} accountId - The account ID to be verified in the message, if provided.
 * @returns {Promise<string | null>} A promise that resolves to the signed message if authenticated or key created, null otherwise.
 */
export async function authenticateOrCreateKey(
  accountId: string | undefined
): Promise<string | null> {
  const authentication = await getAuthentication(accountId);
  if (authentication) {
    console.log("Already authenticated.");
    return authentication;
  }

  if (!accountId) {
    console.log("Account ID is required for authentication.");
    return null;
  }

  console.log("Not authenticated. Redirecting to Bitte wallet for signing...");
  const newKey = await createAndStoreKey(accountId);
  if (newKey) {
    console.log("New key created and stored successfully.");
    return JSON.stringify(newKey);
  } else {
    console.log("Failed to create and store new key.");
    return null;
  }
}

async function createAndStoreKey(
  accountId: string
): Promise<KeySignMessageParams | null> {
  try {
    const signedMessage = await getSignedMessage();
    if (signedMessage && (await verifyMessage(signedMessage, accountId))) {
      await appendToEnv("BITTE_KEY", JSON.stringify(signedMessage));
      return signedMessage;
    }
  } catch (error) {
    console.error("Error creating and storing key:", error);
  }
  return null;
}

function getSignedMessage(): Promise<KeySignMessageParams> {
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);

    server.listen(SIGN_MESSAGE_PORT, () => {  
      const callbackUrl = `http://localhost:${SIGN_MESSAGE_PORT}`;
      const nonce = crypto.randomBytes(16).toString("hex");
      const signUrl = `${SIGN_MESSAGE_URL}?message=${encodeURIComponent(
        SIGN_MESSAGE
      )}&callbackUrl=${encodeURIComponent(
        callbackUrl
      )}&nonce=${encodeURIComponent(nonce)}&postEndpoint=${encodeURIComponent(
        callbackUrl
      )}`;
      open(signUrl).catch((error) => {
        console.error("Failed to open the browser:", error);
        server.close();
        reject(error);
      });
    });

    function handleRequest(req: IncomingMessage, res: ServerResponse) {
      setCORSHeaders(res);

      if (req.method === "OPTIONS") {
        handlePreflight(res);
        return;
      }

      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const jsonBody = JSON.parse(body);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Signed message received" }));
            resolve(jsonBody);
            server.close(() => console.log("Temporary server closed"));
          } catch (error) {
            console.error("Error parsing JSON:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            reject(error);
          }
        });
      } else {
        handleInvalidMethod(res, reject);
      }
    }
  });
}

function setCORSHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function handlePreflight(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

function handleInvalidMethod(
  res: ServerResponse,
  reject: (reason: any) => void
): void {
  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method Not Allowed" }));
  reject(new Error("Method Not Allowed"));
}
