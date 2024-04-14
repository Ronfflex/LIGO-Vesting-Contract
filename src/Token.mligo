#import "../.ligo/source/i/ligo__s__fa__1.3.0__ffffffff/lib/main.mligo" "FA2"

type extension = {
    admin : address
}

type operator = address

type operators = (address, operator set) big_map

type storage = extension FA2.SingleAssetExtendable.storage

type ret = operation list * storage

[@entry]
let transfer (t: FA2.SingleAssetExtendable.TZIP12.transfer) (s: storage): ret =
  FA2.SingleAssetExtendable.transfer t s

[@entry]
let update_operators (updates : FA2.SingleAssetExtendable.TZIP12.update_operators) (s : storage): ret =
  FA2.SingleAssetExtendable.update_operators updates s