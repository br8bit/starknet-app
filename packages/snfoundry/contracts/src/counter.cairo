#[starknet::interface]
trait ICounter<T> {
    fn get_counter(self: @T) -> u32;
    fn increment(ref self: T);
    fn decrement(ref self: T);
}

#[starknet::contract]
mod CounterContract {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::ICounter;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CounterChanged: CounterChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct CounterChanged {
        caller: ContractAddress,
        new_value: u32,
        old_value: u32,
        reason: ChangeReason,
    }

    #[derive(Drop, Copy, Serde)]
    enum ChangeReason {
        Incremented,
        Decremented,
    }

    #[storage]
    struct Storage {
        counter: u32,
    }

    fn constructor(ref self: ContractState, initial_value: u32) {
        self.counter.write(initial_value);
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
                            caller: starknet::get_caller_address(),
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
        }
    }
}
