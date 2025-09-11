use contracts::constants::STRK_CONTRACT;
use contracts::counter::CounterContract::{ChangeReason, CounterChanged, Event};
use contracts::counter::{ICounterDispatcher, ICounterDispatcherTrait};
use contracts::utils::strk_to_fri;
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, Token, declare, set_balance,
    spy_events, start_cheat_caller_address, stop_cheat_caller_address,
};
use starknet::ContractAddress;

fn owner_address() -> ContractAddress {
    'owner'.try_into().unwrap()
}

fn user_address() -> ContractAddress {
    'user'.try_into().unwrap()
}

fn deploy_contract(init_counter: u32) -> ICounterDispatcher {
    let contract_class = declare("CounterContract").unwrap().contract_class();
    let owner_address: ContractAddress = owner_address();

    let mut constructor_args = array![];
    init_counter.serialize(ref constructor_args);
    owner_address.serialize(ref constructor_args);

    let (contract_address, _) = contract_class.deploy(@constructor_args).unwrap();
    ICounterDispatcher { contract_address }
}

#[test]
fn test_contract_initialization() {
    let dispatcher = deploy_contract(5);

    let current_counter = dispatcher.get_counter();
    let expected_counter: u32 = 5;
    assert!(current_counter == expected_counter, "Initialization of counter failed");
}

#[test]
fn test_increment() {
    let dispatcher = deploy_contract(0);
    let mut spy = spy_events();

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.increment();
    stop_cheat_caller_address(dispatcher.contract_address);

    let new_counter = dispatcher.get_counter();
    assert!(new_counter == 1, "The counter must increase by 1");

    let expected_event = CounterChanged {
        caller: user_address(), new_value: 1, old_value: 0, reason: ChangeReason::Incremented,
    };

    spy
        .assert_emitted(
            @array![(dispatcher.contract_address, Event::CounterChanged(expected_event))],
        );
}

#[test]
fn test_decrement() {
    let dispatcher = deploy_contract(5);

    let mut spy = spy_events();

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.decrement();
    stop_cheat_caller_address(dispatcher.contract_address);

    let new_counter = dispatcher.get_counter();
    assert!(new_counter == 4, "The counter must decrease by 1");

    spy
        .assert_emitted(
            @array![
                (
                    dispatcher.contract_address,
                    Event::CounterChanged(
                        CounterChanged {
                            caller: user_address(),
                            new_value: 4,
                            old_value: 5,
                            reason: ChangeReason::Decremented,
                        },
                    ),
                ),
            ],
        );
}

#[test]
#[should_panic(expected: "Counter cannot be negative")]
fn test_decrement_unhappy() {
    let dispatcher = deploy_contract(0);
    dispatcher.decrement();
    dispatcher.get_counter();
}

#[test]
fn test_set_counter_owner() {
    let dispatcher = deploy_contract(0);
    let mut spy = spy_events();
    let new_counter = 10;

    start_cheat_caller_address(dispatcher.contract_address, owner_address());
    dispatcher.set_counter(new_counter);
    stop_cheat_caller_address(dispatcher.contract_address);

    let counter = dispatcher.get_counter();
    assert!(new_counter == counter, "The counter should be {new_counter}");

    let expected_event = CounterChanged {
        caller: owner_address(), new_value: 10, old_value: 0, reason: ChangeReason::Set,
    };

    spy
        .assert_emitted(
            @array![(dispatcher.contract_address, Event::CounterChanged(expected_event))],
        );
}

#[test]
#[should_panic]
fn test_set_counter_not_owner() {
    let dispatcher = deploy_contract(0);
    let new_counter = 10;

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.set_counter(new_counter);
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: "Insufficient token balance to reset the counter")]
fn test_reset_counter_insufficient_balance() {
    let dispatcher = deploy_contract(5);

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.reset();
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: "Insufficient token allowance to reset the counter")]
fn test_reset_counter_insufficient_allowance() {
    let dispatcher = deploy_contract(5);
    let caller = user_address();

    set_balance(caller, strk_to_fri(1), Token::STRK);

    start_cheat_caller_address(dispatcher.contract_address, caller);
    dispatcher.reset();
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_reset_counter_success() {
    let init_counter: u32 = 5;
    let dispatcher = deploy_contract(init_counter);
    let user = user_address();
    let mut spy = spy_events();

    set_balance(user, strk_to_fri(10), Token::STRK);
    let token_dispatcher = IERC20Dispatcher { contract_address: STRK_CONTRACT };

    // Approve the contract to spend tokens on behalf of the user
    start_cheat_caller_address(token_dispatcher.contract_address, user);
    token_dispatcher.approve(dispatcher.contract_address, strk_to_fri(5));
    stop_cheat_caller_address(token_dispatcher.contract_address);

    start_cheat_caller_address(dispatcher.contract_address, user);
    dispatcher.reset();
    stop_cheat_caller_address(dispatcher.contract_address);

    let counter = dispatcher.get_counter();
    assert!(counter == 0, "The counter should be reset to 0");

    let expected_event = CounterChanged {
        caller: user, new_value: 0, old_value: init_counter, reason: ChangeReason::Reset,
    };

    spy
        .assert_emitted(
            @array![(dispatcher.contract_address, Event::CounterChanged(expected_event))],
        );

    assert!(
        token_dispatcher.balance_of(user) == strk_to_fri(9),
        "User's token balance should be 0 after reset",
    );
    assert!(
        token_dispatcher.balance_of(owner_address()) == strk_to_fri(1),
        "User's token balance should be 1",
    );
}
