import { InMemorySigner } from "@taquito/signer";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import { char2Bytes } from "@taquito/utils";
import * as dotenv from "dotenv";
import nftContract from "../compiled/fa2_single_asset.mligo.json";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RPC_ENDPOINT = "https://ghostnet.tezos.marigold.dev";

async function main() {
  const Tezos = new TezosToolkit(RPC_ENDPOINT);

  //set alice key
  Tezos.setProvider({
    signer: await InMemorySigner.fromSecretKey("edskS7YYeT85SiRZEHPFjDpCAzCuUaMwYFi39cWPfguovTuNqxU3U9hXo7LocuJmr7hxkesUFkmDJh26ubQGehwXY8YiGXYCvU"),
  });

  const ledger = new MichelsonMap();
  ledger.set("tz1TiFzFCcwjv4pyYGTrnncqgq17p59CzAE2", 1000000);

  const token_metadata = new MichelsonMap();
  const token_info = new MichelsonMap();
  token_info.set("name", char2Bytes("My super token"));
  token_info.set("description", char2Bytes("Lorem ipsum ..."));
  token_info.set("symbol", char2Bytes("XXX"));
  token_info.set("decimals", char2Bytes("0"));

  token_metadata.set(0, { token_id: 0, token_info });

  const metadata = new MichelsonMap();
  metadata.set("", char2Bytes("tezos-storage:data"));
  metadata.set(
    "data",
    char2Bytes(`{
    "name":"FA2",
    "description":"Example FA2 implementation",
    "version":"0.1.0",
    "license":{"name":"MIT"},
    "authors":["Benjamin Fuentes<benjamin.fuentes@marigold.dev>"],
    "homepage":"",
    "source":{"tools":["Ligo"], "location":"https://github.com/ligolang/contract-catalogue/tree/main/lib/fa2"},
    "interfaces":["TZIP-012"],
    "errors":[],
    "views":[]
  
  }`)
  );

  const operators = new MichelsonMap();

  const initialStorage = {
    ledger,
    metadata,
    token_metadata,
    operators,
  };

  try {
    const originated = await Tezos.contract.originate({
      code: nftContract,
      storage: initialStorage,
    });
    console.log(
      `Waiting for nftContract ${originated.contractAddress} to be confirmed...`
    );
    await originated.confirmation(2);
    console.log("confirmed contract: ", originated.contractAddress);
  } catch (error: any) {
    console.log(error);
  }
}

main();
