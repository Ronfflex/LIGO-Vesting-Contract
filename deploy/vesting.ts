import { InMemorySigner } from "@taquito/signer";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import * as dotenv from "dotenv";

import vesting from "../compiled/vesting.mligo.json";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RPC_ENDPOINT = "https://rpc.ghostnet.teztnets.com";

export async function DeployVesting(token_address: string): Promise<any> {
    if (!PRIVATE_KEY || !ADMIN_ADDRESS) {
        console.error("Please provide PRIVATE_KEY and ADMIN_ADDRESS in .env file");
        return;
    }

    const Tezos = new TezosToolkit(RPC_ENDPOINT);

    Tezos.setProvider({ signer: await InMemorySigner.fromSecretKey(PRIVATE_KEY) });

    const storage = {
        beneficiaries: MichelsonMap.fromLiteral({}),
        admin: ADMIN_ADDRESS,
        token_address: token_address,
        start_freeze_period: new Date("2022-01-01T00:00:00Z"),
        start_claim_period: new Date("2022-01-01T00:00:00Z"),
        end_vesting: new Date("2022-01-01T00:00:00Z"),
        vesting_has_started: false,
        total_promised_amount: 0
    };
    
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