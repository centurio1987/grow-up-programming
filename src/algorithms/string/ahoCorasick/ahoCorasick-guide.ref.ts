/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/string/ahoCorasick/ahoCorasick.ts` 는 학습자가 채우는 자리라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`)과 경쟁 설계 계측(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 하나씩 바꾼다 — 자식이 없는 칸을 물려받는 줄, 실패 링크를 정하는 줄, 반환 직전에
 * 순서를 맞추는 줄. 맞는 줄이 정확히 하나가 아니면 던지므로 그 식들을 주석에 다시 적지 않는다.
 *
 * **되돌아가는 반복문을 쓰지 않는다.** 전이표에 빈 칸을 남기지 않으므로 텍스트 글자 하나에
 * 표를 한 번 조회하면 다음 상태가 정해진다. 그 대신 상태마다 `SIGMA` 칸을 잡는다 — 제약이
 * 정한 규모에서 그 칸 수가 얼마인지는 `*.proof.ts` 가 실행으로 낸다.
 */

/** 문자 집합의 크기. 제약이 소문자 영문 `a`–`z` 로 정했다. */
const SIGMA = 26;

/** 소문자 한 글자를 0..25 의 번호로 바꾼다. */
const codeOf = (ch: string): number => ch.charCodeAt(0) - 97;

/** 매칭 하나 — 몇 번 패턴이 텍스트의 어느 자리에서 시작하는가. */
export interface Match {
  patternIndex: number;
  position: number;
}

/**
 * 패턴 여럿을 합쳐 만든 전이 기계.
 *
 * 상태 하나가 「지금까지 읽은 텍스트의 접미사이면서 어떤 패턴의 접두사인 것 중 가장 긴 것」을
 * 뜻한다. 뿌리(상태 0)는 빈 문자열이다.
 */
export interface Automaton {
  /** `next[s * SIGMA + c]` — 상태 `s` 에서 글자 `c` 를 읽었을 때 갈 상태. 빈 칸이 없다. */
  next: Int32Array;
  /** `link[s]` — `s` 의 경로 문자열의 진 접미사이면서 어떤 패턴의 접두사인 것 중 가장 긴 상태. */
  link: Int32Array;
  /** `outLink[s]` — `s` 의 진 접미사 중 패턴이 끝나는 가장 가까운 상태. 없으면 `-1`. */
  outLink: Int32Array;
  /** `endOf[s]` — 상태 `s` 에서 끝나는 패턴의 번호들. */
  endOf: number[][];
  /** `depth[s]` — 뿌리에서 `s` 까지의 글자 수. `s` 에서 끝나는 패턴의 길이이기도 하다. */
  depth: Int32Array;
  /** 상태 수. 뿌리를 포함한다. */
  size: number;
}

/** 반환 규약의 순서 — `position` 오름차순, 같으면 `patternIndex` 오름차순. */
const byPosition = (a: Match, b: Match): number =>
  a.position - b.position || a.patternIndex - b.patternIndex;

/**
 * 패턴 배열을 하나의 전이 기계로 합친다.
 *
 * 길이 0 인 패턴은 담지 않는다 — 뿌리에 패턴 끝이 붙으면 글자를 하나도 읽지 않은 자리까지
 * 매칭이 되어 이 문제가 정의한 `position` 의 범위를 벗어난다.
 */
export function buildAutomaton(patterns: readonly string[]): Automaton {
  // 상태 수의 상한은 패턴 길이의 합에 뿌리 하나를 더한 것이다.
  let cap = 1;
  for (const p of patterns) cap += p.length;

  const next = new Int32Array(cap * SIGMA).fill(-1);
  const link = new Int32Array(cap);
  const outLink = new Int32Array(cap).fill(-1);
  const depth = new Int32Array(cap);
  const endOf: number[][] = Array.from({ length: cap }, () => [] as number[]);
  let size = 1;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i] as string;
    if (pattern.length === 0) continue;
    let s = 0;
    for (const ch of pattern) {
      const c = codeOf(ch);
      // ① 그 글자로 가는 자식이 없을 때만 상태를 새로 만든다.
      if (next[s * SIGMA + c] === -1) {
        next[s * SIGMA + c] = size;
        depth[size] = (depth[s] as number) + 1;
        size += 1;
      }
      s = next[s * SIGMA + c] as number;
    }
    // ② 패턴이 끝난 상태에 그 패턴의 번호를 적는다.
    (endOf[s] as number[]).push(i);
  }

  // 실패 링크와 전이표를 깊이가 얕은 상태부터 채운다. 큐에 담는 순서가 곧 그 순서다.
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  for (let c = 0; c < SIGMA; c++) {
    const child = next[c] as number;
    if (child === -1) {
      // ③ 뿌리에 그 글자로 가는 자식이 없으면 그 칸은 뿌리 자신이다.
      next[c] = 0;
    } else {
      link[child] = 0;
      queue[tail] = child;
      tail += 1;
    }
  }

  while (head < tail) {
    const v = queue[head] as number;
    head += 1;
    const f = link[v] as number;
    // ④ 출력 링크는 실패 링크가 가리키는 상태에서 물려받는다. 그 상태에서 패턴이 끝나면
    //    그 상태 자신이고, 아니면 그 상태의 출력 링크다.
    outLink[v] = (endOf[f] as number[]).length > 0 ? f : (outLink[f] as number);
    for (let c = 0; c < SIGMA; c++) {
      const u = next[v * SIGMA + c] as number;
      if (u === -1) {
        // ⑤ 자식이 없는 칸은 실패 링크가 가리키는 상태의 같은 칸을 그대로 물려받는다.
        next[v * SIGMA + c] = next[f * SIGMA + c] as number;
      } else {
        link[u] = next[f * SIGMA + c] as number;
        queue[tail] = u;
        tail += 1;
      }
    }
  }

  return { next, link, outLink, endOf, depth, size };
}

/**
 * 텍스트 안에서 패턴들이 등장하는 모든 `{ 패턴 번호, 시작 자리 }` 를 돌려준다.
 * 겹쳐서 등장하는 자리도 전부 담고, `position` 오름차순 · 같으면 `patternIndex` 오름차순이다.
 */
export function ahoCorasick(text: string, patterns: string[]): Match[] {
  const auto = buildAutomaton(patterns);
  const found: Match[] = [];
  let s = 0;
  for (let pos = 0; pos < text.length; pos++) {
    // ⑥ 글자 하나에 표를 한 번 조회해 다음 상태로 옮긴다. 되돌아가는 반복문이 없다.
    s = auto.next[s * SIGMA + codeOf(text[pos] as string)] as number;
    // ⑦ 지금 상태에서 끝나는 패턴부터 출력 링크를 따라가며 전부 거둔다. 짧은 패턴이
    //    긴 패턴의 접미사로 숨어 있는 자리가 여기서 나온다.
    for (let t = s; t !== -1; t = auto.outLink[t] as number) {
      for (const i of auto.endOf[t] as number[]) {
        const length = auto.depth[t] as number;
        found.push({ patternIndex: i, position: pos - length + 1 });
      }
    }
  }
  // ⑧ 찾은 순서는 패턴이 끝난 자리의 순서다. 문제가 요구한 시작 자리 순서로 다시 맞춘다.
  found.sort(byPosition);
  return found;
}
