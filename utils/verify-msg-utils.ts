import * as borsh from "borsh";
import { sha256 } from "js-sha256";
import { utils } from "near-api-js";

export interface KeySignMessageParams {
  message: string;
  nonce: string;
  publicKey: string;
  recipient: string;
  signature: string;
  callbackUrl?: string;
  accountId?: string;
}

export const verifyMessage = async ({
  params,
  accountIdToVerify,
}: {
  params: KeySignMessageParams;
  accountIdToVerify?: string;
}): Promise<boolean> => {
  const {
    message,
    nonce,
    publicKey,
    recipient,
    signature,
    callbackUrl,
    accountId,
  } = params;

  if (accountIdToVerify && accountIdToVerify !== accountId) {
    console.error(
      `Account mismatch: signed message has account ${accountId}, but provided account was ${accountIdToVerify}`,
    );
    return false;
  }

  const payload = new Payload({
    message,
    nonce,
    recipient,
    callbackUrl,
  });
  const hashedPayload = hashPayload(payload);

  return utils.PublicKey.from(publicKey).verify(
    hashedPayload,
    Buffer.from(signature, "base64"),
  );
};

const getNonceBuffer = (nonce: string): Buffer => {
  const nonceLength = 32;

  const buffer = Buffer.from(nonce, "base64");

  if (buffer.length > nonceLength) {
    throw Error("Expected nonce to be a 32 bytes buffer");
  } else if (buffer.length < nonceLength) {
    const padding = Buffer.alloc(nonceLength - buffer.length);
    return Buffer.concat([buffer, padding], nonceLength);
  }

  return buffer;
};

const hashPayload = (payload: Payload): Uint8Array => {
  const borshPayload = borsh.serialize(payloadSchema, payload);
  const prefixNumber = 413 + 2 ** 31;
  const prefixBuffer = new Uint8Array([
    prefixNumber & 0xff,
    (prefixNumber >> 8) & 0xff,
    (prefixNumber >> 16) & 0xff,
    (prefixNumber >> 24) & 0xff,
  ]);
  const message = new Uint8Array(4 + borshPayload.length);
  message.set(prefixBuffer, 0);
  message.set(borshPayload, 4);

  return Uint8Array.from(sha256.array(message));
};

export class Payload {
  message: string;
  nonce: Buffer;
  recipient: string;
  callbackUrl?: string;

  constructor(args: {
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
  }) {
    this.message = args.message;
    this.nonce = getNonceBuffer(args.nonce);
    this.recipient = args.recipient;
    if (args.callbackUrl) {
      this.callbackUrl = args.callbackUrl;
    }
  }
}

const payloadSchema = new Map([
  [
    Payload,
    {
      kind: "struct",
      fields: [
        ["message", "string"],
        ["nonce", [32]],
        ["recipient", "string"],
        ["callbackUrl", { kind: "option", type: "string" }],
      ],
    },
  ],
]);
