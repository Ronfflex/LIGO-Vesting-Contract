#import "@ligo/fa/lib/main.mligo" "FA2"
module C = struct
  type beneficiaries = (address, nat) big_map

  type storage = {
    beneficiaries: beneficiaries;
    admin: address;
    token_address: address;
    token_id: nat;
    start_freeze_period: timestamp;
    start_claim_period: timestamp;
    end_vesting: timestamp;
    vesting_has_started: bool;
    total_promised_amount : nat;
  }

  type result = operation list * storage

  module Errors = struct
    let not_admin = "NOT_ADMIN"
    let vesting_already_started = "VESTING_ALREADY_STARTED"
    let vesting_hasnt_started = "VESTING_HASNT_STARTED"
    let vesting_period_ended = "VESTING_PERIOD_ENDED"
    let freeze_period_violation = "FREEZE_PERIOD_VIOLATION"
    let claim_hasnt_started = "CLAIM_PERIOD_HASNT_STARTED"
    let insufficient_balance = "INSUFFICIENT_BALANCE"
  end

  let updateValue(m, key, value: beneficiaries * address * nat): beneficiaries = Big_map.update key (Some value) m

  let get_entrypoint(addr, name: address * string) = 
      if name = "transfer" then
          match Tezos.get_entrypoint_opt "%transfer" addr with
              | Some contract -> contract
              | None -> failwith "transfer not found"
      else
          failwith "Unsupported entrypoint"

  [@entry] 
  let deposit (amount_: nat) (store: storage) : result =
    let _ = assert_with_error(Tezos.get_sender() = store.admin) Errors.not_admin in
    let _ = assert_with_error(store.vesting_has_started = false) Errors.vesting_already_started in

    let transfer_requests = ([
      ({
          from_ = Tezos.get_sender();
          txs = ([
            {
              to_ = Tezos.get_self_address();
              token_id = 0n;
              amount = amount_
            }
          ]: FA2.SingleAssetExtendable.TZIP12.atomic_trans list)
      });
    ]: FA2.SingleAssetExtendable.TZIP12.transfer) in
    let transfer: FA2.SingleAssetExtendable.TZIP12.transfer contract = get_entrypoint(store.token_address, "transfer") in
    let op = Tezos.transaction transfer_requests 0mutez transfer in
    let old_balance = match Big_map.find_opt(Tezos.get_sender()) store.beneficiaries with
        |Some l -> l
        |None -> 0n
    in
    [op], {store with beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), amount_ + old_balance)}

  [@entry]
  let start (_: nat) (store: storage): result =
    let _ = assert_with_error(Tezos.get_sender() = store.admin) Errors.not_admin in
    let _ = assert_with_error(store.vesting_has_started = false) Errors.vesting_already_started in
    let _ = assert_with_error(Tezos.get_now() >= store.end_vesting) Errors.vesting_period_ended in

    let transfer_requests = ([
      ({
          from_ = Tezos.get_sender();
          txs = ([
            {
              to_ = Tezos.get_self_address();
              token_id = 0n;
              amount = store.total_promised_amount
            }
          ]: FA2.SingleAssetExtendable.TZIP12.atomic_trans list)
        });
    ]: FA2.SingleAssetExtendable.TZIP12.transfer) in
    let transfer: FA2.SingleAssetExtendable.TZIP12.transfer contract = get_entrypoint(store.token_address, "transfer") in
    let op = Tezos.transaction transfer_requests 0mutez transfer in
    let store = { store with start_freeze_period = Tezos.get_now()} in
    let store = { store with vesting_has_started = true} in
    [op], store

  [@entry] 
  let claim (amount_: nat) (store: storage): result =
    let _ = assert_with_error(store.vesting_has_started = true) Errors.vesting_hasnt_started in
    let _ = assert_with_error(Tezos.get_now() >= store.start_claim_period) Errors.claim_hasnt_started in
    let current_balance = match Big_map.find_opt(Tezos.get_sender()) store.beneficiaries with
        |Some l -> l
        |None -> 0n
    in
    let _ = assert_with_error(amount_ <= current_balance) Errors.insufficient_balance in
    let transfer_requests = ([
      ({
          from_ = Tezos.get_sender();
          txs = ([
            {
              to_ = Tezos.get_self_address();
              token_id = 0n;
              amount = amount_
            }
          ]: FA2.SingleAssetExtendable.TZIP12.atomic_trans list)
        });
    ]: FA2.SingleAssetExtendable.TZIP12.transfer) in
    let transfer: FA2.SingleAssetExtendable.TZIP12.transfer contract = get_entrypoint(store.token_address, "transfer") in
    let op = Tezos.transaction transfer_requests 0mutez transfer in
    [op], {store with beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), abs(current_balance - amount_))}

end