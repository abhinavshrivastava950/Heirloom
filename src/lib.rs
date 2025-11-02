#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, symbol_short,
};

// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Beneficiary,
    CheckInPeriod,
    LastCheckIn,
    Token,
    IsInitialized,
}

#[contract]
pub struct HeirloomContract;

#[contractimpl]
impl HeirloomContract {
    /// Initialize the will contract
    /// Can only be called once
    pub fn initialize(
        env: Env,
        owner: Address,
        beneficiary: Address,
        check_in_period: u64,
        token: Address,
    ) {
        // Ensure contract hasn't been initialized already
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Contract already initialized");
        }

        // Require authentication from the owner
        owner.require_auth();

        // Store contract state
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Beneficiary, &beneficiary);
        env.storage().instance().set(&DataKey::CheckInPeriod, &check_in_period);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::IsInitialized, &true);

        // Set initial check-in time to now
        let current_time = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::LastCheckIn, &current_time);

        // Emit event
        env.events().publish((symbol_short!("init"),), (owner.clone(), beneficiary));
    }

    /// Deposit tokens into the will contract
    pub fn deposit(env: Env, from: Address, amount: i128) {
        // Require authentication from the depositor
        from.require_auth();

        // Get owner and verify the caller is the owner
        let owner: Address = env.storage().instance().get(&DataKey::Owner)
            .expect("Contract not initialized");
        
        if from != owner {
            panic!("Only owner can deposit");
        }

        // Get the token address
        let token_address: Address = env.storage().instance().get(&DataKey::Token)
            .expect("Token not set");

        // Create token client
        let token_client = token::Client::new(&env, &token_address);

        // Transfer tokens from owner to contract
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        // Emit event
        env.events().publish((symbol_short!("deposit"),), (from, amount));
    }

    /// Owner checks in to prove they're still active
    pub fn check_in(env: Env, owner: Address) {
        // Require authentication from the caller
        owner.require_auth();

        // Get stored owner and verify
        let stored_owner: Address = env.storage().instance().get(&DataKey::Owner)
            .expect("Contract not initialized");
        
        if owner != stored_owner {
            panic!("Only owner can check in");
        }

        // Update last check-in time to current time
        let current_time = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::LastCheckIn, &current_time);

        // Emit event
        env.events().publish((symbol_short!("checkin"),), (owner, current_time));
    }

    /// Beneficiary claims the assets after inactivity period
    pub fn claim(env: Env, beneficiary: Address) {
        // Require authentication from the caller
        beneficiary.require_auth();

        // Get stored beneficiary and verify
        let stored_beneficiary: Address = env.storage().instance().get(&DataKey::Beneficiary)
            .expect("Contract not initialized");
        
        if beneficiary != stored_beneficiary {
            panic!("Only beneficiary can claim");
        }

        // Get check-in data
        let last_check_in: u64 = env.storage().instance().get(&DataKey::LastCheckIn)
            .expect("Last check-in not found");
        let check_in_period: u64 = env.storage().instance().get(&DataKey::CheckInPeriod)
            .expect("Check-in period not found");

        // Calculate deadline
        let deadline = last_check_in + check_in_period;
        let current_time = env.ledger().timestamp();

        // Check if inactivity period has passed
        if current_time <= deadline {
            panic!("Check-in period has not passed yet");
        }

        // Get token and transfer all balance to beneficiary
        let token_address: Address = env.storage().instance().get(&DataKey::Token)
            .expect("Token not set");
        let token_client = token::Client::new(&env, &token_address);

        let contract_balance = token_client.balance(&env.current_contract_address());
        
        if contract_balance > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &beneficiary,
                &contract_balance,
            );
        }

        // Emit event
        env.events().publish(
            (symbol_short!("claim"),),
            (beneficiary, contract_balance),
        );
    }

    /// Owner withdraws all assets and closes the will
    pub fn owner_withdraw(env: Env, owner: Address) {
        // Require authentication from the caller
        owner.require_auth();

        // Get stored owner and verify
        let stored_owner: Address = env.storage().instance().get(&DataKey::Owner)
            .expect("Contract not initialized");
        
        if owner != stored_owner {
            panic!("Only owner can withdraw");
        }

        // Get token and transfer all balance back to owner
        let token_address: Address = env.storage().instance().get(&DataKey::Token)
            .expect("Token not set");
        let token_client = token::Client::new(&env, &token_address);

        let contract_balance = token_client.balance(&env.current_contract_address());
        
        if contract_balance > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &owner,
                &contract_balance,
            );
        }

        // Emit event
        env.events().publish(
            (symbol_short!("withdraw"),),
            (owner, contract_balance),
        );
    }

    /// View function: Get contract info
    pub fn get_info(env: Env) -> (Address, Address, u64, u64) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner)
            .expect("Contract not initialized");
        let beneficiary: Address = env.storage().instance().get(&DataKey::Beneficiary)
            .expect("Contract not initialized");
        let check_in_period: u64 = env.storage().instance().get(&DataKey::CheckInPeriod)
            .expect("Contract not initialized");
        let last_check_in: u64 = env.storage().instance().get(&DataKey::LastCheckIn)
            .expect("Contract not initialized");

        (owner, beneficiary, check_in_period, last_check_in)
    }

    /// View function: Get contract balance
    pub fn get_balance(env: Env) -> i128 {
        let token_address: Address = env.storage().instance().get(&DataKey::Token)
            .expect("Token not set");
        let token_client = token::Client::new(&env, &token_address);
        token_client.balance(&env.current_contract_address())
    }

    /// View function: Check if beneficiary can claim
    pub fn can_claim(env: Env) -> bool {
        let last_check_in: u64 = env.storage().instance().get(&DataKey::LastCheckIn)
            .expect("Last check-in not found");
        let check_in_period: u64 = env.storage().instance().get(&DataKey::CheckInPeriod)
            .expect("Check-in period not found");
        
        let deadline = last_check_in + check_in_period;
        let current_time = env.ledger().timestamp();
        
        current_time > deadline
    }
}

#[cfg(test)]
mod test;