# Tezos Vesting Smart Contract

This is a Tezos smart contract written in the LIGO language, which implements a vesting mechanism for token distribution.

## Features

1. **Vesting Period Management**: The contract allows the administrator to set the start of the freeze period, the start of the claim period, and the end of the vesting period.
2. **Beneficiary Management**: The administrator can add beneficiaries and their respective token amounts to the contract.
3. **Token Transfer**: Beneficiaries can claim their vested tokens during the claim period.
4. **Access Control**: Only the administrator can start the vesting process, add beneficiaries, and set the vesting parameters.

## Entrypoints

1. **start**: This entrypoint allows the administrator to start the vesting process by transferring the required amount of tokens to the contract.
2. **claim**: This entrypoint allows beneficiaries to claim their vested tokens during the claim period.
3. **addBeneficiary**: This entrypoint allows the administrator to add new beneficiaries and their respective token amounts to the contract.

## Errors

The contract defines various error messages that can be raised during the execution of the entrypoints:

- `NOT_ADMIN`: Raised when a non-admin user tries to call an admin-only entrypoint.
- `VESTING_ALREADY_STARTED`: Raised when the admin tries to start the vesting process when it has already started.
- `VESTING_HASNT_STARTED`: Raised when a beneficiary tries to claim tokens before the vesting process has started.
- `VESTING_PERIOD_ENDED`: Raised when a beneficiary tries to claim tokens after the vesting period has ended.
- `FREEZE_PERIOD_VIOLATION`: Raised when the admin tries to start the vesting process before the freeze period has started.
- `CLAIM_PERIOD_HASNT_STARTED`: Raised when a beneficiary tries to claim tokens before the claim period has started.
- `INSUFFICIENT_FUND`: Raised when the admin tries to start the vesting process with an insufficient amount of tokens.
- `ENTRYPOINT_NOT_FOUND`: Raised when the contract tries to call a non-existent entrypoint.
- `TRANSFER_FAILED`: Raised when the contract fails to transfer tokens.
- `INSUFFICIENT_BALANCE`: Raised when a beneficiary tries to claim more tokens than they have available.
- `BENEFICIARY_ALREADY_ADDED`: Raised when the admin tries to add a beneficiary that has already been added.

## Deployment

### Using the Makefile

The project includes a Makefile that simplifies the compilation and deployment process. To use the Makefile, you'll need to have the LIGO compiler installed on your system. If you're using a Linux-based system, you can use the following command to install LIGO:

```
docker run --platform linux/amd64 -u $(id -u):$(id -g) --rm -v "$(PWD)":"$(PWD)" -w "$(PWD)" ligolang/ligo:1.5.0 install
```

If you're using a macOS system with the M3 chip (like me :sad:), the Makefile may not work as expected due to compatibility issues. In this case, you can follow the manual deployment steps below.

### Manual Deployment

1. Compile the contracts:
   ```
   ligo compile contract --project-root ./src ./src/vesting.mligo -o ./compiled/Vesting.mligo.json -m C --michelson-format json
   ligo compile contract --project-root ./src ./src/Token.mligo -o ./compiled/Token.mligo.json -m T --michelson-format json
   ```

2. Prepare the deployment script:
   - Create a new file called `deploy.ts` in the root directory of your project.
   - Copy the deployment script provided in the "Deployment" section of the README.
   - Update the environment variables (`PRIVATE_KEY` and `ADMIN_ADDRESS`) in the `deploy.ts` file.

3. Run the deployment script:
   ```
   cd deploy
   npm install
   npm run deploy
   ```

The deployment script will deploy the vesting contract to the Ghostnet testnet.

## Usage

To use the vesting contract, you can interact with the following entrypoints:

1. `start`: The administrator can call this entrypoint to start the vesting process by transferring the required amount of tokens to the contract.
2. `claim`: Beneficiaries can call this entrypoint to claim their vested tokens during the claim period.
3. `addBeneficiary`: The administrator can call this entrypoint to add new beneficiaries and their respective token amounts to the contract.

## Dependencies

The contract uses the `FA2.SingleAssetExtendable` module from the `ligo__s__fa__1.3.0__ffffffff` library, which provides a standard implementation of the FA2 token standard.