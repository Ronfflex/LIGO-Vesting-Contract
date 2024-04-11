#import "@ligo/fa/lib/main.mligo" "FA2"
module C = struct
  type beneficiaries = (address, nat) big_map

  type storage = {
    beneficiaries: beneficiaries;
    admin: address;
    token_address: address;
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
    let vesting_period_ended = "VESTING_PERIOD_ENDED"
    let invalid_provided_dates = "INVALID_PROVIDED_DATES"
    let freeze_period_violation = "FREEZE_PERIOD_VIOLATION"
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
  let start (start_freeze_period, start_claim_period, end_vesting: timestamp * timestamp * timestamp) (store : storage): result =
    let _ = assert_with_error(Tezos.get_sender() = store.admin) Errors.not_admin in
    let _ = assert_with_error(store.vesting_has_started = false) Errors.vesting_already_started in
    let _ = assert_with_error(Tezos.get_now() >= store.end_vesting) Errors.vesting_period_ended in

    let _ = assert_with_error(start_freeze_period >= Tezos.get_now()) Errors.invalid_provided_dates in
    let _ = assert_with_error(start_claim_period >= start_freeze_period) Errors.invalid_provided_dates in
    let _ = assert_with_error(end_vesting > start_claim_period) Errors.invalid_provided_dates in

    let store = { store with start_freeze_period = start_freeze_period; start_claim_period = start_claim_period; end_vesting = end_vesting; vesting_has_started = true } in
    [], store

end