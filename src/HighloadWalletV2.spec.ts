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
    mnemonic = "position wash wrong morning void trust zero bicycle emerge display glimpse hundred best crawl rose mouse imitate milk fault local fold aspect frog capable";
  });

  it("should has balance and correct address", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContractV2.create({ publicKey: key.publicKey, workchain: 0 }));
    const balance = await contract.getBalance();

    // Check parameters
    expect(contract.address.equals(Address.parse("EQBPjthvzqRai-BKN0QYSffKNxMUkNTwy8fI7AnUujuez0vj"))).toBe(true);
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
          body: "test transfer",
          bounce: false,
        }),
        internal({
          to: "EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC",
          value: "0.2",
          body: "test transfer",
          bounce: false,
        }),
        internal({
          to: "EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC",
          value: "0.2",
          body: "test transfer",
          bounce: false,
        }),

        // internal({
        //   to: "kQDPk5jRLMDHyhYuWDSURQoTddMuhpOXMNSjzcn-vSOMeSm0", // token wallet address
        //   value: "0.05", // amount for token transfer
        //   body: contract.createTokenTransferBody({
        //     toAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // destination
        //     responseAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // sender address
        //     jettonAmount: "1000000000", // 1 token amount (amount with 9 decimals)
        //     forwardPayload: "test token transfer"
        //   })
        // }),

        // internal({
        //   to: "kQBS_avObHx9ZE9rcHXbn89O_A3ZYtslTyS7N7-nyj3jUy68", // nft item address
        //   value: "0.05", // amount for nft transfer
        //   body: contract.createNFTTransferBody({
        //     toAddress: "kQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JutU", // destination
        //     responseAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // sender address
        //     forwardPayload: "test nft transfer"
        //   })
        // }),
      ],
    });
  });

});
