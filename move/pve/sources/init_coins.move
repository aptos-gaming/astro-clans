module owner_addr::mint_coins {
  use aptos_framework::managed_coin;

  struct Hypersteel {}
  struct Gasolineium {}

  fun init_module(owner: &signer) {
    managed_coin::initialize<Hypersteel>(
      owner,
      b"Hypersteel",
      b"HYSL",
      8,
      true,
    );

    managed_coin::initialize<Gasolineium>(
      owner,
      b"Gasolineium",
      b"GSM",
      8,
      true,
    );

    managed_coin::register<Hypersteel>(owner);
    managed_coin::register<Gasolineium>(owner);
  }
}