/**
 * `tree/merkleTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./merkleTree.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기가 나르는 것이 셋이다**(불변 사실 83). ① 생성자 행 — `reindex(blocks)` 가 새로 짓고 버린 구조의 비용은 이어서 센다. 이 구조는
 * 불변 구조가 아니다(`update` 가 있다) — 껍데기가 필요한 것은 축3 사다리와 「다시 지은 뒤에도 옛 뿌리를 검증한다」 때문이다. ② **뿌리와
 * 증명은 구현이 고르는 토큰이라 값으로 견줄 수 없다** — 껍데기가 계약의 말(수열 · 자리 · 블록)을 호출과 같은 규칙으로 따라 적어 두고,
 * 토큰은 그 기록에 걸어 관측값을 계약의 말로 바꾼다(T2-04 핸들 번호와 같은 자리). ③ **검증의 인자를 인자 생성기가 지을 수 없다** — 모델을
 * 못 받으므로(`src/data-structures/_contract/runContract.ts:37`) 인자는 「몇 번째 증명 기록 · 몇 번째 뿌리 기록 · 자리 어긋남 · 틀린 블록 여부 ·
 * 증명 변형」 다섯 수이고, 껍데기와 모델이 같은 규칙으로 읽는다.
 *
 * **관측값.**
 * - `rootHash` — `[이 뿌리를 처음 받았을 때의 수열, 이 수열이 전에 받은 뿌리와 같은가]`. 결속(다른 수열 → 다른 뿌리)과 결정성(같은 수열 → 같은
 *   뿌리)을 한 번에 본다. 기록은 껍데기가 사는 동안 남아 **다시 지은 인스턴스 사이에서도** 견준다.
 * - `getProof` — `"증명"` 이거나 `"RangeError"`. 증명 토큰은 기록만 하고 값으로 견주지 않는다.
 * - `verify` — 계약이 답을 정한 자리에서만 그 답(`true` · `false`)을, 정하지 않은 자리(블록은 맞는데 증명이 그 뿌리 · 그 자리의 증명이
 *   아니다)는 `"자유"` 를 관측값으로 둔다. 증명 기록이 없으면 `"증명 없음"`.
 *
 * **해시는 둘을 쓴다.** 축1 은 단사인 `wrap`(받은 문자열을 괄호로 감싼다 — 주입자 의무 ②를 실제로 지켜 결속 · 건전성이 결정론으로 선다), 축3 은
 * 32비트 섞기 `digest`(짧아서 빠르고 충돌할 수 있다 — 비용만 잰다). 축3 계측 경로는 `injected` 라 해시 호출을 하네스가 밖에서 센다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표에서 생성자를 뺀 네 행을 옮긴 표면. 생성자 행은 껍데기의 `reindex` 가 나른다. */
export interface MerkleTreeContract {
  rootHash(): string;
  getProof(index: number): string[];
  verify(
    rootHash: string,
    index: number,
    block: string,
    proof: string[],
  ): boolean;
  update(index: number, block: string): void;
}

type Built = MerkleTreeContract & { __cost?: number };

/** 축1 해시 — 받은 문자열을 괄호로 감싼다. 단사다. */
export const wrap = (data: string): string => `{${data}}`;

/** 축3 해시 — FNV-1a 32비트를 16진수 8자리로. 충돌할 수 있어 축1 에는 쓰지 않는다. */
export function digest(data: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** 두 수열이 같은가. */
function sameBlocks(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((block, i) => block === b[i]);
}

function validIndex(size: number, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < size;
}

/** 무작위 인자의 자리 읽기 — 음수 · 정수 아닌 값은 그대로, 아니면 지금 블록 수 + 1 로 나눈 나머지(끝 하나 밖을 짚는다). */
function readIndex(size: number, raw: number): number {
  return raw < 0 || !Number.isInteger(raw) ? raw : raw % (size + 1);
}

/** `verify` 인자 — `[증명 기록 뒤에서 몇째, 뿌리 기록 뒤에서 몇째, 자리 어긋남, 틀린 블록이면 1, 증명 변형 0~3]`. */
export type VerifyRecipe = readonly [number, number, number, number, number];

/** 증명 변형 — 0 그대로 · 1 끝 토큰 빼기 · 2 뒤집기 · 3 첫 토큰 하나 더 붙이기. */
function tamper(proof: readonly string[], kind: number): string[] {
  if (kind === 1) return proof.slice(0, -1);
  if (kind === 2) return [...proof].reverse();
  if (kind === 3) return [...proof, proof[0] ?? ""];
  return [...proof];
}

interface ProofRecord {
  readonly blocks: readonly string[];
  readonly index: number;
}

/**
 * 검증 관측값의 기대 — 뿌리 기록의 수열 `rooted`, 증명 기록의 수열 · 자리, 물은 자리 · 블록 · 변형으로 정한다. 껍데기와 모델이 같은 함수를
 * 부른다(헤더 「연산 계약」의 `verify` 행을 그대로 옮긴 것).
 */
function expectVerify(
  rooted: readonly string[],
  proved: ProofRecord,
  index: number,
  block: string,
  kind: number,
): boolean | "자유" {
  if (!validIndex(rooted.length, index) || rooted[index] !== block)
    return false;
  if (kind === 0 && index === proved.index && sameBlocks(rooted, proved.blocks))
    return true;
  return "자유";
}

/** 인자 해석 — 증명 기록 · 뿌리 기록 · 자리 · 블록. 껍데기와 모델이 같은 규칙으로 읽는다. */
function resolve<R extends ProofRecord>(
  records: readonly R[],
  recipe: VerifyRecipe,
): { proved: R; rooted: R; index: number; block: string; kind: number } {
  const [proofBack, rootBack, shift, wrong, kind] = recipe;
  const proved = records[
    records.length - 1 - (proofBack % records.length)
  ] as R;
  const rooted = records[records.length - 1 - (rootBack % records.length)] as R;
  const index = proved.index + shift;
  const honest = proved.blocks[proved.index] as string;
  const block = wrong ? `${rooted.blocks[index] ?? honest}~` : honest;
  return { proved, rooted, index, block, kind };
}

interface Recorded extends ProofRecord {
  readonly root: string;
  readonly proof: readonly string[];
}

/**
 * 하네스용 껍데기. `reindex` 로 새 수열을 짓고 버린 구조의 비용은 이어서 센다. 처음에는 빈 수열로 짓는다. 계약의 말(수열)은 **호출 인자와
 * 계약의 규칙으로** 따라 적는다 — 구현에 묻지 않는다.
 *
 * 계약에 없는 연산이므로 `check-contract.ts` 의 명세↔스텁·정본 대조에는 걸리지 않는다.
 */
export class Rebuildable implements MerkleTreeContract {
  readonly #make: (blocks: string[]) => Built;
  #index: Built;
  #carried = 0;
  #blocks: string[] = [];
  readonly #named = new Map<string, readonly string[]>();
  readonly #tokenOf = new Map<string, string>();
  readonly #records: Recorded[] = [];

  constructor(make: (blocks: string[]) => Built) {
    this.#make = make;
    this.#index = make([]);
  }

  get __cost(): number {
    return this.#carried + (this.#index.__cost ?? 0);
  }

  get size(): number {
    return this.#blocks.length;
  }

  reindex(blocks: string[]): void {
    this.#carried += this.#index.__cost ?? 0;
    this.#blocks = [...blocks];
    this.#index = this.#make(blocks);
  }

  rootHash(): string {
    return this.#index.rootHash();
  }

  getProof(index: number): string[] {
    return this.#index.getProof(index);
  }

  verify(
    rootHash: string,
    index: number,
    block: string,
    proof: string[],
  ): boolean {
    return this.#index.verify(rootHash, index, block, proof);
  }

  update(index: number, block: string): void {
    this.#index.update(index, block);
    if (validIndex(this.#blocks.length, index)) this.#blocks[index] = block;
  }

  /** `rootHash` 관측값 — `[이 뿌리가 처음 가리킨 수열, 이 수열이 전에 받은 뿌리와 같은가]`. */
  observeRoot(): [readonly string[], boolean] {
    const token = this.#index.rootHash();
    const key = JSON.stringify(this.#blocks);
    const named = this.#named.get(token);
    const prior = this.#tokenOf.get(key);
    if (named === undefined) this.#named.set(token, [...this.#blocks]);
    if (prior === undefined) this.#tokenOf.set(key, token);
    return [named ?? [...this.#blocks], prior === undefined || prior === token];
  }

  observeProof(raw: number): "증명" | "RangeError" {
    const index = readIndex(this.#blocks.length, raw);
    let proof: string[];
    try {
      proof = this.#index.getProof(index);
    } catch (error) {
      if (error instanceof RangeError) return "RangeError";
      throw error;
    }
    this.#records.push({
      root: this.#index.rootHash(),
      blocks: [...this.#blocks],
      index,
      proof: [...proof],
    });
    return "증명";
  }

  observeVerify(recipe: VerifyRecipe): boolean | "자유" | "증명 없음" {
    if (this.#records.length === 0) return "증명 없음";
    const { proved, rooted, index, block, kind } = resolve(
      this.#records,
      recipe,
    );
    const expected = expectVerify(rooted.blocks, proved, index, block, kind);
    if (expected === "자유") return "자유";
    return this.#index.verify(
      rooted.root,
      index,
      block,
      tamper(proved.proof, kind),
    );
  }
}

/** 축1 참조 모델. 수열과 증명 기록(그때의 수열 · 자리)만 든다 — 토큰을 모른다. */
interface Model {
  blocks: string[];
  records: ProofRecord[];
}

const OUT_OF_RANGE = "RangeError";

/** 축1 블록 알파벳 — 좁아야 같은 수열 · 같은 블록이 되풀이된다. 빈 블록도 정당하다. */
const ALPHABET = ["a", "b", "c", "ab", ""];

/** 축3 수열. */
export function blocksOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `b${i}`);
}

/** 사다리 위 흩어진 자리 — 이웃한 호출이 나무의 먼 가지를 번갈아 짚는다. */
export function scattered(k: number, n: number): number {
  return (k * 7919) % n;
}

/** 질의 시나리오가 재는 호출 수. `worst` 라 n 에 묶지 않는다(§「`worst` 시나리오는 재는 호출 수를 n 에 묶지 않아도 된다」). */
export const STEPS = 32;

export const merkleTreeContract: ContractSpec<Rebuildable, Model> = {
  name: "MerkleTree",
  grade: "complexity",
  model: () => ({ blocks: [], records: [] }),

  ops: [
    {
      name: "reindex",
      arg: (rng) =>
        Array.from(
          { length: Math.floor(rng() * 7) },
          () => ALPHABET[Math.floor(rng() * ALPHABET.length)] as string,
        ),
      onImpl: (impl, arg) => {
        impl.reindex([...(arg as string[])]);
      },
      onModel: (model, arg) => {
        model.blocks = [...(arg as string[])];
      },
    },
    {
      name: "rootHash",
      arg: () => undefined,
      onImpl: (impl) => impl.observeRoot(),
      onModel: (model) => [[...model.blocks], true],
    },
    {
      name: "getProof",
      arg: (rng) => Math.floor(rng() * 9) - 1,
      onImpl: (impl, arg) => impl.observeProof(arg as number),
      onModel: (model, arg) => {
        const index = readIndex(model.blocks.length, arg as number);
        if (!validIndex(model.blocks.length, index)) return OUT_OF_RANGE;
        model.records.push({ blocks: [...model.blocks], index });
        return "증명";
      },
    },
    {
      name: "verify",
      // 증명 기록 뒤 0~3 째 · 뿌리 기록은 70% 가 같은 기록 · 자리 어긋남 20% · 틀린 블록 30% · 증명 변형 30%.
      arg: (rng): VerifyRecipe => [
        Math.floor(rng() * 4),
        rng() < 0.7 ? 0 : 1 + Math.floor(rng() * 3),
        rng() < 0.8 ? 0 : rng() < 0.5 ? -1 : 1,
        rng() < 0.3 ? 1 : 0,
        rng() < 0.7 ? 0 : 1 + Math.floor(rng() * 3),
      ],
      onImpl: (impl, arg) => impl.observeVerify(arg as VerifyRecipe),
      onModel: (model, arg) => {
        if (model.records.length === 0) return "증명 없음";
        const { proved, rooted, index, block, kind } = resolve(
          model.records,
          arg as VerifyRecipe,
        );
        return expectVerify(rooted.blocks, proved, index, block, kind);
      },
    },
    {
      name: "update",
      arg: (rng) => [
        Math.floor(rng() * 9) - 1,
        ALPHABET[Math.floor(rng() * ALPHABET.length)] as string,
      ],
      onImpl: (impl, arg) => {
        const [raw, block] = arg as [number, string];
        const index = readIndex(impl.size, raw);
        try {
          impl.update(index, block);
          return undefined;
        } catch (error) {
          if (error instanceof RangeError) return OUT_OF_RANGE;
          throw error;
        }
      },
      onModel: (model, arg) => {
        const [raw, block] = arg as [number, string];
        const index = readIndex(model.blocks.length, raw);
        if (!validIndex(model.blocks.length, index)) return OUT_OF_RANGE;
        model.blocks[index] = block;
        return undefined;
      },
    },
  ],

  edges: [
    {
      name: "빈 수열도 뿌리가 있고 증명은 없으며, 블록 하나짜리와 뿌리가 다르다",
      steps: [
        { op: "rootHash" },
        { op: "getProof", arg: 0 },
        { op: "verify", arg: [0, 0, 0, 0, 0] },
        { op: "reindex", arg: [""] },
        { op: "rootHash" },
        { op: "getProof", arg: 0 },
        { op: "verify", arg: [0, 0, 0, 0, 0] },
      ],
    },
    {
      name: "같은 수열이면 같은 뿌리 — 고쳤다 되돌리면 뿌리도 돌아온다",
      steps: [
        { op: "reindex", arg: ["a", "b", "c", "a"] },
        { op: "rootHash" },
        { op: "update", arg: [1, "x"] },
        { op: "rootHash" },
        { op: "update", arg: [1, "b"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["a", "b", "c", "a"] },
        { op: "rootHash" },
      ],
    },
    {
      // 물려받은 문서의 「홀수 리프는 마지막 리프를 복제」 설계가 여기서 갈린다 — 끝을 복제한 수열과 뿌리가 같아진다.
      name: "다른 수열이면 다른 뿌리 — 끝 블록을 한 번 더 붙인 수열 · 블록을 이어 붙인 수열과도 다르다",
      steps: [
        { op: "reindex", arg: ["a", "b", "c"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["a", "b", "c", "c"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["a"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["a", "a"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["ab", "c"] },
        { op: "rootHash" },
        { op: "reindex", arg: ["a", "bc"] },
        { op: "rootHash" },
      ],
    },
    {
      // 끝 블록을 복제해 채우는 설계는 없는 자리 3 의 증명을 자리 2 의 증명으로 받는다.
      name: "없는 자리를 가리키는 검증은 거짓이다 — 끝 블록의 증명을 한 칸 뒤 자리로 물어도",
      steps: [
        { op: "reindex", arg: ["a", "b", "c"] },
        { op: "getProof", arg: 2 },
        { op: "verify", arg: [0, 0, 0, 0, 0] },
        { op: "verify", arg: [0, 0, 1, 0, 0] },
        { op: "verify", arg: [0, 0, -1, 0, 0] },
      ],
    },
    {
      name: "틀린 블록은 어떤 증명 변형으로도 거짓이다",
      steps: [
        { op: "reindex", arg: ["a", "b", "c", "a", "b"] },
        { op: "getProof", arg: 4 },
        { op: "verify", arg: [0, 0, 0, 1, 0] },
        { op: "verify", arg: [0, 0, 0, 1, 1] },
        { op: "verify", arg: [0, 0, 0, 1, 2] },
        { op: "verify", arg: [0, 0, 0, 1, 3] },
        { op: "verify", arg: [0, 0, 0, 0, 0] },
      ],
    },
    {
      // 검증이 담긴 블록을 읽으면 여기서 갈린다 — 고친 뒤에도, 다시 지은 뒤에도 옛 뿌리 · 옛 증명 · 옛 블록은 참이다.
      name: "검증은 담긴 블록을 읽지 않는다 — 고친 뒤와 다시 지은 뒤에도 옛 뿌리의 증명은 참이다",
      steps: [
        { op: "reindex", arg: ["a", "b", "c", "a"] },
        { op: "getProof", arg: 2 },
        { op: "update", arg: [2, "x"] },
        { op: "getProof", arg: 2 },
        { op: "verify", arg: [1, 1, 0, 0, 0] },
        { op: "verify", arg: [1, 0, 0, 0, 0] },
        { op: "verify", arg: [0, 0, 0, 0, 0] },
        { op: "reindex", arg: ["c"] },
        { op: "verify", arg: [1, 1, 0, 0, 0] },
        { op: "rootHash" },
      ],
    },
    {
      name: "범위 밖 · 정수 아닌 자리는 증명 · 고치기에서 RangeError 다",
      steps: [
        { op: "reindex", arg: ["a", "b"] },
        { op: "getProof", arg: -1 },
        { op: "getProof", arg: 2 },
        { op: "getProof", arg: 1.5 },
        { op: "update", arg: [2, "x"] },
        { op: "update", arg: [-1, "x"] },
        { op: "update", arg: [0.5, "x"] },
        { op: "rootHash" },
      ],
    },
  ],

  /** 헤더 불변식 절이 「없다」이므로 빈 배열이다 — `check-contract.ts` 가 헤더의 번호 항목 수와 이 길이를 대조한다. */
  invariants: [],

  scenarios: [
    {
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // **짓기 한 번.** 블록의 모양은 짓는 비용을 바꾸지 않아 적대적 입력이 없다.
      run: (impl, n, ctx) => {
        const blocks = blocksOf(n);
        ctx.step(() => impl.reindex(blocks));
      },
    },
    {
      covers: ["rootHash"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **짓자마자 한 번, 흩어진 자리 n 곳을 고친 뒤 `STEPS` 번.** 짓기를 첫 읽기로 미루는 구현이 첫 걸음에서, 고친 자리를 모아 두었다가
      // 읽을 때 다시 짓는 구현이 고친 뒤 첫 걸음에서 n 에 비례해 걸린다(T1-06 첫째 계열 — 상태를 바꾸는 연산이 있어 실재한다).
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        ctx.step(() => void impl.rootHash());
        for (let k = 0; k < n; k++) impl.update(scattered(k, n), `u${k}`);
        for (let s = 0; s < STEPS; s++) ctx.step(() => void impl.rootHash());
      },
    },
    {
      covers: ["getProof"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **흩어진 자리 n 곳을 고친 뒤 흩어진 자리의 증명 `STEPS` 개.** 블록 토큰만 들고 읽을 때마다 위층을 다시 짓는 구현과 고친 자리를
      // 모아 두는 구현이 n 에 비례해 걸린다.
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        for (let k = 0; k < n; k++) impl.update(scattered(k, n), `u${k}`);
        for (let s = 0; s < STEPS; s++) {
          const index = scattered(s + 1, n);
          ctx.step(() => void impl.getProof(index));
        }
      },
    },
    {
      covers: ["verify"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **옳은 증명 `STEPS` 개를 받아 두고 검증.** 증명 길이 t 가 로그라 행의 `O(t)` 를 `O(log n)` 으로 판정한다. 검증은 담긴 블록을 읽지
      // 않으므로 수열의 모양이 비용을 바꾸지 않아 적대적 입력이 없다.
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        const root = impl.rootHash();
        for (let s = 0; s < STEPS; s++) {
          const index = scattered(s + 1, n);
          const proof = impl.getProof(index);
          ctx.step(() => void impl.verify(root, index, `b${index}`, proof));
        }
      },
    },
    {
      covers: ["update"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **흩어진 자리 n / 32 곳(최소 `STEPS`)을 차례로 고친다.** 고칠 때마다 나무 전부를 다시 짓는 구현이 첫 걸음에서, 고친 것을 쌓아 두다
      // 블록 수에 비례하는 몫이 차면 한꺼번에 다시 짓는 구현이 그 걸음에서 걸린다 — 걸음을 n 에 비례하게 둔 이유가 이 뒤엣것이다
      // (§「`worst` 시나리오는 재는 호출 수를 n 에 묶지 않아도 된다」의 조건 — 최악이 늦게 오는 계열).
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        const steps = Math.max(STEPS, n >> 5);
        for (let s = 0; s < steps; s++) {
          const index = scattered(s + 1, n);
          ctx.step(() => impl.update(index, `v${s}`));
        }
      },
    },
  ],
};
