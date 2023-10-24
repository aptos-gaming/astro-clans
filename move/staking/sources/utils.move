module owner_addr::utils {
  use std::bcs;
  use std::vector;
  use std::hash;

  use aptos_framework::timestamp;
  use aptos_framework::transaction_context;

  use aptos_std::from_bcs;

  public fun random (add: address, max: u64) :u64 {              
    let number = timestamp::now_microseconds();
    let script_hash: vector<u8> = transaction_context::get_script_hash();
    let x = bcs::to_bytes<address>(&add);        
    let z = bcs::to_bytes<u64>(&number);
    vector::append(&mut x,script_hash);           
    vector::append(&mut x, z);
    let tmp = hash::sha2_256(x);

    let data = vector<u8>[];
    let i =24;
    while (i < 32) {
      let x =vector::borrow(&tmp,i);
      vector::append(&mut data,vector<u8>[*x]);
      i= i+1;
    };
    let random = from_bcs::to_u64(data) % max;
    random
  }
}