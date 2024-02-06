import {
  beginCell,
  MessageRelaxed,
  SendMode,
  storeMessageRelaxed,
  DictionaryValue,
  loadMessageRelaxed,
} from "@ton/core";

export const HighloadWalletDictionaryValue: DictionaryValue<{
  sendMode: SendMode
  message: MessageRelaxed
}> = {
  serialize(src, builder) {
    builder.storeUint(src.sendMode, 8);
    builder.storeRef(beginCell().store(storeMessageRelaxed(src.message)));
  },
  parse(src) {
    const sendMode = src.loadUint(8);
    const message = loadMessageRelaxed(src.loadRef().beginParse());
    return { sendMode, message };
  },
};
