//! 구조 구현의 자리.
//!
//! 여기 오는 것은 규약4 **(가) 등급** 구조뿐이다 — TS 로 계약을 **표현조차 못 하는** 것.
//! 느려서가 아니라 못 써서다. (나) 등급(실측만 TS 에서 못 내는 경우)은 Rust 산출물이
//! **선택**이므로 여기 와야 할 의무가 없다.
//!
//! | 구조 | 카드 | 계약에 들어온 것 |
//! |---|---|---|
//! | `probabilistic/concurrentSkipList` | KAN-024 | 선형화 · 진행 보장 |
//!
//! 계약은 이 crate 에 없다. `<name>.ts` 헤더 한 곳이고(§규약1), 이쪽은 그 계약을 지키는
//! 구현과 그것을 재는 자리다.
//!
//! | 무엇 | 어디 | 어느 축 |
//! |---|---|---|
//! | 정본 | `concurrent_skip_list` | 축1 재생 · 축4 판정 대상 |
//! | 순차 모델 | `model` | 축4가 대조할 모델. 축1 vector 로 함께 검사한다 |
//! | 결함 fixture | `fixtures` | 축4가 실제로 잡는지 보이는 자리 |
//!
//! 파일 이름이 `concurrent_skip_list.rs` 인 것은 Rust 의 이름 규약을 따른 것이고, 구조의
//! 이름은 `probabilistic/concurrentSkipList` 그대로다.

pub mod concurrent_skip_list;
pub mod fixtures;
pub mod model;
