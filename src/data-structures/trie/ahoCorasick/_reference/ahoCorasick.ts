/**
 * `trie/ahoCorasick` 정본(규약2).
 *
 * 계약은 `../ahoCorasick.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고, 계약이 허용하는 유일한
 * 구현이 아니다 — 자리마다 다음 상태를 표로 미리 다 적어 두는 구현(문자 가짓수를 상수로 접는 모형 위에서)도 두 행을 지킨다.
 * 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **상태 하나를 지나갈 때마다 1**(패턴 문자를 따라 내려가기 ·
 * 짓는 동안 상태를 하나 꺼내기 · 실패 쪽으로 한 칸 물러서기 · 텍스트 문자 하나로 다음 상태를 고르기), **패턴 목록의 칸 하나를
 * 읽을 때 1**, **돌려줄 자리 하나를 적을 때 1**. 자식 표(`Map`)를 찾는 런타임 비용은 세지 않는다 — 헤더가 문자 가짓수를
 * 상수로 접은 모형 위에서 상한을 적은 것과 같은 자리다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **짓기는 두 단계다.** ① 패턴마다 뿌리에서 문자를 따라 내려가며 상태를 만든다(같은 문자열은 같은 상태에서 끝나 하나로 접힌다).
 * ② 뿌리에서 너비 우선으로 상태를 꺼내며 **실패 쪽 상태**(그 상태의 문자열의 가장 긴 진접미사 중 상태로 있는 것)와
 * **사전 쪽 상태**(실패 쪽을 따라가며 처음 만나는, 패턴이 끝나는 상태)를 정한다. 실패 쪽으로 물러서는 걸음의 합이 패턴마다 그
 * 길이를 넘지 않아 ②도 패턴 목록 크기에 비례한다.
 *
 * **검색은 텍스트를 한 번 훑는다.** 문자 하나마다 자식이 없으면 실패 쪽으로 물러서고, 옮겨 간 상태에서 사전 쪽 사슬을 따라가며
 * 끝나는 패턴을 적는다. 물러서는 걸음은 앞으로 간 걸음을 넘지 못하므로 훑기가 텍스트 길이에 비례하고, 사전 쪽 사슬의 한 칸이
 * 곧 돌려줄 자리 하나라 적는 몫이 답의 수에 비례한다. **실패 쪽 사슬을 끝까지 따라가며 패턴을 찾지 않는 이유가 여기다** —
 * 패턴이 안 끝나는 상태도 지나가게 되어 그 몫이 답의 수가 아니라 상태의 깊이에 묶인다.
 *
 * **생성자가 받은 배열을 들고 있지 않는다** — 헤더 「연산 계약」의 구성 시점 조항과 배열 조항이 이 줄이다.
 */

// #region guide:core/types
interface State {
  /** 텍스트 문자(코드 단위) → 자식 상태. */
  readonly next: Map<number, State>;
  /** 이 상태의 문자열 길이. 뿌리는 0 이다. */
  readonly depth: number;
  /** 이 상태에서 끝나는 패턴. 없으면 `null`. */
  word: string | null;
  /** 가장 긴 진접미사 상태. 뿌리만 `null` 이다. */
  fail: State | null;
  /** 실패 쪽을 따라가며 처음 만나는, 패턴이 끝나는 상태. 없으면 `null`. */
  dict: State | null;
}

function freshState(depth: number): State {
  return { next: new Map(), depth, word: null, fail: null, dict: null };
}
// #endregion

// #region guide:core/class
export class AhoCorasick {
  readonly #root: State = freshState(0);

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(patterns: string[]) {
    for (const pattern of patterns) {
      this.__cost += 1;
      let state = this.#root;
      for (let i = 0; i < pattern.length; i++) {
        this.__cost += 1;
        const code = pattern.charCodeAt(i);
        let child = state.next.get(code);
        if (child === undefined) {
          child = freshState(state.depth + 1);
          state.next.set(code, child);
        }
        state = child;
      }
      state.word = pattern;
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

  /** 너비 우선으로 실패 쪽 · 사전 쪽 상태를 정한다. 부모가 자식보다 먼저 꺼내지므로 물러설 상태는 이미 정해져 있다. */
  #link(): void {
    const root = this.#root;
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
        queue.push(child);
      }
    }
  }

  /** 텍스트 앞 `end` 문자를 읽고 `state` 에 있을 때 끝나는 패턴을 전부 적는다 — 사전 쪽 사슬 한 칸이 답 하나다. */
  #report(state: State, end: number, found: Map<string, number[]>): void {
    let hit: State | null = state.word !== null ? state : state.dict;
    while (hit !== null) {
      this.__cost += 1;
      const word = hit.word as string;
      const starts = found.get(word);
      if (starts === undefined) found.set(word, [end - word.length]);
      else starts.push(end - word.length);
      hit = hit.dict;
    }
  }
}
// #endregion
