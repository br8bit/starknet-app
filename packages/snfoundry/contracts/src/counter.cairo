#[starknet::interface]
trait ICounter<T> {
    fn get_counter(self: @T) -> u32;
    fn increment(ref self: T);
    fn decrement(ref self: T);
    fn set_counter(ref self: T, new_value: u32);
    fn reset(ref self: T);
}

#[starknet::contract]
mod CounterContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::ICounter;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)] // abi from the component itself
    impl OwnableImpl =
        OwnableComponent::OwnableImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CounterChanged: CounterChanged,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct CounterChanged {
        #[key]
        caller: ContractAddress,
        new_value: u32,
        old_value: u32,
        reason: ChangeReason,
    }

    #[derive(Drop, Copy, Serde)]
    enum ChangeReason {
        Incremented,
        Decremented,
        Reset,
        Set,
    }

    #[storage]
    struct Storage {
        counter: u32,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_value: u32, owner: ContractAddress) {
        self.counter.write(initial_value);
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl CounterImpl of ICounter<ContractState> {
        fn get_counter(self: @ContractState) -> u32 {
            self.counter.read()
        }

        fn increment(ref self: ContractState) {
            let current_value = self.counter.read();
            self.counter.write(current_value + 1);
            self
                .emit(
                    Event::CounterChanged(
                        CounterChanged {
                            caller: get_caller_address(),
                            new_value: current_value + 1,
                            old_value: current_value,
                            reason: ChangeReason::Incremented,
                        },
                    ),
                );
        }

        fn decrement(ref self: ContractState) {
            let current_value = self.counter.read();
            assert!(current_value > 0, "Counter cannot be negative");
            self.counter.write(current_value - 1);
            self
                .emit(
                    Event::CounterChanged(
                        CounterChanged {
                            caller: get_caller_address(),
                            new_value: current_value - 1,
                            old_value: current_value,
                            reason: ChangeReason::Decremented,
                        },
                    ),
                );
        }

        fn set_counter(ref self: ContractState, new_value: u32) {
            self.ownable.assert_only_owner();
            let current_value = self.get_counter();
            self.counter.write(new_value);
            self
                .emit(
                    Event::CounterChanged(
                        CounterChanged {
                            caller: get_caller_address(),
                            new_value,
                            old_value: current_value,
                            reason: ChangeReason::Set,
                        },
                    ),
                );
        }

        fn reset(ref self: ContractState) {
            let token: ContractAddress =
                0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
                .try_into()
                .unwrap();
            let payment_amount: u256 = 1_000_000_000_000_000_000; // 1 starknet
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            let dispatcher = IERC20Dispatcher { contract_address: token };
            let balance = dispatcher.balance_of(caller);
            assert!(balance >= payment_amount, "Insufficient token balance to reset the counter");

            let allowance = dispatcher.allowance(caller, contract_address);
            assert!(
                allowance >= payment_amount, "Insufficient token allowance to reset the counter",
            );

            let owner = self.ownable.owner();
            let transfer_result = dispatcher.transfer_from(caller, owner, payment_amount);
            assert!(transfer_result, "Token transfer failed");

            let current_value = self.get_counter();
            self.counter.write(0);
            self
                .emit(
                    Event::CounterChanged(
                        CounterChanged {
                            caller,
                            new_value: 0,
                            old_value: current_value,
                            reason: ChangeReason::Reset,
                        },
                    ),
                );
        }
    }
}
