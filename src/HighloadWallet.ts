import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  internal,
  MessageRelaxed,
  Sender,
  SendMode,
} from "ton-core";
import { Maybe } from "ton-core/dist/utils/maybe";
import { createHighloadWalletTransfer } from "./signing/createWalletTransfer";

export class HighloadWalletContract implements Contract {
  /**
   * Create instance
   */
  static create(args: { workchain: number, publicKey: Buffer, walletId?: Maybe<number> }) {
    return new HighloadWalletContract(args.workchain, args.publicKey, args.walletId);
  }

  readonly workchain: number;
  readonly publicKey: Buffer;
  readonly address: Address;
  readonly walletId: number;
  readonly init: { data: Cell, code: Cell };

  private constructor(workchain: number, publicKey: Buffer, walletId?: Maybe<number>) {
    // Resolve parameters
    this.workchain = workchain;
    this.publicKey = publicKey;
    if (walletId !== null && walletId !== undefined) {
      this.walletId = walletId;
    } else {
      this.walletId = 698983191 + workchain; // ask this code
    }

    // Build initial code and data
    const code = Cell.fromBoc(Buffer.from("B5EE9C72410108010097000114FF00F4A413F4BCF2C80B010201200203020148040500B8F28308D71820D31FD31FD31F02F823BBF263ED44D0D31FD31FD3FFD15132BAF2A15144BAF2A204F901541055F910F2A3F404D1F8007F8E16218010F4786FA5209802D307D43001FB009132E201B3E65B01A4C8CB1FCB1FCBFFC9ED540004D03002014806070017BB39CED44D0D33F31D70BFF80011B8C97ED44D0D70B1F8BD6A0D31", "hex"))[0];
    const data = beginCell()
      .storeUint(0, 32) // seqno
      .storeUint(this.walletId, 32) // subwallet_id
      .storeBuffer(this.publicKey) // public_key
      .endCell();

    this.init = { code, data };
    this.address = contractAddress(workchain, { code, data });
  }

  /**
   * Get wallet balance
   */
  async getBalance(provider: ContractProvider) {
    const state = await provider.getState();
    return state.balance;
  }


  /**
   * Get wallet seqno
   */
  async getSeqno(provider: ContractProvider) {
    const state = await provider.getState();
    if (state.state.type === "active") {
      const result = await provider.get("seqno", []);
      return result.stack.readNumber();
    } else {
      return 0;
    }
  }

  /**
   * Get wallet public key
   */
  async getPublicKey(provider: ContractProvider) {
    const result = await provider.get("get_public_key", []);
    return result.stack.readBigNumber().toString(16);
  }

  /**
   * Send signed transfer
   */
  async send(provider: ContractProvider, message: Cell) {
    await provider.external(message);
  }

  /**
   * Sign and send transfer
   */
  async sendTransfer(provider: ContractProvider, args: {
    seqno: number,
    secretKey: Buffer,
    messages: MessageRelaxed[],
    sendMode?: Maybe<SendMode>,
    timeout?: Maybe<number>
  }) {
    const transfer = this.createTransfer(args);
    await this.send(provider, transfer);
  }

  /**
   * Create transfer
   */
  createTransfer(args: {
    seqno: number,
    secretKey: Buffer,
    messages: MessageRelaxed[],
    sendMode?: Maybe<SendMode>,
    timeout?: Maybe<number>,
  }) {
    let sendMode = SendMode.PAY_GAS_SEPARATELY;
    if (args.sendMode !== null && args.sendMode !== undefined) {
      sendMode = args.sendMode;
    }

    return createHighloadWalletTransfer({
      seqno: args.seqno,
      sendMode,
      secretKey: args.secretKey,
      messages: args.messages,
      walletId: this.walletId,
      timeout: args.timeout,
    });
  }

  /**
   * Create sender
   */
  sender(provider: ContractProvider, secretKey: Buffer): Sender {
    return {
      send: async (args) => {
        const seqno = await this.getSeqno(provider);
        const transfer = this.createTransfer({
          seqno,
          secretKey,
          sendMode: args.sendMode,
          messages: [internal({
            to: args.to,
            value: args.value,
            init: args.init,
            body: args.body,
            bounce: args.bounce
          })]
        });
        await this.send(provider, transfer);
      }
    };
  }
}
