import { TonClient } from "ton";
import { Address, internal } from "ton-core";
import { mnemonicToPrivateKey } from "ton-crypto";
import { HighloadWalletContract } from "./HighloadWallet";

describe("HighloadWallet", () => {
  let client: TonClient;
  let mnemonic: string;

  beforeAll(() => {
    client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: "32df40f4ffc11053334bcdf09c7d3a9e6487ee0cb715edf8cf667c543edb10ca",
    });
    mnemonic = "captain diagram attend dragon grape front armed recycle suit caution waste stadium shoulder hunt make scale dad animal fancy vote puzzle sort battle ignore";
  });

  it("should has balance and correct address", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContract.create({ publicKey: key.publicKey, workchain: 0 }));
    const balance = await contract.getBalance();

    // Check parameters
    expect(contract.address.equals(Address.parse("EQCFdkYj2CYWTNgoMSulPhMKW5eBLtW-IOVW8ku0hf3eStCv"))).toBe(true);
    expect(balance > 0n).toBe(true);
  });

  it("should perform transfer", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContract.create({ publicKey: key.publicKey, workchain: 0 }));

    // Send transfer
    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
      seqno,
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
