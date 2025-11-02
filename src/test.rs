#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, token, Address, Env};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_address = e.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(e, &contract_address.address()),
        token::StellarAssetClient::new(e, &contract_address.address()),
    )
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&owner, &1000);

    let check_in_period: u64 = 60 * 60 * 24 * 180; // 180 days

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);

    let (stored_owner, stored_beneficiary, stored_period, _) = client.get_info();
    assert_eq!(stored_owner, owner);
    assert_eq!(stored_beneficiary, beneficiary);
    assert_eq!(stored_period, check_in_period);
}

#[test]
fn test_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&owner, &1000);

    let check_in_period: u64 = 60 * 60 * 24 * 180;

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);
    client.deposit(&owner, &500);

    assert_eq!(client.get_balance(), 500);
}

#[test]
fn test_check_in() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, _) = create_token_contract(&env, &admin);

    let check_in_period: u64 = 60 * 60 * 24 * 180;

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);

    let (_, _, _, initial_check_in) = client.get_info();

    // Advance time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 1000;
    });

    client.check_in(&owner);

    let (_, _, _, new_check_in) = client.get_info();
    assert!(new_check_in > initial_check_in);
}

#[test]
fn test_claim_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&owner, &1000);

    let check_in_period: u64 = 60 * 60 * 24 * 180; // 180 days

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);
    client.deposit(&owner, &500);

    // Advance time past the check-in period
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + check_in_period + 1;
    });

    assert!(client.can_claim());
    
    client.claim(&beneficiary);

    assert_eq!(token_client.balance(&beneficiary), 500);
    assert_eq!(client.get_balance(), 0);
}

#[test]
#[should_panic(expected = "Check-in period has not passed yet")]
fn test_claim_too_early() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&owner, &1000);

    let check_in_period: u64 = 60 * 60 * 24 * 180;

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);
    client.deposit(&owner, &500);

    // Try to claim immediately (should fail)
    client.claim(&beneficiary);
}

#[test]
fn test_owner_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, HeirloomContract);
    let client = HeirloomContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&owner, &1000);

    let check_in_period: u64 = 60 * 60 * 24 * 180;

    client.initialize(&owner, &beneficiary, &check_in_period, &token_client.address);
    client.deposit(&owner, &500);

    assert_eq!(client.get_balance(), 500);

    client.owner_withdraw(&owner);

    assert_eq!(token_client.balance(&owner), 1000); // Got all tokens back
    assert_eq!(client.get_balance(), 0);
}