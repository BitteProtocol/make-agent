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

  const mockParams: KeySignMessageParams = {
    message: payload.message,
    nonce,
    publicKey,
    recipient: payload.recipient,
    signature,
    accountId: "sender.near",
    callbackUrl: payload.callbackUrl,
  };

  it("should return false when accountIdToVerify does not match accountId", () => {
    const result = verifyMessage({
      params: mockParams,
      accountIdToVerify: "different.near",
    });

    expect(result).toBe(false);
  });

  it("should verify signature when accountIds match", () => {
    const result = verifyMessage({
      params: mockParams,
      accountIdToVerify: "sender.near",
    });

    expect(result).toBe(true);
  });

  it("should verify signature when no accountIdToVerify is provided", async () => {
    const result = verifyMessage({
      params: mockParams,
    });

    expect(result).toBe(true);
  });

  it("should return false with invalid signature", () => {
    const result = verifyMessage({
      params: {
        ...mockParams,
        // Invalid signature
        signature: signature.replace("0", "1"),
      },
    });

    expect(result).toBe(false);
  });
});

describe("hashPayload", () => {
  it("should deterministically hash the same payload", () => {
    const payload = new Payload({
      message: "Hello World",
      nonce: "base64EncodedNonce==",
      recipient: "recipient.near",
      callbackUrl: "https://example.com/callback",
    });
    const result = hashPayload(payload);
    expect(result).toStrictEqual(new Uint8Array([
      121,  19,   8,  79, 179,  10, 206,   2,
      107,   0, 134,  57,  44, 188, 164, 233,
      148, 144, 233, 129, 124, 106, 220, 166,
      102,  71, 171, 204, 149, 213,  42,  54
    ]));
  });
});
