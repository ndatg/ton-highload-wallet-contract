import { TonClient } from "@ton/ton";
import { Address, internal } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { HighloadWalletContractV2 } from "./HighloadWalletV2";

describe("HighloadWalletV2", () => {
  let client: TonClient;
  let mnemonic: string;

  beforeAll(() => {
    client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: "32df40f4ffc11053334bcdf09c7d3a9e6487ee0cb715edf8cf667c543edb10ca",
    });
    mnemonic = "success guilt chest toilet wing gallery pioneer clutch volcano lake baby catch random civil wedding degree cloth clock pyramid popular release expand diesel country";
  });

  it("should has balance and correct address", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContractV2.create({ publicKey: key.publicKey, workchain: 0 }));
    const balance = await contract.getBalance();

    // Check parameters
    expect(contract.address.equals(Address.parse("EQAAiwJQoq8zvH47w6dOWmpFWXKV9sWVLa5nRyzQLNG2bETb"))).toBe(true);
    expect(balance > 0n).toBe(true);
  });

  it("should perform transfer", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContractV2.create({ publicKey: key.publicKey, workchain: 0 }));

    // Send transfer
    await contract.sendTransfer({
      secretKey: key.secretKey,
      messages: [
        internal({
          to: "EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC",
          value: "0.2",
          body: "test 1",
          bounce: false,
        }),
        internal({
          to: "EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC",
          value: "0.2",
          body: "test 2",
          bounce: false,
        })
      ],
    });
  });

});
