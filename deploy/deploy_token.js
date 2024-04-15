"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signer_1 = require("@taquito/signer");
const taquito_1 = require("@taquito/taquito");
const utils_1 = require("@taquito/utils");
const dotenv = __importStar(require("dotenv"));
const fa2_single_asset_mligo_json_1 = __importDefault(require("../compiled/fa2_single_asset.mligo.json"));
dotenv.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RPC_ENDPOINT = "https://ghostnet.tezos.marigold.dev";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const Tezos = new taquito_1.TezosToolkit(RPC_ENDPOINT);
        //set alice key
        Tezos.setProvider({
            signer: yield signer_1.InMemorySigner.fromSecretKey("edskS7YYeT85SiRZEHPFjDpCAzCuUaMwYFi39cWPfguovTuNqxU3U9hXo7LocuJmr7hxkesUFkmDJh26ubQGehwXY8YiGXYCvU"),
        });
        const ledger = new taquito_1.MichelsonMap();
        ledger.set("tz1TiFzFCcwjv4pyYGTrnncqgq17p59CzAE2", 1000000);
        const token_metadata = new taquito_1.MichelsonMap();
        const token_info = new taquito_1.MichelsonMap();
        token_info.set("name", (0, utils_1.char2Bytes)("My super token"));
        token_info.set("description", (0, utils_1.char2Bytes)("Lorem ipsum ..."));
        token_info.set("symbol", (0, utils_1.char2Bytes)("XXX"));
        token_info.set("decimals", (0, utils_1.char2Bytes)("0"));
        token_metadata.set(0, { token_id: 0, token_info });
        const metadata = new taquito_1.MichelsonMap();
        metadata.set("", (0, utils_1.char2Bytes)("tezos-storage:data"));
        metadata.set("data", (0, utils_1.char2Bytes)(`{
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
  
  }`));
        const operators = new taquito_1.MichelsonMap();
        const initialStorage = {
            ledger,
            metadata,
            token_metadata,
            operators,
        };
        try {
            const originated = yield Tezos.contract.originate({
                code: fa2_single_asset_mligo_json_1.default,
                storage: initialStorage,
            });
            console.log(`Waiting for nftContract ${originated.contractAddress} to be confirmed...`);
            yield originated.confirmation(2);
            console.log("confirmed contract: ", originated.contractAddress);
        }
        catch (error) {
            console.log(error);
        }
    });
}
main();
