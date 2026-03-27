#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn create_test_env() -> (Env, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let amm_pool = Address::generate(&env);
    
    let contract_id = env.register_contract(None, LimitOrders);
    LimitOrdersClient::new(&env, &contract_id).initialize(&admin, &amm_pool);
    
    (env, admin, contract_id)
}

#[test]
fn test_initialize_succeeds() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let amm_pool = Address::generate(&env);
    
    let contract_id = env.register_contract(None, LimitOrders);
    let client = LimitOrdersClient::new(&env, &contract_id);
    
    client.initialize(&admin, &amm_pool);
    
    // Verify initialization succeeded (no panic means success)
    assert!(true);
}

#[test]
fn test_order_book_structure() {
    let env = Env::default();
    
    let order_book = OrderBook {
        pool_id: 1,
        bids: Vec::new(&env),
        asks: Vec::new(&env),
    };
    
    assert_eq!(order_book.pool_id, 1);
    assert_eq!(order_book.bids.len(), 0);
    assert_eq!(order_book.asks.len(), 0);
}

#[test]
fn test_order_type_enum() {
    assert_eq!(OrderType::Buy as u32, 0);
    assert_eq!(OrderType::Sell as u32, 1);
}

#[test]
fn test_order_status_enum() {
    assert_eq!(OrderStatus::Active as u32, 0);
    assert_eq!(OrderStatus::PartiallyFilled as u32, 1);
    assert_eq!(OrderStatus::Filled as u32, 2);
    assert_eq!(OrderStatus::Cancelled as u32, 3);
}
