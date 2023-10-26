### Local testing

#### To build and deploy all `Move` modules:
1. cd `/move/staking`,  run `aptos move publish --named-addresses owner_addr=YOUR_ADDRESS` 
2. cd `/move/swap`, run `aptos move create-resource-account-and-publish-package --seed 12345 --address-name owner_addr --profile default --named-addresses source_addr=YOUR_ADDRESS`
3. cd `/move/pve`, run `aptos move create-resource-account-and-publish-package --seed 56789 --address-name owner_addr --profile default --named-addresses source_addr=YOUR_ADDRESS`


