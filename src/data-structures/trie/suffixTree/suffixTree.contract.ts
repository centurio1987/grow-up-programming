/**
 * `trie/suffixTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./suffixTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **하네스에 맞추려고 껍데기를 하나 씌운다.** 이 구조는 생성자로 다 지어지고 그 뒤로 변하지
 * 않는데 `runContract` 는 인자 없는 팩토리 하나에 연산을 이어 붙이는 모양을 요구한다.
 * `reindex` 는 그 모양에 대한 적응이고 **계약의 일부가 아니다**(`trie/suffixArray` 와 같다).
 *
 * **축3의 n 은 색인한 문자열의 길이다.** 담긴 원소의 수가 아니다.
 *
 * **`findAll` 의 관측값은 정렬해서 본다.** 계약이 순서를 정하지 않았으므로 순서를 보면
 * 계약에 없는 것을 검사하게 된다. 관측 정규화는 계약을 좁히는 것이 아니라 계약이 말하지
 * 않은 자유를 검사에서 빼는 것이다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface SuffixTreeContract {
  contains(pattern: string): boolean;
  count(pattern: string): number;
  findAll(pattern: string): number[];
  longestRepeatedSubstring(): string;
}

/** 하네스용 껍데기. `reindex` 로 새 문자열을 색인하고, 버린 색인의 비용은 이어서 센다. */
export class Rebuildable implements SuffixTreeContract {
  #make: (s: string) => SuffixTreeContract & { __cost?: number };
  #index: SuffixTreeContract & { __cost?: number };
  #text = "";
  #carried = 0;

  constructor(make: (s: string) => SuffixTreeContract & { __cost?: number }) {
    this.#make = make;
    this.#index = make("");
  }

  get __cost(): number {
    return this.#carried + (this.#index.__cost ?? 0);
  }

  /** 지금 색인하고 있는 문자열. 관측값을 정규화하는 데만 쓴다 — 구현에 묻지 않는다. */
  text(): string {
    return this.#text;
  }

  reindex(s: string): void {
    this.#carried += this.#index.__cost ?? 0;
    this.#text = s;
    this.#index = this.#make(s);
  }

  contains(pattern: string): boolean {
    return this.#index.contains(pattern);
  }

  count(pattern: string): number {
    return this.#index.count(pattern);
  }

  findAll(pattern: string): number[] {
    return this.#index.findAll(pattern);
  }

  longestRepeatedSubstring(): string {
    return this.#index.longestRepeatedSubstring();
  }
}

/** 축1 참조 모델. 색인 없이 원문을 훑는다 — 축1은 의미만 보고 비용은 보지 않는다. */
interface Model {
  s: string;
}

function modelFindAll(s: string, pattern: string): number[] {
  const found: number[] = [];
  for (let i = 0; i <= s.length - pattern.length; i++)
    if (s.startsWith(pattern, i)) found.push(i);
  return found;
}

function modelLongestRepeated(s: string): string {
  let best = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i + best.length + 1; j <= s.length; j++) {
      const candidate = s.slice(i, j);
      if (s.indexOf(candidate, i + 1) >= 0 && candidate.length > best.length)
        best = candidate;
    }
  }
  return best;
}

/** 축1 무작위 시퀀스가 쓰는 문자열. 알파벳이 좁아야 반복이 생겨 `count` 가 1 에 머물지 않는다. */
function someText(rng: () => number): string {
  const length = Math.floor(rng() * 13);
  let s = "";
  for (let i = 0; i < length; i++) s += "abc"[Math.floor(rng() * 3)] as string;
  return s;
}

/** 축3 시나리오용 문자열. */
function text(n: number, alphabet: number, rng: () => number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++)
    out.push(String.fromCharCode(97 + Math.floor(rng() * alphabet)));
  return out.join("");
}

export const suffixTreeContract: ContractSpec<Rebuildable, Model> = {
  name: "SuffixTree",
  grade: "complexity",
  model: () => ({ s: "" }),

  ops: [
    {
      name: "reindex",
      arg: (rng) => someText(rng),
      onImpl: (impl, arg) => {
        impl.reindex(arg as string);
      },
      onModel: (model, arg) => {
        model.s = arg as string;
      },
    },
    {
      name: "contains",
      arg: (rng) => someText(rng).slice(0, 3),
      onImpl: (impl, arg) => impl.contains(arg as string),
      onModel: (model, arg) => modelFindAll(model.s, arg as string).length > 0,
    },
    {
      name: "count",
      arg: (rng) => someText(rng).slice(0, 3),
      onImpl: (impl, arg) => impl.count(arg as string),
      onModel: (model, arg) => modelFindAll(model.s, arg as string).length,
    },
    {
      name: "findAll",
      arg: (rng) => someText(rng).slice(0, 3),
      // 계약이 순서를 정하지 않았으므로 양쪽 다 정렬해서 본다.
      onImpl: (impl, arg) =>
        [...impl.findAll(arg as string)].sort((a, b) => a - b),
      onModel: (model, arg) => modelFindAll(model.s, arg as string),
    },
    {
      name: "longestRepeatedSubstring",
      arg: () => undefined,
      // 같은 길이의 답이 여럿일 수 있고 계약은 어느 것인지를 정하지 않는다. 관측값을
      // **(길이, 정말 두 자리에서 나타나는가)** 로 정규화한다.
      onImpl: (impl) => {
        const found = impl.longestRepeatedSubstring();
        const s = impl.text();
        const twice = found === "" || s.indexOf(found) !== s.lastIndexOf(found);
        return [found.length, twice];
      },
      onModel: (model) => [modelLongestRepeated(model.s).length, true],
    },
  ],

  edges: [
    {
      name: "빈 문자열 — 빈 패턴만 나타나고 그 자리는 하나다",
      steps: [
        { op: "contains", arg: "" },
        { op: "count", arg: "" },
        { op: "findAll", arg: "" },
        { op: "contains", arg: "a" },
        { op: "count", arg: "a" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "빈 패턴은 끝자리에서도 시작한다 — 자리가 n + 1 개다",
      steps: [
        { op: "reindex", arg: "abc" },
        { op: "count", arg: "" },
        { op: "findAll", arg: "" },
      ],
    },
    {
      name: "겹쳐서 나타나는 것도 따로 센다",
      steps: [
        { op: "reindex", arg: "aaaa" },
        { op: "count", arg: "aa" },
        { op: "findAll", arg: "aa" },
        { op: "count", arg: "aaaa" },
        { op: "count", arg: "aaaaa" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "banana — 갈라지는 자리와 갈라지지 않는 자리",
      steps: [
        { op: "reindex", arg: "banana" },
        { op: "contains", arg: "ana" },
        { op: "count", arg: "ana" },
        { op: "findAll", arg: "ana" },
        { op: "count", arg: "na" },
        { op: "contains", arg: "nab" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "패턴이 원문보다 길면 나타나지 않는다",
      steps: [
        { op: "reindex", arg: "ab" },
        { op: "contains", arg: "aba" },
        { op: "count", arg: "aba" },
        { op: "findAll", arg: "aba" },
      ],
    },
    {
      name: "반복이 없으면 가장 긴 반복 부분 문자열은 빈 문자열이다",
      steps: [
        { op: "reindex", arg: "abcd" },
        { op: "longestRepeatedSubstring" },
        { op: "reindex", arg: "abcdb" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "다시 색인하면 앞의 문자열은 남지 않는다",
      steps: [
        { op: "reindex", arg: "banana" },
        { op: "count", arg: "ana" },
        { op: "reindex", arg: "ab" },
        { op: "count", arg: "ana" },
        { op: "longestRepeatedSubstring" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 상태를 바꾸는 연산이 없어 "연산 사이"라는 것이 생기지
  // 않는다 — 관측값들의 정합은 각 연산의 의미이고 축1이 참조 모델과 대조한다.
  invariants: [],

  scenarios: [
    {
      // 무작위 문자열. **이 시나리오는 결함 fixture 를 잡지 못한다** — 접미사를 뿌리부터
      // 하나씩 넣어도 무작위 입력에서는 겹치는 길이가 짧기 때문이다.
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const s = text(n, 2, ctx.rng);
        ctx.step(() => impl.reindex(s));
      },
    },
    {
      // 같은 문자 반복. **진단된 결함이 정확히 이 자리다** — i 번째 접미사를 넣으려면
      // 이미 만들어 둔 사슬을 i 만큼 다시 내려가야 한다.
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        ctx.step(() => impl.reindex("a".repeat(n)));
      },
    },
    {
      // 구성과 LRS 를 **한 걸음으로** 잰다. 계약이 둘을 묶어 적었기 때문이다.
      covers: ["constructor", "longestRepeatedSubstring"],
      qualifier: "worst",
      bound: "O(n log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const s = "ab".repeat(n >> 1);
        ctx.step(() => {
          impl.reindex(s);
          impl.longestRepeatedSubstring();
        });
      },
    },
    {
      // 패턴 길이 m 을 상수로 눌러 색인 크기만 키운다(§규약2 시나리오 규칙 3).
      // **이 계약의 중심이 여기서 판정된다** — 색인이 커져도 질의 비용이 그대로여야 한다.
      covers: ["contains", "count"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const s = text(n, 2, ctx.rng);
        impl.reindex(s);
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * n);
          const pattern = s.slice(at, at + 4);
          ctx.step(() => {
            impl.contains(pattern);
            impl.count(pattern);
          });
        }
      },
    },
    {
      // 답의 개수 k 도 상수로 눌러야 한다. 알파벳을 26 으로 넓히고 패턴을 8 자로 잡으면
      // 원문에서 떼어 온 패턴이 사실상 한 자리에서만 나타난다.
      covers: ["findAll"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const s = text(n, 26, ctx.rng);
        impl.reindex(s);
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * (n - 8));
          const pattern = s.slice(at, at + 8);
          ctx.step(() => {
            impl.findAll(pattern);
          });
        }
      },
    },
  ],
};
