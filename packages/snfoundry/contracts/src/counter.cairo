#[starknet::interface]
trait ICounter<T> {
    fn get_counter(self: @T) -> u32;
    fn increment(ref self: T);
    fn decrement(ref self: T);
    fn set_counter(ref self: T, new_value: u32);
}

#[starknet::contract]
mod CounterContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
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
    }
}
