#import "../.ligo/source/i/ligo__s__fa__1.3.0__ffffffff/lib/main.mligo" "FA2"

module C = struct
  type beneficiaries = (address, nat) big_map

  type vesting_status = Vesting_hasnt_started | Vesting_has_started | Vesting_has_ended

  type storage = {
    beneficiaries: beneficiaries;
    admin: address;
    token_address: address;
    token_id: nat;
    start_freeze_period: timestamp;
    start_claim_period: timestamp;
    end_vesting: timestamp;
    vesting_status: vesting_status;
    total_promised_amount: nat;
  }

  type result = operation list * storage

  module Errors = struct
    let not_admin = "NOT_ADMIN"
    let vesting_already_started = "VESTING_ALREADY_STARTED"
    let vesting_hasnt_started = "VESTING_HASNT_STARTED"
    let vesting_period_ended = "VESTING_PERIOD_ENDED"
    let freeze_period_violation = "FREEZE_PERIOD_VIOLATION"
    let claim_hasnt_started = "CLAIM_PERIOD_HASNT_STARTED"
    let insufficient_fund = "INSUFFICIENT_FUND"
    let entrypoint_not_found = "ENTRYPOINT_NOT_FOUND"
    let transfer_failed = "TRANSFER_FAILED"
    let insufficient_balance = "INSUFFICIENT_BALANCE"
    let beneficiary_already_added = "BENEFICIARY_ALREADY_ADDED"
  end

  let updateValue(m, key, value: beneficiaries * address * nat): beneficiaries = Big_map.update key (Some value) m

  let get_entrypoint(addr, name: address * string) = 
      if name = "transfer" then
          match Tezos.get_entrypoint_opt "%transfer" addr with
            | Some contract -> contract
            | None -> failwith Errors.transfer_failed
      else
          failwith Errors.entrypoint_not_found

  [@entry]
  let start (amount_: nat) (store: storage): result =
    let _ = Assert.Error.assert(Tezos.get_sender() = store.admin) Errors.not_admin in
    let _ = Assert.Error.assert(store.vesting_status = Vesting_hasnt_started) Errors.vesting_already_started in
    let _ = Assert.Error.assert(Tezos.get_now() >= store.end_vesting) Errors.vesting_period_ended in
    let _ = Assert.Error.assert(amount_ >= store.total_promised_amount) Errors.insufficient_fund in

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
    let op = Tezos.Next.Operation.transaction transfer_requests 0mutez transfer in
    let old_balance = match Big_map.find_opt(Tezos.get_sender()) store.beneficiaries with
      |Some l -> l
      |None -> 0n
    in
  
    let store = { store with start_freeze_period = Tezos.get_now()} in
    let store = { store with vesting_status = Vesting_has_started} in
    let store = { store with beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), amount_ + old_balance)} in
    [op], store

  [@entry] 
  let claim (amount_: nat) (store: storage): result =
    let _ = Assert.Error.assert(store.vesting_status = Vesting_has_started) Errors.vesting_hasnt_started in
    let _ = Assert.Error.assert(Tezos.get_now() >= store.start_claim_period) Errors.claim_hasnt_started in

    let store = if store.total_promised_amount = 0n then { store with end_vesting = Tezos.get_now()} else store in
    let _ = Assert.Error.assert(Tezos.get_now() < store.end_vesting) Errors.vesting_period_ended in

    let current_balance = match Big_map.find_opt(Tezos.get_sender()) store.beneficiaries with
        |Some l -> l
        |None -> 0n
    in
    let _ = Assert.Error.assert(amount_ <= current_balance) Errors.insufficient_balance in

    let transfer_requests = ([
      ({
          from_ = Tezos.get_self_address();
          txs = ([
            {
              to_ = Tezos.get_sender();
              token_id = 0n;
              amount = amount_
            }
          ]: FA2.SingleAssetExtendable.TZIP12.atomic_trans list)
        });
    ]: FA2.SingleAssetExtendable.TZIP12.transfer) in
    let transfer: FA2.SingleAssetExtendable.TZIP12.transfer contract = get_entrypoint(store.token_address, "transfer") in
    let op = Tezos.Next.Operation.transaction transfer_requests 0mutez transfer in
    let store = { store with beneficiaries = updateValue(store.beneficiaries, (Tezos.get_sender()), abs(current_balance - amount_))} in
    let store = { store with total_promised_amount = abs(store.total_promised_amount - amount_)} in
    [op], store

  [@entry]
  let addBeneficiary (beneficiary, amount_: address * nat) (store : storage) : result =
    let _ = Assert.Error.assert(Tezos.get_sender() = store.admin) Errors.not_admin in
    let _ = Assert.Error.assert(store.vesting_status = Vesting_hasnt_started) Errors.vesting_already_started in
    let _ = Assert.Error.assert(not (Big_map.mem beneficiary store.beneficiaries)) Errors.beneficiary_already_added in

    let beneficiaries = Big_map.add beneficiary amount_ store.beneficiaries in
    let store = {store with beneficiaries = beneficiaries} in
    let store = {store with total_promised_amount = store.total_promised_amount + amount_} in
    [], store
end