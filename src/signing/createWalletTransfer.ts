import { beginCell, Dictionary, MessageRelaxed, SendMode } from "@ton/core";
import { sign } from "@ton/crypto";
import { Maybe } from "@ton/core/dist/utils/maybe";
import { HighloadWalletDictionaryValue } from "../types/HighloadWalletDictionaryValue";
import { HighloadWalletContractV2 } from "../HighloadWalletV2";

export function createHighloadWalletTransfer(args: {
  seqno: number,
  secretKey: Buffer,
  sendMode: SendMode,
  walletId: number,
  messages: MessageRelaxed[],
  timeout?: Maybe<number>
}) {
  if (args.messages.length > 254) {
    throw Error("Maximum number of messages is 254");
  }

  // Create message
  const signingMessage = beginCell()
    .storeUint(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // default timeout: 60 seconds
  }
  signingMessage.storeUint(args.seqno, 32);

  const dictBuilder = Dictionary.empty(Dictionary.Keys.Int(16), HighloadWalletDictionaryValue);
  for (let i = 0; i < args.messages.length; i++) {
    const message = args.messages[i];

    dictBuilder.set(i, {
      sendMode: args.sendMode,
      message,
    });
  }
  signingMessage.storeDict(dictBuilder);

  // Sign message
  const signature = sign(signingMessage.endCell().hash(), args.secretKey);

  // Body
  const body = beginCell()
    .storeBuffer(signature)
    .storeBuilder(signingMessage)
    .endCell();

  return body;
}

export function createHighloadWalletTransferV2(args: {
  secretKey: Buffer,
  sendMode: SendMode,
  walletId: number,
  messages: MessageRelaxed[],
  timeout?: Maybe<number>
}) {
  if (args.messages.length > 254) {
    throw Error("Maximum number of messages is 254");
  }

  // Generate queryId
  const queryId = HighloadWalletContractV2.generateQueryId(args.timeout || 60); // default timeout: 60 seconds

  // Create message
  const signingMessage = beginCell()
    .storeUint(args.walletId, 32)
    .storeUint(queryId, 64);

  const dictBuilder = Dictionary.empty(Dictionary.Keys.Int(16), HighloadWalletDictionaryValue);
  for (let i = 0; i < args.messages.length; i++) {
    const message = args.messages[i];

    dictBuilder.set(i, {
      sendMode: args.sendMode,
      message,
    });
  }
  signingMessage.storeDict(dictBuilder);

  // Sign message
  const signature = sign(signingMessage.endCell().hash(), args.secretKey);

  // Body
  const body = beginCell()
    .storeBuffer(signature)
    .storeBuilder(signingMessage)
    .endCell();

  return { body, queryId };
}
