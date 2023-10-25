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