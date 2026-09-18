/**
 * `trie/suffixArray` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./suffixArray.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **하네스에 맞추려고 껍데기를 하나 씌운다.** `runContract` 는 인자 없는 팩토리를 받아
 * 그 하나에 연산을 이어 붙이는데, 이 구조는 **생성자로 다 지어지고 그 뒤로 변하지 않는다.**
 * 그대로 넘기면 축1이 문자열 하나에 대한 질의만 보게 된다. 그래서 `reindex` 하나를 가진
 * 껍데기를 대상으로 삼는다 — 껍데기는 **계약의 일부가 아니고** 구조에도 없다. 하네스가
 * 「연산을 이어 붙인다」는 모양을 요구하는 데 대한 적응이다.
 *
 * **n 이 무엇인지가 여기서 처음 갈린다.** 지금까지 축3의 n 은 전부 담긴 원소의 수였다.
 * 이 구조에서 n 은 **색인한 문자열의 길이**다. 시나리오가 크기 n 을 받으면 길이 n 의
 * 문자열을 만들어 색인한다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface SuffixArrayContract {
  at(rank: number): number | null;
  rankOf(start: number): number | null;
  range(pattern: string): [number, number];
  longestRepeatedSubstring(): string;
}

/**
 * 하네스용 껍데기. `reindex` 로 새 문자열을 색인하고, 버린 색인의 비용은 이어서 센다.
 *
 * 계약에 없는 연산이므로 `check-contract.ts` 의 명세↔스텁·정본 대조에는 걸리지 않는다 —
 * 그 대조가 보는 것은 `<name>.ts` 와 `_reference/<name>.ts` 이고 이 파일이 아니다.
 */
export class Rebuildable implements SuffixArrayContract {
  #make: (s: string) => SuffixArrayContract & { __cost?: number };
  #index: SuffixArrayContract & { __cost?: number };
  #text = "";
  #carried = 0;

  constructor(make: (s: string) => SuffixArrayContract & { __cost?: number }) {
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

  at(rank: number): number | null {
    return this.#index.at(rank);
  }

  rankOf(start: number): number | null {
    return this.#index.rankOf(start);
  }

  range(pattern: string): [number, number] {
    return this.#index.range(pattern);
  }

  longestRepeatedSubstring(): string {
    return this.#index.longestRepeatedSubstring();
  }
}

/** 축1 참조 모델. 색인 없이 문자열 하나만 들고 답을 그 자리에서 계산한다. */
interface Model {
  s: string;
}

/** 사전순으로 늘어놓은 접미사 시작 위치. 모델은 비용을 보지 않으므로 자를수록 좋다. */
function sortedStarts(s: string): number[] {
  return Array.from({ length: s.length }, (_, i) => i).sort((a, b) => {
    const x = s.slice(a);
    const y = s.slice(b);
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/** 접미사의 앞부분과 패턴을 견준다. 패턴으로 시작하면 0, 짧아서 못 미치면 -1 이다. */
function comparePrefix(s: string, start: number, pattern: string): number {
  const head = s.slice(start, start + pattern.length);
  return head < pattern ? -1 : head === pattern ? 0 : 1;
}

function modelRange(s: string, pattern: string): [number, number] {
  const starts = sortedStarts(s);
  let lo = 0;
  while (
    lo < starts.length &&
    comparePrefix(s, starts[lo] as number, pattern) < 0
  )
    lo += 1;
  let hi = lo;
  while (
    hi < starts.length &&
    comparePrefix(s, starts[hi] as number, pattern) === 0
  )
    hi += 1;
  return [lo, hi];
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

/** 축1 무작위 시퀀스가 쓰는 문자열. 알파벳이 좁아야 반복이 생겨 `range`·LRS 가 비지 않는다. */
function someText(rng: () => number): string {
  const length = Math.floor(rng() * 13);
  let s = "";
  for (let i = 0; i < length; i++) s += "abc"[Math.floor(rng() * 3)] as string;
  return s;
}

/** 순위·위치 인자. 음수와 길이 밖을 함께 뽑아 **범위 밖 규약도 교차검증에 걸리게** 한다. */
function position(rng: () => number): number {
  return Math.floor(rng() * 20) - 4;
}

/** 축3 시나리오용 문자열. `alphabet` 이 1 이면 같은 문자 반복이다. */
function text(n: number, alphabet: number, rng: () => number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++)
    out.push(String.fromCharCode(97 + Math.floor(rng() * alphabet)));
  return out.join("");
}

export const suffixArrayContract: ContractSpec<Rebuildable, Model> = {
  name: "SuffixArray",
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
      name: "at",
      arg: (rng) => position(rng),
      onImpl: (impl, arg) => impl.at(arg as number),
      onModel: (model, arg) => {
        const rank = arg as number;
        if (rank < 0 || rank >= model.s.length) return null;
        return sortedStarts(model.s)[rank] as number;
      },
    },
    {
      name: "rankOf",
      arg: (rng) => position(rng),
      onImpl: (impl, arg) => impl.rankOf(arg as number),
      onModel: (model, arg) => {
        const start = arg as number;
        if (start < 0 || start >= model.s.length) return null;
        return sortedStarts(model.s).indexOf(start);
      },
    },
    {
      name: "range",
      arg: (rng) => someText(rng).slice(0, 3),
      onImpl: (impl, arg) => impl.range(arg as string),
      onModel: (model, arg) => modelRange(model.s, arg as string),
    },
    {
      name: "longestRepeatedSubstring",
      arg: () => undefined,
      // 같은 길이의 답이 여럿일 수 있고 계약은 어느 것인지를 정하지 않는다. 그래서 관측값을
      // **(길이, 정말 두 자리에서 나타나는가)** 로 정규화한다. 길이만 보면 아무 문자열이나
      // 돌려주는 구현이 통과하고, 문자열을 그대로 보면 정당한 구현이 동점에서 갈린다.
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
      name: "빈 문자열 — 순위도 위치도 없고 빈 패턴의 구간도 비어 있다",
      steps: [
        { op: "at", arg: 0 },
        { op: "rankOf", arg: 0 },
        { op: "range", arg: "" },
        { op: "range", arg: "a" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "한 글자 — 접미사가 하나뿐이고 반복이 없다",
      steps: [
        { op: "reindex", arg: "a" },
        { op: "at", arg: 0 },
        { op: "at", arg: 1 },
        { op: "rankOf", arg: 0 },
        { op: "range", arg: "a" },
        { op: "range", arg: "b" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "banana — 짧은 접미사가 긴 접미사보다 앞에 온다",
      steps: [
        { op: "reindex", arg: "banana" },
        { op: "at", arg: 0 },
        { op: "at", arg: 1 },
        { op: "at", arg: 2 },
        { op: "at", arg: 3 },
        { op: "at", arg: 4 },
        { op: "at", arg: 5 },
        { op: "rankOf", arg: 5 },
        { op: "range", arg: "ana" },
        { op: "range", arg: "na" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "빈 패턴은 모든 접미사가 만족하므로 구간이 전체다",
      steps: [
        { op: "reindex", arg: "abcab" },
        { op: "range", arg: "" },
        { op: "range", arg: "abcab" },
        { op: "range", arg: "abcabx" },
      ],
    },
    {
      name: "반복이 없으면 가장 긴 반복 부분 문자열은 빈 문자열이다",
      steps: [
        { op: "reindex", arg: "abcd" },
        { op: "longestRepeatedSubstring" },
        { op: "reindex", arg: "abcda" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "같은 문자만 있으면 접미사 순서가 길이 순이고 반복이 가장 길다",
      steps: [
        { op: "reindex", arg: "aaaa" },
        { op: "at", arg: 0 },
        { op: "at", arg: 3 },
        { op: "rankOf", arg: 0 },
        { op: "range", arg: "aa" },
        { op: "longestRepeatedSubstring" },
      ],
    },
    {
      name: "음수 순위·위치는 뒤에서부터 세지 않는다 — 전부 범위 밖이다",
      steps: [
        { op: "reindex", arg: "abab" },
        { op: "at", arg: -1 },
        { op: "rankOf", arg: -1 },
        { op: "at", arg: 4 },
        { op: "rankOf", arg: 4 },
      ],
    },
    {
      name: "다시 색인하면 앞의 문자열은 남지 않는다",
      steps: [
        { op: "reindex", arg: "banana" },
        { op: "at", arg: 5 },
        { op: "reindex", arg: "ab" },
        { op: "at", arg: 5 },
        { op: "range", arg: "ana" },
        { op: "longestRepeatedSubstring" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 상태를 바꾸는 연산이 없어 "연산 사이"라는 것이 생기지
  // 않는다 — 관측값들의 정합은 각 연산의 의미이고 축1이 참조 모델과 대조한다.
  invariants: [],

  scenarios: [
    {
      // 무작위 문자열. **이 시나리오는 결함 fixture 를 잡지 못한다** — 접미사를 통째로
      // 견주어 정렬해도 무작위 입력에서는 비교가 몇 글자 만에 갈리기 때문이다. 그래도
      // 두는 이유는 아래 적대적 시나리오가 잡는 것이 「입력이 나쁠 때만」임을 이 자리가
      // 보이기 때문이다(불변 사실 24).
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
      // 같은 문자 반복. **진단된 결함이 정확히 이 자리다** — 접미사 둘을 앞에서부터
      // 견주면 갈릴 때까지 n 문자를 읽는다. 30억 염기 이야기가 무너지는 자리이기도 하다:
      // 유전체는 무작위 문자열이 아니라 반복이 많은 문자열이다.
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        ctx.step(() => impl.reindex("a".repeat(n)));
      },
    },
    {
      // 구성과 LRS 를 **한 걸음으로** 잰다. 계약이 둘을 묶어 적었기 때문이다 — 미리
      // 계산해 두는 구현과 호출 때 계산하는 구현이 둘 다 통과해야 한다.
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
      // 그래야 O(m log n) 이 n 에 대한 O(log n) 으로 판정된다.
      covers: ["range"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const s = text(n, 2, ctx.rng);
        impl.reindex(s);
        for (let i = 0; i < n; i++) {
          const at = Math.floor(ctx.rng() * n);
          const pattern = s.slice(at, at + 4);
          ctx.step(() => impl.range(pattern));
        }
      },
    },
    {
      // 둘을 한 걸음에 묶는다. 둘이 같은 상한·한정자라 갈라 잴 이유가 없다.
      covers: ["at", "rankOf"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reindex(text(n, 2, ctx.rng));
        for (let i = 0; i < n; i++) {
          const k = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.at(k);
            impl.rankOf(k);
          });
        }
      },
    },
  ],
};
