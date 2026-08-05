/**
 * `trie/ternarySearchTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./ternarySearchTree.ts` 헤더 한 곳이고
 * (규약1), 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **시나리오의 n 은 담긴 낱말 수다.** 낱말 길이 m 과 답의 개수 k 는 상수로 눌러 두므로
 * (§규약2 시나리오 규칙 3) `O(m)` 과 `O(m + k)` 가 n 에 대해 `O(1)` 로 판정된다. 담긴 수가
 * 비용에서 빠지는 것이 이 계약의 요지이므로, 그 요지가 그대로 판정 대상이 된다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 여섯 행을 그대로 옮긴 표면. */
export interface TernarySearchTreeContract {
  insert(word: string): void;
  search(word: string): boolean;
  startsWith(prefix: string): boolean;
  delete(word: string): boolean;
  wordsWithPrefix(prefix: string): string[];
  size(): number;
}

/** 축1 참조 모델. 자명한 집합이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = Set<string>;

/** 축1 무작위 시퀀스가 쓰는 낱말. 알파벳이 좁고 짧아야 접두사가 실제로 겹친다. */
function someWord(rng: () => number): string {
  const length = Math.floor(rng() * 4);
  let word = "";
  for (let i = 0; i < length; i++)
    word += "abc"[Math.floor(rng() * 3)] as string;
  return word;
}

/** 축3 시나리오용 낱말. 길이를 8 로 고정하고 알파벳을 26 으로 넓혀 답의 개수를 상수로 누른다. */
function corpus(n: number, rng: () => number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  while (out.length < n) {
    let word = "";
    for (let i = 0; i < 8; i++)
      word += String.fromCharCode(97 + Math.floor(rng() * 26));
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

export const ternarySearchTreeContract: ContractSpec<
  TernarySearchTreeContract,
  Model
> = {
  name: "TernarySearchTree",
  grade: "invariant",
  model: () => new Set<string>(),

  ops: [
    {
      name: "insert",
      arg: (rng) => someWord(rng),
      onImpl: (impl, arg) => {
        impl.insert(arg as string);
      },
      onModel: (model, arg) => {
        model.add(arg as string);
      },
    },
    {
      name: "search",
      arg: (rng) => someWord(rng),
      onImpl: (impl, arg) => impl.search(arg as string),
      onModel: (model, arg) => model.has(arg as string),
    },
    {
      name: "startsWith",
      arg: (rng) => someWord(rng),
      onImpl: (impl, arg) => impl.startsWith(arg as string),
      onModel: (model, arg) =>
        [...model].some((word) => word.startsWith(arg as string)),
    },
    {
      name: "delete",
      arg: (rng) => someWord(rng),
      onImpl: (impl, arg) => impl.delete(arg as string),
      onModel: (model, arg) => model.delete(arg as string),
    },
    {
      name: "wordsWithPrefix",
      arg: (rng) => someWord(rng),
      // 계약이 순서를 정하지 않았으므로 양쪽 다 정렬해서 본다.
      onImpl: (impl, arg) => [...impl.wordsWithPrefix(arg as string)].sort(),
      onModel: (model, arg) =>
        [...model].filter((word) => word.startsWith(arg as string)).sort(),
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.size,
    },
  ],

  edges: [
    {
      name: "빈 집합 — 무엇을 물어도 없다",
      steps: [
        { op: "size" },
        { op: "search", arg: "a" },
        { op: "startsWith", arg: "" },
        { op: "wordsWithPrefix", arg: "" },
        { op: "delete", arg: "a" },
      ],
    },
    {
      name: "빈 낱말도 낱말이다",
      steps: [
        { op: "insert", arg: "" },
        { op: "size" },
        { op: "search", arg: "" },
        { op: "startsWith", arg: "" },
        { op: "wordsWithPrefix", arg: "" },
        { op: "delete", arg: "" },
        { op: "search", arg: "" },
      ],
    },
    {
      name: "같은 낱말을 두 번 넣어도 하나다",
      steps: [
        { op: "insert", arg: "ab" },
        { op: "insert", arg: "ab" },
        { op: "size" },
        { op: "delete", arg: "ab" },
        { op: "search", arg: "ab" },
        { op: "size" },
      ],
    },
    {
      name: "접두사는 낱말이 아니다 — 담기지 않은 접두사는 search 가 거짓이다",
      steps: [
        { op: "insert", arg: "abc" },
        { op: "search", arg: "ab" },
        { op: "startsWith", arg: "ab" },
        { op: "wordsWithPrefix", arg: "ab" },
        { op: "search", arg: "abc" },
      ],
    },
    {
      name: "한 낱말을 지워도 접두사를 나눠 쓰는 낱말은 남는다",
      steps: [
        { op: "insert", arg: "ab" },
        { op: "insert", arg: "abc" },
        { op: "delete", arg: "ab" },
        { op: "search", arg: "abc" },
        { op: "startsWith", arg: "ab" },
        { op: "wordsWithPrefix", arg: "ab" },
        { op: "size" },
      ],
    },
    {
      name: "없는 낱말을 지우면 false 이고 상태는 그대로다",
      steps: [
        { op: "insert", arg: "ab" },
        { op: "delete", arg: "ac" },
        { op: "delete", arg: "a" },
        { op: "size" },
        { op: "search", arg: "ab" },
      ],
    },
    {
      // 삼분 표현에서 문자가 같은 자리의 옆으로 갈리는 모양을 짚는다.
      name: "같은 자리의 다른 문자들이 서로를 가리지 않는다",
      steps: [
        { op: "insert", arg: "b" },
        { op: "insert", arg: "a" },
        { op: "insert", arg: "c" },
        { op: "wordsWithPrefix", arg: "" },
        { op: "search", arg: "a" },
        { op: "search", arg: "c" },
        { op: "delete", arg: "b" },
        { op: "wordsWithPrefix", arg: "" },
      ],
    },
  ],

  invariants: [
    {
      name: "세어 둔 낱말 수와 늘어놓은 낱말 수가 같다",
      check: (impl) => {
        const counted = impl.size();
        const listed = impl.wordsWithPrefix("").length;
        if (counted === listed) return null;
        return `size()=${counted} 인데 wordsWithPrefix("").length=${listed} 다`;
      },
    },
    {
      name: "접두사로 받은 낱말은 하나씩 물어도 담겨 있고 그 접두사로 시작한다",
      check: (impl) => {
        const all = impl.wordsWithPrefix("");
        for (const word of all) {
          if (!impl.search(word))
            return `wordsWithPrefix("") 가 ${JSON.stringify(word)} 를 내놓는데 search 가 거짓이다`;
        }
        const sample = all[0];
        if (sample === undefined) return null;
        const prefix = sample.slice(0, 1);
        for (const word of impl.wordsWithPrefix(prefix)) {
          if (!word.startsWith(prefix))
            return `wordsWithPrefix(${JSON.stringify(prefix)}) 가 ${JSON.stringify(word)} 를 내놓는다`;
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (const word of corpus(n, ctx.rng))
          ctx.step(() => impl.insert(word));
      },
    },
    {
      covers: ["search"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const words = corpus(n, ctx.rng);
        for (const word of words) impl.insert(word);
        for (const word of words) ctx.step(() => impl.search(word));
      },
    },
    {
      // **명세의 필요충분조건이 이 자리에서 검사된다** — 낱말을 접두사로 묶어 두지 않은
      // 구현은 접두사를 물으면 담긴 낱말을 전부 봐야 한다.
      covers: ["startsWith", "wordsWithPrefix"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const words = corpus(n, ctx.rng);
        for (const word of words) impl.insert(word);
        for (const word of words) {
          const prefix = word.slice(0, 6);
          ctx.step(() => {
            impl.startsWith(prefix);
            impl.wordsWithPrefix(prefix);
          });
        }
      },
    },
    {
      // 전부 지운다. 자리를 통째로 미는 구현이 여기서 걸린다.
      covers: ["delete"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const words = corpus(n, ctx.rng);
        for (const word of words) impl.insert(word);
        for (const word of words) ctx.step(() => impl.delete(word));
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (const word of corpus(n, ctx.rng)) impl.insert(word);
        for (let i = 0; i < 8; i++) ctx.step(() => impl.size());
      },
    },
  ],
};
