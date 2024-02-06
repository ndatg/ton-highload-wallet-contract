# TON Highload Wallet Contract

Go to the [documentation](https://ndatg.github.io/ton-highload-wallet-contract/) for detailed information.

## Installation

```bash
npm install ton-highload-wallet-contract --save
```

## Usage

The first execution of the `sendTransfer` will make the wallet code deploy.

```js
import { HighloadWalletContract, HighloadWalletContractV2 } from "ton-highload-wallet-contract";
import { mnemonicToPrivateKey } from "@ton/crypto";

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
