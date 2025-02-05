import { KeyPair } from "near-api-js";
import { describe, it, expect } from "vitest";

import {
  hashPayload,
  Payload,
  verifyMessage,
  type KeySignMessageParams,
} from "../src/utils/verify-msg-utils";
describe("verifyMessage", () => {
  const publicKey = "ed25519:6djYMWvkhKMEDCSTQ1LWB3tqLXRD8EX9YPifaTaeh1cb";
  const nonce = "base64EncodedNonce==";
  // Create the payload
  const payload = new Payload({
    message: "Hello World",
    nonce,
    recipient: "recipient.near",
    callbackUrl: "https://example.com/callback",
  });
  const signature =
    "q+8077M6dwQV69zKoIXpR6PTfi7HLLgnIChgoSgh3qzybizDqImfSs/b7DtHjtYpnv5vsW44PrYo0pPsGc3iAA==";
  console.log(signature);

  const mockParams: KeySignMessageParams = {
    message: payload.message,
    nonce,
    publicKey,
    recipient: payload.recipient,
    signature,
    accountId: "sender.near",
    callbackUrl: payload.callbackUrl,
  };
  console.log(mockParams);

  it("should return false when accountIdToVerify does not match accountId", async () => {
    const result = await verifyMessage({
      params: mockParams,
      accountIdToVerify: "different.near",
    });

    expect(result).toBe(false);
  });

  it("should verify signature when accountIds match", async () => {
    const result = await verifyMessage({
      params: mockParams,
      accountIdToVerify: "sender.near",
    });

    expect(result).toBe(true);
  });

  it("should verify signature when no accountIdToVerify is provided", async () => {
    const result = await verifyMessage({
      params: mockParams,
    });

    expect(result).toBe(true);
  });

  it("should return false with invalid signature", async () => {
    const invalidSignature = signature.replace("0", "1");
    const result = await verifyMessage({
      params: {
        ...mockParams,
        signature: invalidSignature,
      },
    });

    expect(result).toBe(false);
  });
});
