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
  Dictionary,
  toNano,
} from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";
import { HighloadWalletDictionaryValue } from "./types/HighloadWalletDictionaryValue";
import { createHighloadWalletTransferV2 } from "./signing/createWalletTransfer";

export class HighloadWalletContractV2 implements Contract {
  /**
   * Create instance
   */
  static create(args: { workchain: number, publicKey: Buffer, walletId?: Maybe<number> }) {
    return new HighloadWalletContractV2(args.workchain, args.publicKey, args.walletId);
  }

  /**
   * Generate query id
   */
  static generateQueryId(timeout: number, randomId?: number) {
    const now = Math.floor(Date.now() / 1000);
    const random = randomId || Math.floor(Math.random() * Math.pow(2, 30));

    return (BigInt(now + timeout) << 32n) | BigInt(random);
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
    const code = Cell.fromBoc(Buffer.from("B5EE9C724101090100E5000114FF00F4A413F4BCF2C80B010201200203020148040501EAF28308D71820D31FD33FF823AA1F5320B9F263ED44D0D31FD33FD3FFF404D153608040F40E6FA131F2605173BAF2A207F901541087F910F2A302F404D1F8007F8E16218010F4786FA5209802D307D43001FB009132E201B3E65B8325A1C840348040F4438AE63101C8CB1F13CB3FCBFFF400C9ED54080004D03002012006070017BD9CE76A26869AF98EB85FFC0041BE5F976A268698F98E99FE9FF98FA0268A91040207A0737D098C92DBFC95DD1F140034208040F4966FA56C122094305303B9DE2093333601926C21E2B39F9E545A", "hex"))[0];
    const data = beginCell()
      .storeUint(this.walletId, 32) // subwallet_id
      .storeUint(0, 64) // last_cleaned
      .storeBuffer(this.publicKey) // public_key
      .storeDict(Dictionary.empty(Dictionary.Keys.Int(16), HighloadWalletDictionaryValue)) // old_queries
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
   * Get wallet public key
   */
  async getPublicKey(provider: ContractProvider) {
    const result = await provider.get("get_public_key", []);
    return result.stack.readBigNumber().toString(16);
  }

  /**
   * Get tx status
   */
  async getProcessed(provider: ContractProvider, queryId: bigint) {
    const result = await provider.get("processed?", [{
      type: "int",
      value: queryId,
    }]);
    return result.stack.readBoolean();
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
    secretKey: Buffer,
    messages: MessageRelaxed[],
    sendMode?: Maybe<SendMode>,
    timeout?: Maybe<number>
  }) {
    const { body, queryId } = this.createTransfer(args);
    await this.send(provider, body);
    return queryId;
  }

  /**
   * Create transfer
   */
  createTransfer(args: {
    secretKey: Buffer,
    messages: MessageRelaxed[],
    sendMode?: Maybe<SendMode>,
    timeout?: Maybe<number>,
  }) {
    let sendMode = SendMode.PAY_GAS_SEPARATELY;
    if (args.sendMode !== null && args.sendMode !== undefined) {
      sendMode = args.sendMode;
    }

    return createHighloadWalletTransferV2({
      sendMode,
      secretKey: args.secretKey,
      messages: args.messages,
      walletId: this.walletId,
      timeout: args.timeout,
    });
  }

  /**
   * Create token transfer body
   */
  createTokenTransferBody(args: {
    toAddress: string,
    responseAddress: string,
    jettonAmount: string,
    forwardAmount?: string,
    forwardPayload?: string
  }): Cell {
    const data = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(toNano(args.jettonAmount))
      .storeAddress(Address.parse(args.toAddress))
      .storeAddress(Address.parse(args.responseAddress))
      .storeBit(false)
      .storeCoins(args.forwardAmount ? toNano(args.forwardAmount) : 0);

    if (args.forwardPayload) {
      data.storeBit(true);
      data.storeRef(
        beginCell()
          .storeUint(0, 32)
          .storeStringTail(args.forwardPayload)
          .endCell()
      );
    } else {
      data.storeBit(false);
    }

    return data.endCell();
  }

  /**
   * Create NFT transfer body
   */
  createNFTTransferBody(args: {
    toAddress: string,
    responseAddress: string,
    forwardAmount?: string,
    forwardPayload?: string
  }): Cell {
    const data = beginCell()
      .storeUint(0x5fcc3d14, 32)
      .storeUint(0, 64)
      .storeAddress(Address.parse(args.toAddress))
      .storeAddress(Address.parse(args.responseAddress))
      .storeBit(false)
      .storeCoins(args.forwardAmount ? toNano(args.forwardAmount) : 0);

    if (args.forwardPayload) {
      data.storeBit(true);
      data.storeRef(
        beginCell()
          .storeUint(0, 32)
          .storeStringTail(args.forwardPayload)
          .endCell()
      );
    } else {
      data.storeBit(false);
    }

    return data.endCell();
  }

  /**
   * Create sender
   */
  sender(provider: ContractProvider, secretKey: Buffer): Sender {
    return {
      send: async (args) => {
        const { body } = this.createTransfer({
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
        await this.send(provider, body);
      }
    };
  }
}
