import crypto from "crypto";
import dotenv from "dotenv";
import { createServer, IncomingMessage, ServerResponse } from "http";
import open from "open";

import type { BitteUrls } from "../config/constants";
import {
  BITTE_KEY_ENV_KEY,
  SIGN_MESSAGE,
  SIGN_MESSAGE_PORT,
} from "../config/constants";
import { appendToEnv } from "../utils/file-utils";
import {
  verifyMessage,
  type KeySignMessageParams,
} from "../utils/verify-msg-utils";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

export class AuthenticationService {
  private readonly bitteUrls: BitteUrls;

  constructor(bitteUrls: BitteUrls) {
    this.bitteUrls = bitteUrls;
  }

  async getAuthentication(accountId?: string): Promise<string | null> {
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

  async authenticateOrCreateKey(): Promise<string | null> {
    const authentication = await this.getAuthentication();
    if (authentication) {
      console.log("Already authenticated.");
      return authentication;
    }

    console.log(
      "Not authenticated. Redirecting to Bitte wallet for signing...",
    );
    const newKey = await this.createAndStoreKey();
    if (newKey) {
      console.log("New key created and stored successfully.");
      return JSON.stringify(newKey);
    } else {
      console.log("Failed to create and store new key.");
      return null;
    }
  }

  async getSignedMessage(): Promise<KeySignMessageParams> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) =>
        this.handleRequest(req, res, resolve, reject, server),
      );

      server.listen(SIGN_MESSAGE_PORT, () => {
        const postEndpoint = `http://localhost:${SIGN_MESSAGE_PORT}`;
        const nonce = crypto.randomBytes(16).toString("hex");
        const signUrl = `${
          this.bitteUrls.SIGN_MESSAGE_URL
        }?message=${encodeURIComponent(
          SIGN_MESSAGE,
        )}&callbackUrl=${encodeURIComponent(
          this.bitteUrls.SIGN_MESSAGE_SUCCESS_URL,
        )}&nonce=${encodeURIComponent(nonce)}&postEndpoint=${encodeURIComponent(
          postEndpoint,
        )}`;
        open(signUrl).catch((error) => {
          console.error("Failed to open the browser:", error);
          server.close();
          reject(error);
        });
      });
    });
  }

  private async createAndStoreKey(): Promise<KeySignMessageParams | null> {
    try {
      const signedMessage = await this.getSignedMessage();
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

  private handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    resolve: (value: KeySignMessageParams) => void,
    reject: (reason: Error) => void,
    server: ReturnType<typeof createServer>,
  ): void {
    this.setCORSHeaders(res);

    if (req.method === "OPTIONS") {
      this.handlePreflight(res);
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
          reject(error as Error);
        }
      });
    } else {
      this.handleInvalidMethod(res, reject);
    }
  }

  private setCORSHeaders(res: ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  private handlePreflight(res: ServerResponse): void {
    res.writeHead(204);
    res.end();
  }

  private handleInvalidMethod(
    res: ServerResponse,
    reject: (reason: Error) => void,
  ): void {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    reject(new Error("Method Not Allowed"));
  }
}
