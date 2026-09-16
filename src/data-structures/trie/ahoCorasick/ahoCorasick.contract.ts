/**
 * `trie/ahoCorasick` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./ahoCorasick.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가
 * 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **불변 구조라 껍데기를 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리를 받아 그 하나에 연산을 이어 붙이는데,
 * 이 구조는 **생성자로 패턴 집합이 정해지고 그 뒤로 변하지 않는다.** 그래서 `reindex(patterns)` 하나를 가진 껍데기를 대상으로
 * 삼는다 — `range-query/sparseTable` 의 `Reindexable` 과 같은 모양이고, 버린 색인의 비용은 이어서 센다. 껍데기는 **계약의 일부가
 * 아니고** `check-contract.ts` 의 명세↔스텁·정본 대조에도 걸리지 않는다. 생성자 행을 재는 자리가 `reindex` 다.
 *
 * **`search` 의 관측값은 키로 정렬한 `[패턴, 시작 자리 배열]` 목록이다.** 계약이 키의 차례를 정하지 않았으므로 키는 정렬해서
 * 보고(`trie/suffixTree` 의 `findAll` 과 같은 정규화), **자리 배열의 차례는 계약이 오름차순으로 정했으므로 그대로 본다.**
 *
 * **축3의 n 은 시나리오마다 무엇의 크기인지가 다르다**(헤더 「연산 계약」). 생성자 행은 패턴 목록의 크기 m, `search` 행은
 * 텍스트 길이 ℓ 이거나(두 시나리오) 패턴 수다(한 시나리오 — 상한에 없는 파라미터를 키운다).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 `search` 행을 옮긴 표면. 생성자 행은 껍데기의 `reindex` 가 나른다. */
export interface AhoCorasickContract {
  search(text: string): Map<string, number[]>;
}

type Built = AhoCorasickContract & { __cost?: number };

/**
 * 하네스용 껍데기. `reindex` 로 새 패턴 목록을 색인하고, 버린 색인의 비용은 이어서 센다. 처음에는 빈 목록을 색인한다.
 *
 * 계약에 없는 연산이므로 `check-contract.ts` 의 명세↔스텁·정본 대조에는 걸리지 않는다.
 */
export class Reindexable implements AhoCorasickContract {
  readonly #make: (patterns: string[]) => Built;
  #index: Built;
  #carried = 0;

  constructor(make: (patterns: string[]) => Built) {
    this.#make = make;
    this.#index = make([]);
  }

  get __cost(): number {
    return this.#carried + (this.#index.__cost ?? 0);
  }

  reindex(patterns: string[]): void {
    this.#carried += this.#index.__cost ?? 0;
    this.#index = this.#make(patterns);
  }

  search(text: string): Map<string, number[]> {
    return this.#index.search(text);
  }
}

/** `search` 의 관측값 — 키로 정렬한 `[패턴, 시작 자리 배열]` 목록. 자리 배열은 받은 차례 그대로다. */
export function entries(found: Map<string, number[]>): [string, number[]][] {
  return [...found.entries()]
    .map(([word, starts]): [string, number[]] => [word, [...starts]])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/** 축1 참조 모델. 서로 다른 패턴만 들고, 물을 때마다 패턴마다 텍스트의 모든 자리를 견준다 — 축1은 의미만 본다. */
interface Model {
  patterns: string[];
}

function modelSearch(model: Model, text: string): [string, number[]][] {
  const out: [string, number[]][] = [];
  for (const word of [...model.patterns].sort()) {
    const starts: number[] = [];
    for (let i = 0; i + word.length <= text.length; i++) {
      if (text.startsWith(word, i)) starts.push(i);
    }
    if (starts.length > 0) out.push([word, starts]);
  }
  return out;
}

/**
 * 축1 무작위 문자열. 알파벳이 좁아야 겹치는 출현과 접미사 관계가 생긴다. `c` 는 이따금 흐름을 끊는다. `emptyChance` 는 길이 0 이
 * 나올 몫이다 — 패턴에서 빈 문자열이 흔하면 모든 자리가 답이 되어 다른 패턴의 답을 덮는다.
 */
function someWord(rng: () => number, max: number, emptyChance: number): string {
  if (rng() < emptyChance) return "";
  let s = "";
  const length = 1 + Math.floor(rng() * max);
  for (let i = 0; i < length; i++) {
    const r = rng();
    s += r < 0.47 ? "a" : r < 0.94 ? "b" : "c";
  }
  return s;
}

/** `c` 뒤에 이진수 `i` 를 `width` 자리 `a`/`b` 로 적은 패턴 — `a`/`b` 만 쓰는 텍스트에서는 첫 문자부터 갈라져 나타나지 않는다. */
export function binaryPattern(i: number, width: number): string {
  let s = "c";
  for (let bit = width - 1; bit >= 0; bit--) s += (i >> bit) & 1 ? "b" : "a";
  return s;
}

/** 패턴 수를 키우는 시나리오에서 텍스트에 실제로 나타나는 패턴 — 사다리 내내 같은 넷이라 답의 수가 상수다. */
export const FIXED_WORDS = ["ab", "ba", "aab", "abba"];

/** 패턴 수를 키우는 시나리오의 패턴 폭. 사다리 끝 `2^14` 개가 전부 서로 다르다. */
export const PATTERN_WIDTH = 14;

/** 패턴 수를 키우는 시나리오의 텍스트 — 사다리 내내 길이 64 로 고정한 `a`/`b` 문자열. */
export const FIXED_TEXT = Array.from({ length: 64 }, (_, i) =>
  (i * 5 + (i >> 3)) % 3 === 0 ? "b" : "a",
).join("");

/** 패턴 수를 키우는 시나리오가 재는 검색 수. `worst` 라 n 에 묶지 않는다(§「`worst` 시나리오는 재는 호출 수를 n 에 묶지 않아도 된다」). */
export const STEPS = 8;

export const ahoCorasickContract: ContractSpec<Reindexable, Model> = {
  name: "AhoCorasick",
  grade: "complexity",
  model: () => ({ patterns: [] }),

  ops: [
    {
      name: "reindex",
      // 패턴 0~5 개 · 길이 1~4(빈 패턴은 4%). 같은 문자열이 겹쳐 들어가는 목록과 빈 패턴이 이따금 나온다.
      arg: (rng) =>
        Array.from({ length: Math.floor(rng() * 6) }, () =>
          someWord(rng, 4, 0.04),
        ),
      onImpl: (impl, arg) => {
        impl.reindex([...(arg as string[])]);
      },
      onModel: (model, arg) => {
        model.patterns = [...new Set(arg as string[])];
      },
    },
    {
      name: "search",
      // 텍스트 길이 0~14(빈 텍스트는 1/15).
      arg: (rng) => someWord(rng, 14, 1 / 15),
      onImpl: (impl, arg) => entries(impl.search(arg as string)),
      onModel: (model, arg) => modelSearch(model, arg as string),
    },
  ],

  edges: [
    {
      name: "빈 패턴 목록은 아무것도 찾지 않고 빈 텍스트에서도 그렇다",
      steps: [
        { op: "search", arg: "hello" },
        { op: "search", arg: "" },
        { op: "reindex", arg: ["abc"] },
        { op: "search", arg: "" },
        { op: "search", arg: "ab" },
      ],
    },
    {
      // 나타나지 않은 패턴은 키로 두지 않는다 — 물려받은 「모든 패턴을 키로」를 뺀 자리다(헤더 「연산 계약」).
      name: "고전 예제 — 나타난 패턴만 키가 된다",
      steps: [
        { op: "reindex", arg: ["he", "she", "his", "hers", "xyz"] },
        { op: "search", arg: "ahishers" },
        { op: "search", arg: "ushers" },
        { op: "search", arg: "hello world" },
      ],
    },
    {
      name: "겹쳐서 나타나는 것과 서로의 접두사 · 접미사인 패턴을 전부 센다",
      steps: [
        { op: "reindex", arg: ["a", "aa", "aaa"] },
        { op: "search", arg: "aaaaa" },
        { op: "reindex", arg: ["test", "est", "st", "t"] },
        { op: "search", arg: "testing tests" },
      ],
    },
    {
      // 지나가는 상태 자체는 패턴이 아닌데 그 진접미사에서 패턴이 끝나는 자리. 지금 상태의 패턴만 보는 구현이 여기서 갈린다.
      name: "패턴이 아닌 상태의 진접미사에서 끝나는 패턴도 적는다",
      steps: [
        { op: "reindex", arg: ["abcd", "bc", "c"] },
        { op: "search", arg: "abce" },
        { op: "search", arg: "abcd" },
        { op: "reindex", arg: ["abab", "bab", "ba"] },
        { op: "search", arg: "abababa" },
      ],
    },
    {
      name: "같은 문자열이 여러 번 주어져도 키는 하나이고 자리도 한 벌이다",
      steps: [
        { op: "reindex", arg: ["abc", "abc", "bc"] },
        { op: "search", arg: "abcabc" },
      ],
    },
    {
      // 빈 패턴은 끝자리를 포함해 모든 자리에서 시작한다 — `trie/suffixTree` 의 빈 패턴과 같은 읽기(자리 ℓ + 1 개).
      name: "빈 패턴은 자리 0 부터 ℓ 까지 전부에서 나타난다",
      steps: [
        { op: "reindex", arg: ["", "b"] },
        { op: "search", arg: "abb" },
        { op: "search", arg: "" },
      ],
    },
    {
      name: "텍스트보다 긴 패턴은 나타나지 않고, 다시 색인하면 앞 패턴은 남지 않는다",
      steps: [
        { op: "reindex", arg: ["hello", "hello world"] },
        { op: "search", arg: "hello" },
        { op: "reindex", arg: ["world"] },
        { op: "search", arg: "hello world" },
      ],
    },
  ],

  /**
   * 헤더 불변식 절이 「없다」이므로 빈 배열이다. 불변 구조라 판별 결과와 무관하게 축2가 축1보다 더 잡는 것이 없다
   * (불변 사실 52 ①) — `check-contract.ts` 가 헤더의 번호 항목 수와 이 길이를 대조한다.
   */
  invariants: [],

  scenarios: [
    {
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // **짓기 한 번 — 무작위 패턴.** 길이 1~16 의 `a`/`b` 패턴을 목록 크기(길이 + 1 의 합)가 n 에 닿을 때까지 채운다.
      run: (impl, n, ctx) => {
        const patterns: string[] = [];
        let size = 0;
        while (size < n) {
          const length = 1 + Math.floor(ctx.rng() * 16);
          let word = "";
          for (let i = 0; i < length; i++) word += ctx.rng() < 0.5 ? "a" : "b";
          patterns.push(word);
          size += length + 1;
        }
        ctx.step(() => impl.reindex(patterns));
      },
    },
    {
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      // **짓기 한 번 — 짧은 패턴 여럿이 긴 패턴의 모든 자리에서 끝난다.** `a` · `aa` · … · `a^c`(c = ⌊√(n/2)⌋)와 긴 `a^{n/4}`
      // 하나, 나머지 절반은 `b` 로 시작하는 길이 8 무작위 패턴으로 목록 크기를 n 에 맞춘다. 긴 패턴의 상태마다 끝나는 패턴이 c 개라
      // **상태마다 끝나는 패턴 목록을 복사해 합치는 구현**(물려받은 문서 3단계를 글자 그대로 옮긴 것)이 m·√m 으로 걸린다. 무작위
      // 절반은 패턴 수를 n 에 비례하게 두어, 목록의 칸만 읽고 짓기를 미루는 생성자가 계급 아래로 떨어지지 않게 한다(불변 사실 49).
      // 계약의 산술(패턴 수 · 길이)로만 적힌 입력이다.
      run: (impl, n, ctx) => {
        const c = Math.floor(Math.sqrt(n / 2));
        const patterns: string[] = [];
        let size = 0;
        for (let j = 1; j <= c; j++) {
          patterns.push("a".repeat(j));
          size += j + 1;
        }
        const long = Math.floor(n / 4);
        patterns.push("a".repeat(long));
        size += long + 1;
        while (size < n) {
          let word = "b";
          for (let i = 0; i < 7; i++) word += ctx.rng() < 0.5 ? "a" : "b";
          patterns.push(word);
          size += word.length + 1;
        }
        ctx.step(() => impl.reindex(patterns));
      },
    },
    {
      covers: ["search"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **이 계약의 중심 — 텍스트는 길이 64 로 고정하고 패턴 수를 n 으로 키운다.** 상한 `O(ℓ + k)` 에 패턴 수가 없으므로
      // 상한에 없는 파라미터를 사다리에 올려 「안 기댄다」를 잰다(§「상한에 없는 파라미터도 시나리오가 키운다」). 패턴은 텍스트에
      // 나타나는 넷(`FIXED_WORDS` — 답의 수가 상수)과 `c` 로 시작하는 서로 다른 n 개다. 패턴마다 텍스트를 훑는 구현이 n 에 비례해
      // 걸리고, **짓기를 첫 검색으로 미루는 구현**이 짓자마자 재는 첫 걸음에서 걸린다(불변 사실 52 ③).
      run: (impl, n, ctx) => {
        const patterns = Array.from({ length: n }, (_, i) =>
          binaryPattern(i, PATTERN_WIDTH),
        );
        patterns.push(...FIXED_WORDS);
        impl.reindex(patterns);
        for (let k = 0; k < STEPS; k++) {
          ctx.step(() => void impl.search(FIXED_TEXT));
        }
      },
    },
    {
      covers: ["search"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      // **텍스트 길이 끝 · k = 0.** 텍스트 `a^n` 에 패턴 `a^d b`(d = ⌊√n⌋) 하나 — 나타나지 않는다. 자리마다 뿌리부터 트라이를 따라
      // 내려가는 구현과 상태마다 실패 쪽 사슬을 끝까지 따라가 패턴을 찾는 구현이 n·√n 으로 걸린다. 패턴 길이는 상한에 없어 n 과
      // 함께 한 사다리에 싣는다(§「상한에 없는 파라미터를 사다리 하나에 싣는 조건」).
      run: (impl, n, ctx) => {
        const d = Math.floor(Math.sqrt(n));
        impl.reindex([`${"a".repeat(d)}b`]);
        const text = "a".repeat(n);
        ctx.step(() => void impl.search(text));
      },
    },
    {
      covers: ["search"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      // **텍스트 길이 끝 · k = Θ(ℓ).** 텍스트 `a^n` 에 패턴 `a` 와 `a^d`(d = ⌊√n⌋) — 답이 2n − d + 1 개다. 답을 적는 일이 답의
      // 수에 선형보다 무거운 구현(자리마다 배열을 새로 복사해 늘리기)이 이 끝에서만 걸리고, 위 시나리오의 두 계열도 여기서 걸린다.
      run: (impl, n, ctx) => {
        const d = Math.floor(Math.sqrt(n));
        impl.reindex(["a", "a".repeat(d)]);
        const text = "a".repeat(n);
        ctx.step(() => void impl.search(text));
      },
    },
  ],
};
