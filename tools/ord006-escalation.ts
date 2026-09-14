/**
 * 규약4 에스컬레이션 등급 **확정** 판정. 키는 `<category>/<name>`.
 *
 * **왜 `ord006-inventory.ts` 에서 뽑아 왔는가.** 그 파일은 top-level await 로 TSV 를 쓰고
 * 화면에 행 수를 찍는 CLI 다 — 가드가 없어 import 만 해도 파일이 써지고 stdout 이 오염된다.
 * 등급표는 **데이터**라 어디서 읽든 같은 값이어야 하므로 순수 모듈로 내렸고,
 * `ord006-inventory.ts` 와 `check-v2.ts`(P19)가 함께 이것을 읽는다.
 *
 * 출처는 `docs/ORD-006-conventions.md` 의 확정 판정이다. 전략 표의 목록은 착수 시점의
 * **예상**이므로 넣지 않는다 — 결함등급과 같은 규칙으로, 확정된 것만 적고 추정하지 않는다.
 *
 * 값이 `(가)`/`(나)` 가 아니라 `req`/`opt` 인 이유: `en_US.UTF-8` 로케일의 awk·uniq 는
 * `가` 와 `나` 를 같은 문자열로 판정한다. 기계가 읽는 열은 ASCII 로 둔다.
 */
export const ESCALATION: Record<string, "req" | "opt"> = {
  // (가) Rust 필수 — 선형화·진행 보장은 단일 스레드 TS 에서 표현 불가
  "probabilistic/concurrentSkipList": "req",
  // (나) Rust 선택 — 계약은 TS 로 충족, 포인터 XOR 의 메모리 이득만 측정 불가
  "linear/xorLinkedList": "opt",
};

/**
 * **메모리를 직접 다뤄야 이득이 생기는 구조.** 여기 든 구조는 가이드의 전개
 * (`deep.walk`, 「수행으로 알아보는 자료구조」)에 **Rust 구현을 싣는다** — `rust/structures/src/`
 * 에 두고 `rust guide-core=` 펜스로 추출하며 `cargo test` 가 검증한다. 집합 밖의 구조는 전개에
 * Rust 코드를 싣지 않는다. 정본이 Rust 인 (가)는 이 판정 밖이다. `check-v2.ts` P20 이 읽는다.
 *
 * **등급과 다른 축이다.** 규약4 는 「TS 안에서 계약과 근거가 닫히는가」를 묻고, 이 집합은
 * 「그 구조를 쓰는 이유가 주소·배치를 직접 다룰 때만 생기는가」를 묻는다. (나)가 Rust 를 강제하지
 * 않는다는 규약은 그대로이고, 이 집합이 그 위에 가이드 서술 의무를 더한다.
 *
 * 출처는 2026-09-14 유저 지시(KAN-035)이고 정본 서술은 `docs/ORD-006-conventions.md` §규약4 다.
 * 등급표와 같은 규칙으로 **확정된 것만 적는다.**
 */
export const DIRECT_MEMORY: ReadonlySet<string> = new Set([
  // TS 구현은 id → 노드 표 때문에 원소당 자리가 이중 연결 리스트보다 많다. 주소 XOR 에서만 준다.
  "linear/xorLinkedList",
]);
