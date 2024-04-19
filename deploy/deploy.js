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
exports.DeployVesting = void 0;
const signer_1 = require("@taquito/signer");
const taquito_1 = require("@taquito/taquito");
const dotenv = __importStar(require("dotenv"));
const vesting_mligo_json_1 = __importDefault(require("../compiled/vesting.mligo.json"));
dotenv.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RPC_ENDPOINT = "https://rpc.ghostnet.teztnets.com";
function DeployVesting(token_address, token_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!PRIVATE_KEY || !ADMIN_ADDRESS) {
            console.error("Please provide PRIVATE_KEY and ADMIN_ADDRESS in .env file");
            return;
        }
        const Tezos = new taquito_1.TezosToolkit(RPC_ENDPOINT);
        Tezos.setProvider({ signer: yield signer_1.InMemorySigner.fromSecretKey(PRIVATE_KEY) });
        const beneficiaries = taquito_1.MichelsonMap.fromLiteral({
            tz1Z71xLy5CNsiM4NiEHdmLzVuX9rV4vdBKB: 10,
        });
        var total_promised_amount = 0;
        for (const value of beneficiaries.values()) {
            total_promised_amount += value;
        }
        const storage = {
            beneficiaries: beneficiaries,
            admin: ADMIN_ADDRESS,
            token_address: token_address,
            token_id: token_id,
            start_freeze_period: "2024-04-15T00:00:00Z", //new Date("2024-04-15T00:00:00Z"),
            start_claim_period: "2024-04-15T12:00:00Z", //new Date("2024-04-15T12:00:00Z"),
            end_vesting: "2024-04-15T14:00:00Z", //new Date("2024-04-15T14:00:00Z"),
            vesting_status: { 0: 0 },
            total_promised_amount: total_promised_amount,
        };
        // check dates are valid
        // if (new Date(storage.start_freeze_period).getTime() >= new Date(storage.start_claim_period).getTime()) {
        //     console.error("start_claim_period should be after start_freeze_period");
        //     return;
        // }
        // if (new Date(storage.start_claim_period).getTime() >= new Date(storage.end_vesting).getTime()) {
        //     console.error("end_vesting should be after start_claim_period");
        //     return;
        // }
        // if (new Date(storage.end_vesting).getTime() <= new Date().getTime()) {
        //     console.error("end_vesting should be in the future");
        //     return;
        // }
        if (total_promised_amount <= 0) {
            console.error("total_promised_amount should be greater than 0");
            return;
        }
        console.log("Attempt to deploy");
        try {
            const originated = yield Tezos.contract.originate({
                code: vesting_mligo_json_1.default,
                storage: storage,
            });
            console.log(`Waiting for myContract ${originated.contractAddress} to be confirmed...`);
            yield originated.confirmation(2);
            console.log("confirmed contract: ", originated.contractAddress);
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.DeployVesting = DeployVesting;
DeployVesting("KT1JKp63Zbb285GyXkDQpX5M4AnE8THrKuiv", 0);
