export type Enemy = {
  key: string,
  value: {
    name: string,
    attack: string,
    health: string,
    reward_coin_types: Array<string>,
    reward_coin_amounts: Array<string>,
    image_url: string,
  }
}

export type Unit = {
  key: string,
  value: {
    name: string,
    description: string,
    image_url: string,
    attack: string,
    health: string,
    linked_coin_type: string,
  }
}

type TypeInfo = {
  account_address: string,
  module_name: string,
  struct_name: string,
}

export type Contract = {
  key: string,
  value: {
    unit_id: string,
    unit_type: string,
    coin_address: string,
    resource_type_info: TypeInfo,
    fixed_price: string,
  }
}