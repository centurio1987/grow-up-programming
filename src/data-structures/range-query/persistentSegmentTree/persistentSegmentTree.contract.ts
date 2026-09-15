/**
 * `range-query/persistentSegmentTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./persistentSegmentTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 초기 수열과 결합과 항등원을 생성자로 받는 구조라
 * `range-query/segmentTree` 와 같은 이유로 `reset(n)` 이 그 크기의 구조를 다시 세우고 버린 것의 비용을 이어서 센다.
 * 범위 밖 인자를 문자열 하나로 바꾸는 것도 그쪽 머리말 그대로다. 껍데기는 계약의 일부가 아니다.
 *
 * **결합은 `segmentTree` 스위트의 `firstNonZero` 를 그대로 가져온다.** 되돌리는 값이 없고 교환적이지 않아 두
 * 계열(앞구간 차로 답하기 · 만나는 차례로 접기)을 함께 겨눈다는 선택 근거가 버전이 붙어도 그대로다.
 *
 * **인자 생성기는 모델을 못 받으므로**(불변 사실 261) 무작위 시퀀스의 버전 인자는 **받은 버전 수로 나눈 나머지**로 읽는다
 * — 껍데기(`VersionedSized#pick`)와 모델이 같은 규칙으로 지금 있는 버전 하나를 고른다. 음수는 그대로 넘겨 거절 경로를
 * 돌리고, 없는 큰 번호 · 소수 번호는 경계 케이스가 짚는다. 번호를 그대로 뽑으면 시퀀스 앞쪽에서 거절만 나거나(범위를 넓힐
 * 때) 뒤쪽 버전을 한 번도 안 묻는다(범위를 좁힐 때). **vector 를 재생하는 쪽이 이 규칙을 함께 옮겨야 한다.**
 *
 * **시나리오가 둘이고 둘 다 적대적이다.** 준비에서 버전을 자리 수만큼 한 줄로 쌓고, 재는 걸음은 **첫 버전과 사슬 끝을
 * 번갈아** 가리킨다(`STEPS` 걸음 — 두 시나리오가 `worst` 라 n 에 묶지 않는다, §「`worst` 시나리오는 재는 호출 수를 n 에
 * 묶지 않아도 된다」). 사슬 길이가 자리 수와 함께 자라므로 상한에 없는 **버전 수에 기대는 구현**도 사다리를 따라
 * 자란다.
 */

import type { ContractSpec } from "../../_contract/runContract";
import {
  firstNonZero,
  IDENTITY,
  initialValues,
  SLOTS,
} from "../segmentTree/segmentTree.contract";

export { firstNonZero, IDENTITY, initialValues, SLOTS };

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface PersistentSegmentTreeContract {
  update(version: number, i: number, value: number): number;
  query(version: number, from: number, to: number): number;
}

type Built = PersistentSegmentTreeContract & { __cost?: number };

/** 축3 시나리오가 재는 호출 수. */
export const STEPS = 32;

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe(call: () => unknown): unknown {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 하네스용 껍데기. `reset(n)` 으로 그 크기의 구조를 다시 세운다 — 버전도 0 하나로 돌아간다. */
export class VersionedSized implements PersistentSegmentTreeContract {
  readonly #make: (values: number[]) => Built;
  #impl: Built;
  #carried = 0;
  /** 받아들여진 갱신 수 + 1. 무작위 시퀀스의 버전 인자를 읽는 데만 쓴다 — 구현에 묻지 않는다. */
  #versions = 1;

  constructor(make: (values: number[]) => Built) {
    this.#make = make;
    this.#impl = make(initialValues(SLOTS));
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  reset(n: number): void {
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = this.#make(initialValues(n));
    this.#versions = 1;
  }

  /** 무작위 시퀀스의 버전 인자 — 음수는 그대로, 아니면 받은 버전 수로 나눈 나머지. */
  pick(raw: number): number {
    return raw < 0 ? raw : raw % this.#versions;
  }

  update(version: number, i: number, value: number): number {
    const made = this.#impl.update(version, i, value);
    this.#versions += 1;
    return made;
  }

  query(version: number, from: number, to: number): number {
    return this.#impl.query(version, from, to);
  }
}

/**
 * 축1 참조 모델. **버전마다 자리 값 배열의 사본**을 든다 — 헤더 표의 의미 열을 글자 그대로 옮긴 것이다. 같은 모양이
 * 축3에서는 갱신이 자리 수에 비례하는 자명한 구현이다.
 */
interface Model {
  versions: number[][];
}

function versionInRange(model: Model, version: number): boolean {
  return (
    Number.isInteger(version) && version >= 0 && version < model.versions.length
  );
}

function slotInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < SLOTS;
}

function edgeInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i <= SLOTS;
}

/** 무작위 버전 인자. 음수 하나(-1)를 섞고 나머지는 나눈 나머지로 읽힌다(파일 머리말). */
function someVersion(rng: () => number): number {
  return Math.floor(rng() * 1025) - 1;
}

function pickInModel(model: Model, raw: number): number {
  return raw < 0 ? raw : raw % model.versions.length;
}

/** 무작위 구간. `from <= to` 를 지켜 뽑는다 — 뒤집힌 구간은 경계 케이스가 따로 본다. */
function span(rng: () => number): [number, number] {
  const a = Math.floor(rng() * (SLOTS + 1));
  const b = Math.floor(rng() * (SLOTS + 1));
  return a <= b ? [a, b] : [b, a];
}

/** 시나리오 준비 — 버전 0 에서 자리 수만큼 한 줄로 갱신을 쌓고 사슬 끝 번호를 돌려준다. 재지 않는다. */
function chain(impl: VersionedSized, n: number): number {
  let tip = 0;
  for (let step = 0; step < n; step++) {
    tip = impl.update(tip, (step * 7) % n, (step % 5) + 1);
  }
  return tip;
}

export const persistentSegmentTreeContract: ContractSpec<
  VersionedSized,
  Model
> = {
  name: "PersistentSegmentTree",
  grade: "complexity",
  model: () => ({ versions: [initialValues(SLOTS)] }),

  ops: [
    {
      name: "update",
      // 자리에 범위 밖 둘(-1 · SLOTS)을 섞고 값에 항등원 0 을 섞는다.
      arg: (rng) => [
        someVersion(rng),
        Math.floor(rng() * (SLOTS + 2)) - 1,
        Math.floor(rng() * 7) - 3,
      ],
      onImpl: (impl, arg) => {
        const [raw, i, value] = arg as [number, number, number];
        return observe(() => impl.update(impl.pick(raw), i, value));
      },
      onModel: (model, arg) => {
        const [raw, i, value] = arg as [number, number, number];
        const version = pickInModel(model, raw);
        if (!versionInRange(model, version) || !slotInRange(i)) {
          return OUT_OF_RANGE;
        }
        const next = [...(model.versions[version] as number[])];
        next[i] = value;
        model.versions.push(next);
        return model.versions.length - 1;
      },
    },
    {
      name: "query",
      arg: (rng) => [someVersion(rng), ...span(rng)],
      onImpl: (impl, arg) => {
        const [raw, from, to] = arg as [number, number, number];
        return observe(() => impl.query(impl.pick(raw), from, to));
      },
      onModel: (model, arg) => {
        const [raw, from, to] = arg as [number, number, number];
        const version = pickInModel(model, raw);
        if (
          !versionInRange(model, version) ||
          !edgeInRange(from) ||
          !edgeInRange(to) ||
          from > to
        ) {
          return OUT_OF_RANGE;
        }
        const values = model.versions[version] as number[];
        let acc = IDENTITY;
        for (let at = from; at < to; at++) {
          acc = firstNonZero(acc, values[at] as number);
        }
        return acc;
      },
    },
  ],

  edges: [
    {
      // 버전 모형의 첫 줄 — 갱신이 돌려주는 번호는 만든 차례이고, 갱신은 바탕 버전을 바꾸지 않는다.
      // 자리를 제자리에서 고치는 구현이 여기서 갈린다(`latestOnlyPersistentFold` — 불변 사실 67 의 셋째 걸음).
      name: "갱신은 만든 차례의 번호를 돌려주고 바탕 버전은 그대로다",
      steps: [
        { op: "query", arg: [0, 3, 4] },
        { op: "update", arg: [0, 3, 7] },
        { op: "query", arg: [1, 3, 4] },
        { op: "query", arg: [0, 3, 4] },
        { op: "update", arg: [1, 4, 9] },
        { op: "query", arg: [2, 3, 5] },
        { op: "query", arg: [1, 3, 5] },
        { op: "query", arg: [0, 0, SLOTS] },
      ],
    },
    {
      // 옛 버전에서 갈라 지은 두 버전은 서로의 갱신을 보지 않는다 — 버전이 줄이 아니라 나무다.
      name: "한 버전에서 갈라 지은 버전들은 서로의 갱신을 보지 않는다",
      steps: [
        { op: "update", arg: [0, 1, 5] },
        { op: "update", arg: [0, 1, 0] },
        { op: "update", arg: [1, 2, 0] },
        { op: "update", arg: [2, 2, 8] },
        { op: "query", arg: [1, 1, 3] },
        { op: "query", arg: [2, 1, 3] },
        { op: "query", arg: [3, 1, 3] },
        { op: "query", arg: [4, 1, 3] },
        { op: "query", arg: [0, 1, 3] },
      ],
    },
    {
      // 경계가 `[0, n]` 인 인자는 경계 케이스가 `n` 을 반드시 짚는다(불변 사실 166).
      name: "마지막 자리는 오른쪽 끝이 n 인 구간에서만 보인다",
      steps: [
        { op: "update", arg: [0, SLOTS - 1, 41] },
        { op: "query", arg: [1, SLOTS - 1, SLOTS - 1] },
        { op: "query", arg: [1, SLOTS - 1, SLOTS] },
        { op: "query", arg: [0, SLOTS - 1, SLOTS] },
        { op: "query", arg: [1, 0, SLOTS] },
      ],
    },
    {
      // **접는 차례가 계약이다.** 옛 버전과 새 버전에서 같은 구간의 답이 왼쪽 자리에서 먼저 정해진다.
      name: "왼쪽부터 접는다 — 버전마다 차례를 바꾸면 답이 갈린다",
      steps: [
        { op: "update", arg: [0, 1, 0] },
        { op: "update", arg: [1, 2, 0] },
        { op: "update", arg: [2, 3, 5] },
        { op: "update", arg: [3, 6, 9] },
        { op: "query", arg: [4, 1, 7] },
        { op: "query", arg: [4, 4, 8] },
        { op: "query", arg: [3, 4, 8] },
        { op: "query", arg: [2, 1, 7] },
      ],
    },
    {
      // 빈 구간의 답이 항등원이라는 것은 주입 정책이 항등원을 받는 이유다 — 어느 버전에서 물어도 같다.
      name: "빈 구간은 어느 버전에서 물어도 항등원이다",
      steps: [
        { op: "query", arg: [0, 0, 0] },
        { op: "update", arg: [0, 5, 3] },
        { op: "query", arg: [1, 7, 7] },
        { op: "query", arg: [1, SLOTS, SLOTS] },
        { op: "query", arg: [0, 5, 5] },
      ],
    },
    {
      // 같은 값으로 고쳐도 새 버전이 생긴다 — 버전을 세는 단위는 갱신 호출이다.
      name: "같은 값으로 고쳐도 새 버전이 생긴다",
      steps: [
        { op: "update", arg: [0, 1, 2] },
        { op: "update", arg: [1, 1, 2] },
        { op: "query", arg: [2, 0, SLOTS] },
        { op: "update", arg: [2, 0, 4] },
        { op: "query", arg: [3, 0, 1] },
      ],
    },
    {
      // 계약의 주입 정책. 거절된 호출은 버전을 만들지 않는다 — 마지막 갱신이 1 을 돌려주는 것이 그 관측이다.
      name: "없는 버전·범위 밖 자리·경계·뒤집힌 구간은 RangeError 이고 버전이 생기지 않는다",
      steps: [
        { op: "update", arg: [1, 0, 3] },
        { op: "update", arg: [-1, 0, 3] },
        { op: "update", arg: [0.5, 0, 3] },
        { op: "update", arg: [0, SLOTS, 3] },
        { op: "update", arg: [0, -1, 3] },
        { op: "update", arg: [0, 1.5, 3] },
        { op: "query", arg: [1, 0, 4] },
        { op: "query", arg: [0, 0, SLOTS + 1] },
        { op: "query", arg: [0, -1, 3] },
        { op: "query", arg: [0, 5, 2] },
        { op: "update", arg: [0, 2, 8] },
        { op: "query", arg: [1, 2, 3] },
        { op: "query", arg: [2, 2, 3] },
      ],
    },
  ],

  /**
   * 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다 —
   * `check-contract.ts` 가 헤더의 번호 항목 수와 이 길이를 대조한다.
   */
  invariants: [],

  scenarios: [
    {
      covers: ["update"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **자리 수만큼 쌓은 사슬에서 첫 버전과 사슬 끝을 번갈아 고치기.** 살아 있는 구조 하나를 버전 사이로 옮겨 다니는
      // 구현(`rerootingPersistentFold`)은 두 버전의 거리가 사슬 길이라 한 걸음이 그만큼 걸린다. 버전마다 사본을 짓는
      // 구현은 어느 걸음이든 자리 수에 비례한다. 바뀐 자리만 적어 두는 구현(`replayingPersistentFold`)과 짓기를 미루는
      // 구현(`bufferedPersistentFold`)은 갱신이 상수라 통과한다 — 걸리는 자리가 질의라서다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        let tip = chain(impl, n);
        for (let k = 0; k < STEPS; k++) {
          const base = k % 2 === 0 ? 0 : tip;
          ctx.step(() => {
            const made = impl.update(base, (k * 11) % n, k + 1);
            if (base === tip) tip = made;
          });
        }
      },
    },
    {
      covers: ["query"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **같은 사슬에서 첫 버전과 사슬 끝을 번갈아, 양 끝이 어긋난 구간 `[1, n - 1)` 로 묻기.** 경계가 둘인 질의라
      // 한 줄 훑기가 인자 공간을 포섭하지 않는 것은 `segmentTree` 와 같다(불변 사실 167). 버전 쪽에서는 세 계열을
      // 겨눈다 — 바뀐 자리만 적어 두는 구현은 사슬 끝에서 사슬 길이만큼, 옮겨 다니는 구현은 걸음마다 사슬 길이만큼,
      // 짓기를 미루는 구현은 사슬 끝을 처음 물을 때 쌓인 갱신 전부를 짓는다(`worst` 가 단일 호출 최대라서 걸린다).
      run: (impl, n, ctx) => {
        impl.reset(n);
        const tip = chain(impl, n);
        for (let k = 0; k < STEPS; k++) {
          const version = k % 2 === 0 ? 0 : tip;
          ctx.step(() => void impl.query(version, 1, n - 1));
        }
      },
    },
  ],
};
