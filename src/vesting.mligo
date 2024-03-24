module C = struct
  type storage = {
    admin : address;
    token_address : address;
    token_id : nat;
    vesting_start : timestamp;
    vesting_end : timestamp;
    freeze_period : int;
    beneficiaries : (address, tez) big_map;
    claimed_amounts : (address, tez) big_map;
    vesting_started : bool;
    total_promised_amount : tez;
  }

  type result = operation list * storage

  module Errors = struct
    let not_admin = "NOT_ADMIN"
    let vesting_already_started = "VESTING_ALREADY_STARTED"
    let freeze_period_violation = "FREEZE_PERIOD_VIOLATION"
    let insufficient_balance = "INSUFFICIENT_BALANCE"
  end

  [@entry]
  let start (store : storage) : result =
    let sender = Tezos.get_sender () in
    let () = assert_with_error (sender = store.admin) Errors.not_admin in
    let () = assert_with_error (not store.vesting_started) Errors.vesting_already_started in
    let now = Tezos.get_now () in
    let freeze_period_end = now + store.freeze_period in
    if freeze_period_end <= store.vesting_start then
        let () = assert_with_error (Tezos.get_balance () >= store.total_promised_amount) Errors.insufficient_balance in
        let new_store = {store with vesting_started = true} in
        let parameter_data = Bytes.pack (Crypto.blake2b (Bytes.pack "TRANSFER_FROM_ADMIN")) in
        let payment = Tezos.transaction parameter_data 0mutez store.token_address in
        ([payment], new_store)
    else
        let new_store = {store with vesting_started = true} in
        ([], new_store)

end