### Local testing

1. Follow the official [Aptos CLI installation guide](https://aptos.dev/tools/install-cli/)
2. Create new aptos account with `aptos init` (will create new folder .aptos and store public and private key in it)
3. Import private_key from .aptos to Petra Extension
4. Go to `/mintCoins` folder and mint 10 coins using account (owner_addr) from `.aptos/config.yaml` 'account' field 
    Run `aptos move publish --named-addresses owner_addr=account` in /move folder
5. Go to `/coreMechanics` folder and create resource account and deploy swap module using same account value in `source_addr`
    ```
    aptos move create-resource-account-and-publish-package --seed 12345 --address-name owner_addr --profile default --named-addresses source_addr=account
    ```
    Copy resource account address after deployment.

