import { TonClient } from "@ton/ton";
import { Address, internal } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { HighloadWalletContract } from "./HighloadWallet";

describe("HighloadWallet", () => {
  let client: TonClient;
  let mnemonic: string;

  beforeAll(() => {
    client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: "32df40f4ffc11053334bcdf09c7d3a9e6487ee0cb715edf8cf667c543edb10ca",
    });
    mnemonic = "net neither grape hill abstract couch skull relax ask exhaust acquire turtle jewel loyal coast shoulder mango cost damage perfect panel tip puzzle father";
  });

  it("should has balance and correct address", async () => {
    // Create contract
    const key = await mnemonicToPrivateKey(mnemonic.split(" "));
    const contract = client.open(HighloadWalletContract.create({ publicKey: key.publicKey, workchain: 0 }));
    const balance = await contract.getBalance();

    // Check parameters
    expect(contract.address.equals(Address.parse("EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe"))).toBe(true);
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
          to: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe",
          value: "0.2",
          body: "test transfer",
          bounce: false,
        }),
        internal({
          to: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe",
          value: "0.2",
          body: "test transfer",
          bounce: false,
        }),
        internal({
          to: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe",
          value: "0.2",
          body: "test transfer",
          bounce: false,
        }),

        // internal({
        //   to: "kQDPk5jRLMDHyhYuWDSURQoTddMuhpOXMNSjzcn-vSOMeSm0", // token wallet address
        //   value: "0.05", // amount for token transfer
        //   body: contract.createTokenTransfer({
        //     toAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // destination
        //     responseAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // sender address
        //     jettonAmount: "1", // amount
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
