# TON Highload Wallet Contract

Go to the [documentation](https://ndatg.github.io/ton-highload-wallet-contract/) for detailed information.

## Installation

```bash
npm install ton-highload-wallet-contract @ton/ton @ton/core @ton/crypto --save
```

## Usage

The first execution of the `sendTransfer` will make the wallet code deploy.

```js
import { TonClient } from "@ton/ton";
import { Address, internal } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { HighloadWalletContract, HighloadWalletContractV2 } from "ton-highload-wallet-contract";


// Init client
const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC"
});
const mnemonic = "position wash wrong morning void trust zero bicycle emerge display glimpse hundred best crawl rose mouse imitate milk fault local fold aspect frog capable";

// Create contract
const key = await mnemonicToPrivateKey(mnemonic.split(" "));
const contract = client.open(HighloadWalletContract.create({ publicKey: key.publicKey, workchain: 0 }));

// Send transfer
const seqno = await contract.getSeqno();
await contract.sendTransfer({
  seqno,
  secretKey: key.secretKey,
  messages: [
    // Simple transfer
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

    // Token transfer
    internal({
      to: "kQDPk5jRLMDHyhYuWDSURQoTddMuhpOXMNSjzcn-vSOMeSm0", // token wallet address
      value: "0.05", // amount for token transfer
      body: contract.createTokenTransferBody({
        toAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // destination
        responseAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // sender address
        jettonAmount: "1000000000", // 1 token amount (amount with 9 decimals)
        forwardPayload: "test token transfer"
      })
    }),

    // NFT transfer
    internal({
      to: "kQBS_avObHx9ZE9rcHXbn89O_A3ZYtslTyS7N7-nyj3jUy68", // nft item address
      value: "0.05", // amount for nft transfer
      body: contract.createNFTTransferBody({
        toAddress: "kQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JutU", // destination
        responseAddress: "EQA3wBIL7tklY8yBlNkErY2HDI9OKP5TbxoLVomYSLX1JlDe", // sender address
        forwardPayload: "test nft transfer"
      })
    }),
  ],
});
```

## Compile

You will need [toncli](https://github.com/disintar/toncli) for compilation.

Execute the commands below to check the compiled code.

```bash
toncli build
toncli fift run ./build/print.fif
```

## License

Released under the MIT License.
