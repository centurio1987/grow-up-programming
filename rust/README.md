# rust — 계약 스위트의 Rust 쪽

**규격의 정본은 이 파일이 아니라 `docs/ORD-006-conventions.md` §규약2 다.** 여기에는
구조와 실행 명령만 적는다.

## 무엇이 여기 있는가

| crate | 무엇 |
| --- | --- |
| `contract` | 하네스. 축1(vector 재생)과 축4(선형화·진행 보장) |
| `structures` | 구조 구현이 들어올 자리. **지금은 비어 있다** — KAN-024 가 채운다 |
| `vectors/` | 언어 중립 test vector. **손으로 고치지 않는다** — `tools/emit-vectors.ts` 가 뽑는다 |

축2(불변식)·축3(복잡도)은 여기 없다. TS 하네스가 이미 돌고, Rust 로 오는 구조는 규약4
**(가) 등급** — TS 로 계약을 *표현조차 못 하는* 것뿐이다. 느려서 오는 것이 아니다.

## 실행

```bash
cd rust
cargo test                                              # 축1 + 판정기 자기시험
RUSTFLAGS="--cfg loom" cargo test --test loom --release  # 축4
```

축4가 `--cfg loom` 을 따로 요구하는 이유는 원자 연산이 `loom` 의 것으로 바뀌어야 스케줄을
훑을 수 있기 때문이다. 그 전환은 `contract/src/fixtures.rs` 의 `cfg(loom)` 이 한다.
`--release` 는 필수가 아니지만 탐색이 눈에 띄게 빨라진다.

vector 를 다시 뽑을 때는 저장소 루트에서:

```bash
bun run tools/emit-vectors.ts          # 재생성
bun run tools/emit-vectors.ts --check  # 계약과 어긋났는지만 본다(CI 용)
```

## 이 하네스가 보이지 못하는 것

- **임의 스레드 수에 대한 lock-freedom 이 아니다.** `loom` 이 훑는 것은 지정한 스레드
  수·연산 수의 스케줄 전부다. 그 범위 안에서 굶는 스레드가 없다는 뜻이고, 범위를 늘리는
  것으로만 좁혀진다. 모델 검사기의 한계이지 계측의 한계가 아니다.
- **겹치지 않은 연산이 섞인 히스토리를 아직 다루지 않는다.** 지금 모으는 히스토리는 전부
  겹쳐 실행된 것이라 실시간 순서가 강제하는 바가 없다. 겹치지 않는 연산이 들어오면
  `linearize.rs` 에 실시간 순서 제약을 더해야 한다 — 그 자리를 주석으로 비워 뒀다.
