import { InMemorySigner } from "@taquito/signer";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import * as dotenv from "dotenv";

import vesting from "../compiled/vesting.mligo.json";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RPC_ENDPOINT = "https://rpc.ghostnet.teztnets.com";

export async function DeployVesting(token_address: string, token_id: number): Promise<any> {
    if (!PRIVATE_KEY || !ADMIN_ADDRESS) {
        console.error("Please provide PRIVATE_KEY and ADMIN_ADDRESS in .env file");
        return;
    }

    const Tezos = new TezosToolkit(RPC_ENDPOINT);

    Tezos.setProvider({ signer: await InMemorySigner.fromSecretKey(PRIVATE_KEY) });

    const beneficiaries = MichelsonMap.fromLiteral({
        tz1Z71xLy5CNsiM4NiEHdmLzVuX9rV4vdBKB: 10,
    });

    var total_promised_amount = 0;
    for (const value of beneficiaries.values()) {
        total_promised_amount += value as number;
    }

    const storage = {
        beneficiaries: beneficiaries,
        admin: ADMIN_ADDRESS,
        token_address: token_address,
        token_id: token_id,
        start_freeze_period: "2024-04-15T00:00:00Z", //new Date("2024-04-15T00:00:00Z"),
        start_claim_period: "2024-04-15T12:00:00Z", //new Date("2024-04-15T12:00:00Z"),
        end_vesting: "2024-04-15T14:00:00Z", //new Date("2024-04-15T14:00:00Z"),
        vesting_status: {0: 0},
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
        const originated = await Tezos.contract.originate({
            code: vesting,
            storage: storage,
        });
        console.log(
          `Waiting for myContract ${originated.contractAddress} to be confirmed...`
        );
        await originated.confirmation(2);
        console.log("confirmed contract: ", originated.contractAddress);
      } catch (error: any) {
        console.log(error);
      }
}

DeployVesting("KT1JKp63Zbb285GyXkDQpX5M4AnE8THrKuiv", 0)
