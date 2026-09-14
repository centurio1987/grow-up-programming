//! 구조 구현의 자리.
//!
//! 여기 오는 구조는 두 부류다. 느려서 오는 구조는 없다.
//!
//! - **규약4 (가) 등급** — TS 로 계약을 **표현조차 못 하는** 구조. 정본이 여기 있다.
//! - **메모리를 직접 다뤄야 이득이 생기는 구조**(`tools/ord006-escalation.ts` 의 `DIRECT_MEMORY`)
//!   — 계약은 TS 정본이 지키고, 가이드가 그 이득을 실제 바이트로 보이려고 Rust 구현을 싣는다.
//!   축1 vector 재생으로 계약과 어긋나지 않는지 확인한다.
//!
//! 나머지 (나) 등급은 Rust 산출물이 **선택**이므로 여기 와야 할 의무가 없다.
//!
//! | 구조 | 부류 | 카드 | 여기서 보이는 것 |
//! |---|---|---|---|
//! | `probabilistic/concurrentSkipList` | (가) | KAN-024 | 선형화 · 진행 보장 |
//! | `linear/xorLinkedList` | 메모리 직접 사용 | KAN-035 | 노드 주소 XOR · 요청 바이트 |
//!
//! 계약은 이 crate 에 없다. `<name>.ts` 헤더 한 곳이고(§규약1), 이쪽은 그 계약을 지키는
//! 구현과 그것을 재는 자리다.
//!
//! | 무엇 | 어디 | 어느 축 |
//! |---|---|---|
//! | 정본 | `concurrent_skip_list` | 축1 재생 · 축4 판정 대상 |
//! | 순차 모델 | `model` | 축4가 대조할 모델. 축1 vector 로 함께 검사한다 |
//! | 결함 fixture | `fixtures` | 축4가 실제로 잡는지 보이는 자리 |
//! | XOR 연결 리스트 | `xor_linked_list` | 축1 재생. 요청 바이트는 `tests/xor_linked_list.rs` 가 센다 |
//!
//! 파일 이름이 `concurrent_skip_list.rs` 인 것은 Rust 의 이름 규약을 따른 것이고, 구조의
//! 이름은 `probabilistic/concurrentSkipList` 그대로다.

pub mod concurrent_skip_list;
pub mod fixtures;
pub mod model;
pub mod xor_linked_list;
