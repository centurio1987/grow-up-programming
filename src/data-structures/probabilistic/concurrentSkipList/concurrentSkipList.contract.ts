/**
 * `probabilistic/concurrentSkipList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./concurrentSkipList.ts` 헤더 한 곳이고
 * (규약1), 여기 있는 것은 그 계약을 기계가 읽는 형태로 옮긴 것뿐이다.
 *
 * **읽는 쪽이 하나뿐이라는 점이 다른 구조와 다르다.** 검증 등급이 `concurrency` 이므로
 * `runContract` 는 이 명세로 TS 스위트를 돌지 않는다 — 부르면 그 자리에서 실패한다
 * (`src/data-structures/_contract/runContract.ts`). 그래서 `<name>.test.ts` 가 없고, 이
 * 파일을 실제로 읽는 것은 `tools/emit-vectors.ts` 와 `tools/check-contract.ts` 둘이다.
 * 앞엣것이 여기 참조 모델을 돌려 `rust/vectors/ConcurrentSkipList.json` 을 뽑고, Rust
 * 정본이 그것을 재생하는 것이 이 구조의 축1이다(§규약2 「축1 — 언어 중립 test vector」).
 *
 * 그러므로 `ops` 의 `onImpl` 은 이 구조에서 **한 번도 불리지 않는다.** 지우지 않는 이유는
 * `ContractSpec` 이 요구하는 형태이고, 계약 표면을 그대로 옮겨 적는 자리가 여기이기
 * 때문이다. 축2·축3은 공집합이다 — 헤더의 불변식 절이 "없다"이고, 축3 시나리오는 돌 하네스가
 * 없다(§규약2 「축4 — 동시성」).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface ConcurrentSkipListContract<T> {
  insert(value: T): boolean;
  delete(value: T): boolean;
  has(value: T): boolean;
  min(): T | null;
  max(): T | null;
}

/**
 * 축1 참조 모델. 오름차순으로 정렬된 중복 없는 배열이면 된다 — 축1은 의미만 보고 비용은
 * 보지 않는다. 이 모델이 vector 의 기대값을 만들고, Rust 쪽 `ModelSet` 이 같은 vector 를
 * 통과해야 하므로 두 언어의 모델이 갈리면 그 자리에서 드러난다.
 */
type Model = number[];

/** 값의 범위. 좁게 잡아야 200회 무작위 시퀀스에서 중복 삽입과 없는 값 삭제가 실제로 나온다. */
const VALUE_RANGE = 20;

function insertInto(model: Model, value: number): boolean {
  const at = model.findIndex((each) => each >= value);
  if (at >= 0 && model[at] === value) return false;
  model.splice(at < 0 ? model.length : at, 0, value);
  return true;
}

export const concurrentSkipListContract: ContractSpec<
  ConcurrentSkipListContract<number>,
  Model
> = {
  name: "ConcurrentSkipList",
  grade: "concurrency",
  model: () => [],

  ops: [
    {
      name: "insert",
      arg: (rng) => Math.floor(rng() * VALUE_RANGE),
      onImpl: (impl, arg) => impl.insert(arg as number),
      onModel: (model, arg) => insertInto(model, arg as number),
    },
    {
      name: "delete",
      arg: (rng) => Math.floor(rng() * VALUE_RANGE),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => {
        const at = model.indexOf(arg as number);
        if (at < 0) return false;
        model.splice(at, 1);
        return true;
      },
    },
    {
      name: "has",
      arg: (rng) => Math.floor(rng() * VALUE_RANGE),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.includes(arg as number),
    },
    {
      name: "min",
      arg: () => undefined,
      onImpl: (impl) => impl.min(),
      onModel: (model) => (model.length === 0 ? null : (model[0] as number)),
    },
    {
      name: "max",
      arg: () => undefined,
      onImpl: (impl) => impl.max(),
      onModel: (model) =>
        model.length === 0 ? null : (model[model.length - 1] as number),
    },
  ],

  edges: [
    {
      name: "빈 구조에서 has 는 거짓이고 min·max 는 null 이다",
      steps: [{ op: "has", arg: 1 }, { op: "min" }, { op: "max" }],
    },
    {
      name: "같은 값을 두 번 넣으면 두 번째가 false 다",
      steps: [
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "has", arg: 5 },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "넣은 순서와 무관하게 양 끝이 정해진다",
      steps: [
        { op: "insert", arg: 9 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 7 },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "양 끝을 지우면 다음 값이 양 끝이 된다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 4 },
        { op: "insert", arg: 8 },
        { op: "delete", arg: 1 },
        { op: "min" },
        { op: "delete", arg: 8 },
        { op: "max" },
      ],
    },
    {
      name: "없는 값 삭제는 false 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "insert", arg: 3 },
        { op: "delete", arg: 6 },
        { op: "has", arg: 3 },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "지웠다 다시 넣으면 새로 담긴다",
      steps: [
        { op: "insert", arg: 2 },
        { op: "delete", arg: 2 },
        { op: "has", arg: 2 },
        { op: "insert", arg: 2 },
        { op: "has", arg: 2 },
        { op: "min" },
      ],
    },
    {
      name: "전부 지우면 다시 빈 구조가 된다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "delete", arg: 2 },
        { op: "delete", arg: 1 },
        { op: "min" },
        { op: "max" },
        { op: "has", arg: 1 },
      ],
    },
  ],

  /** 헤더: "불변식. 없다." 공집합이지 미작성이 아니다. */
  invariants: [],

  /**
   * 축3 시나리오가 없다. **이 구조에만 있는 사정이고, 등급이 축을 끈 것이 아니다**
   * (불변 사실 22). 성장률을 재는 하네스가 TS 에 있는데 이 계약의 정본은 Rust 에 있어서,
   * 잴 대상과 재는 자가 다른 언어에 있다. `tools/check-contract.ts` 가 `concurrency`
   * 등급을 시나리오 대조에서 뺀 근거가 이것이고, 그래서 이 계약의 상한은 지금 어느 축도
   * 판정하지 않는다 — 그 사실을 §규약2 에 적어 두었다.
   */
  scenarios: [],
};
