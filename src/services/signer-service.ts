import crypto from "crypto";
import dotenv from "dotenv";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import open from "open";

import {
  BITTE_KEY_ENV_KEY,
  SIGN_MESSAGE,
  SIGN_MESSAGE_PORT,
  type BitteUrls,
} from "../config/constants";
import { appendToEnv } from "../utils/file-utils";
import {
  verifyMessage,
  type KeySignMessageParams,
} from "../utils/verify-msg-utils";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

/**
 * Checks if there is a BITTE_KEY in the environment, verifies it, and returns the signed message.
 * If no accountId is given, no verification is made and the signed message (if created) is returned.
 * @returns {Promise<string | null>} A promise that resolves to the signed message if authenticated, null otherwise.
 */
export async function getAuthentication(
  accountId?: string,
): Promise<string | null> {
  const bitteKeyString = process.env.BITTE_KEY;
  if (!bitteKeyString) return null;

  const parsedKey = JSON.parse(bitteKeyString) as KeySignMessageParams;
  if (
    (accountId &&
      (await verifyMessage({
        params: parsedKey,
        accountIdToVerify: accountId,
      }))) ||
    !accountId
  ) {
    return bitteKeyString;
  }

  return null;
}
/**
 * Checks if there is a BITTE_KEY in the environment. If not, redirects to Bitte wallet
 * for message signing and stores the signed message as an environment variable.
 * @returns {Promise<string | null>} A promise that resolves to the signed message if authenticated or key created, null otherwise.
 */
export async function authenticateOrCreateKey(
  bitteUrls: BitteUrls,
): Promise<string | null> {
  const authentication = await getAuthentication();
  if (authentication) {
    console.log("Already authenticated.");
    return authentication;
  }

  console.log("Not authenticated. Redirecting to Bitte wallet for signing...");
  const newKey = await createAndStoreKey(bitteUrls);
  if (newKey) {
    console.log("New key created and stored successfully.");
    return JSON.stringify(newKey);
  } else {
    console.log("Failed to create and store new key.");
    return null;
  }
}

async function createAndStoreKey(
  bitteUrls: BitteUrls,
): Promise<KeySignMessageParams | null> {
  try {
    const signedMessage = await getSignedMessage(bitteUrls);
    if (!signedMessage) {
      console.error("Failed to get signed message");
      return null;
    }

    const isVerified = await verifyMessage({ params: signedMessage });
    if (!isVerified) {
      console.warn("Message verification failed");
    }

    await appendToEnv(BITTE_KEY_ENV_KEY, JSON.stringify(signedMessage));
    return signedMessage;
  } catch (error) {
    console.error("Error creating and storing key:", error);
    return null;
  }
}

export function getSignedMessage(
  bitteUrls: BitteUrls,
): Promise<KeySignMessageParams> {
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);

    server.listen(SIGN_MESSAGE_PORT, () => {
      const postEndpoint = `http://localhost:${SIGN_MESSAGE_PORT}`;
      const nonce = crypto.randomBytes(16).toString("hex");
      const signUrl = `${bitteUrls.SIGN_MESSAGE_URL}?message=${encodeURIComponent(
        SIGN_MESSAGE,
      )}&callbackUrl=${encodeURIComponent(
        bitteUrls.SIGN_MESSAGE_SUCCESS_URL,
      )}&nonce=${encodeURIComponent(nonce)}&postEndpoint=${encodeURIComponent(
        postEndpoint,
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
  reject: (reason: any) => void,
): void {
  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method Not Allowed" }));
  reject(new Error("Method Not Allowed"));
}
