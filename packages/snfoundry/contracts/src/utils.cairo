use core::num::traits::Pow;

pub fn strk_to_fri(amount: u256) -> u256 {
    amount * 10_u256.pow(18)
}

#[test]
fn test_strk_to_fri_should_succeed() {
    assert!(strk_to_fri(10) == 10_000_000_000_000_000_000, "Conversion from STRK to FRI failed");
}

#[test]
#[should_panic]
fn test_strk_to_fri_should_fail() {
    assert!(strk_to_fri(10) == 10_000_000_000_000_000_00);
}
