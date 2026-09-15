/**
 * 결함 fixture — 실패 쪽 상태를 가진 패턴 오토마톤에서 **끝나는 패턴을 모으는 규칙**과 **답을 적는 규칙**만 갈아 끼운다.
 *
 * 대상 계약: `trie/ahoCorasick`.
 *
 * 짓기(패턴을 따라 상태 만들기 · 너비 우선으로 실패 쪽 정하기)와 검색의 훑기(자식이 없으면 실패 쪽으로 물러서기)는 정본
 * (`trie/ahoCorasick/_reference/ahoCorasick.ts`)과 같다. 답은 `output: "own"` 을 뺀 어느 규칙에서도 전부 옳다(축1 통과). 규칙 하나가 결함 계열
 * 하나이고, 같은 코드를 벌마다 파일로 나누지 않으려고 한 파일에 둔다(`levelRuleSkipList.ts` 와 같은 모양).
 *
 * | 옵션 | 무엇 | 이 계약에서 |
 * |---|---|---|
 * | `output: "chain"` | 상태마다 **실패 쪽 사슬을 뿌리까지 전부** 따라가며 패턴이 끝나는 상태를 찾는다(사전 쪽 상태를 두지 않는다) | 검색이 텍스트 길이 × 상태 깊이 — 패턴이 안 끝나는 상태까지 지나간다. 텍스트 `a^n` 두 시나리오에서 걸린다 |
 * | `output: "copied"` | 짓는 동안 상태마다 **끝나는 패턴 목록을 실패 쪽 상태의 목록에서 복사해** 들고, 검색은 그 목록을 적는다 | 물려받은 문제 문서의 3단계(「`output` 집합을 실패 링크 체인을 통해 합산한다」)를 배열 복사로 옮긴 것. 목록 길이 합이 패턴 목록 크기의 1.5 제곱까지 가서 **구성**이 걸리고 검색은 지킨다 |
 * | `output: "own"` | 지금 상태에서 끝나는 패턴 **하나만** 적는다(실패 쪽을 보지 않는다) | 정본의 변이(불변 사실 72) — 답이 틀린다. 축1 경계 케이스에서 걸린다 |
 * | `append: "copy"` | 돌려줄 자리 배열을 늘릴 때마다 **새 배열로 복사**한다 | 답을 적는 일이 답의 수의 제곱 — k = Θ(ℓ) 시나리오에서만 걸린다 |
 *
 * 기본값(`output: "dictionary"` · `append: "push"`)은 정본과 같은 계급이고 자기시험이 대조군으로 쓴다.
 *
 * 계측은 §규약2 계측 단위 — 정본과 같은 자리에 1 을 더하고, 복사하는 칸 하나마다 1 을 더한다. 어느 시나리오에서 걸리는지는
 * `_contract/runContract.ahoCorasick.test.ts` 가 고정한다.
 */

interface State {
  readonly next: Map<number, State>;
  word: string | null;
  fail: State | null;
  dict: State | null;
  /** `output: "copied"` 에서만 채운다 — 이 상태에서 끝나는 패턴 전부. */
  outputs: string[];
}

export interface OutputRule {
  output?: "dictionary" | "chain" | "copied" | "own";
  append?: "push" | "copy";
}

function freshState(): State {
  return {
    next: new Map(),
    word: null,
    fail: null,
    dict: null,
    outputs: [],
  };
}

export class OutputRuleAutomaton {
  readonly #root: State = freshState();
  readonly #output: "dictionary" | "chain" | "copied" | "own";
  readonly #append: "push" | "copy";
  __cost = 0;

  constructor(patterns: string[], rule: OutputRule = {}) {
    this.#output = rule.output ?? "dictionary";
    this.#append = rule.append ?? "push";
    for (const word of patterns) {
      this.__cost += 1;
      let state = this.#root;
      for (let i = 0; i < word.length; i++) {
        this.__cost += 1;
        const code = word.charCodeAt(i);
        let child = state.next.get(code);
        if (child === undefined) {
          child = freshState();
          state.next.set(code, child);
        }
        state = child;
      }
      state.word = word;
    }
    this.#link();
  }

  search(text: string): Map<string, number[]> {
    const found = new Map<string, number[]>();
    const root = this.#root;
    let state = root;
    this.#report(state, 0, found);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      while (state !== root && !state.next.has(code)) {
        this.__cost += 1;
        state = state.fail as State;
      }
      this.__cost += 1;
      state = state.next.get(code) ?? root;
      this.#report(state, i + 1, found);
    }
    return found;
  }

  #link(): void {
    const root = this.#root;
    if (this.#output === "copied" && root.word !== null) {
      root.outputs = [root.word];
    }
    const queue: State[] = [root];
    for (let head = 0; head < queue.length; head++) {
      this.__cost += 1;
      const parent = queue[head] as State;
      for (const [code, child] of parent.next) {
        let back = parent.fail;
        while (back !== null && !back.next.has(code)) {
          this.__cost += 1;
          back = back.fail;
        }
        const fail = back === null ? root : (back.next.get(code) as State);
        child.fail = fail;
        child.dict = fail.word !== null ? fail : fail.dict;
        if (this.#output === "copied") {
          const outputs = child.word !== null ? [child.word] : [];
          for (const word of fail.outputs) {
            this.__cost += 1;
            outputs.push(word);
          }
          child.outputs = outputs;
        }
        queue.push(child);
      }
    }
  }

  #report(state: State, end: number, found: Map<string, number[]>): void {
    if (this.#output === "copied") {
      for (const word of state.outputs) this.#emit(word, end, found);
      return;
    }
    if (this.#output === "own") {
      if (state.word !== null) this.#emit(state.word, end, found);
      return;
    }
    if (this.#output === "chain") {
      let at: State | null = state;
      while (at !== null) {
        this.__cost += 1;
        if (at.word !== null) this.#emit(at.word, end, found);
        at = at.fail;
      }
      return;
    }
    let hit: State | null = state.word !== null ? state : state.dict;
    while (hit !== null) {
      this.#emit(hit.word as string, end, found);
      hit = hit.dict;
    }
  }

  #emit(word: string, end: number, found: Map<string, number[]>): void {
    this.__cost += 1;
    const start = end - word.length;
    const starts = found.get(word);
    if (starts === undefined) {
      found.set(word, [start]);
      return;
    }
    if (this.#append === "push") {
      starts.push(start);
      return;
    }
    const grown = new Array<number>(starts.length + 1);
    for (let i = 0; i < starts.length; i++) {
      this.__cost += 1;
      grown[i] = starts[i] as number;
    }
    grown[starts.length] = start;
    found.set(word, grown);
  }
}
