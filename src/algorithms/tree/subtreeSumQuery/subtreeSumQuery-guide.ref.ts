/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `subtreeSumQuery.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지인데 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있다. 재귀로 적으면 호출 깊이가 그대로 100,000 이 되어 자바스크립트 호출 스택이
 * 먼저 끝난다. 스택을 배열로 두면 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 넷이
 * 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다. **여기에 그 줄을 그대로 옮겨 적지
 * 않는다** — 변이 정규식이 주석 줄에도 맞아 「두 줄에 맞았다」로 실패한다.
 *
 * - ⑤ 의 구간 끝을 마지막으로 나간 자리가 아니라 자기 진입 자리로 두면 구간이 한 칸이 된다.
 * - ⑨ 에서 구간 시작 **앞**이 아니라 시작 자리에서 끊으면 자기 값이 함께 빠진다.
 * - ⑦ 의 차이를 새 값 자체로 두면 교체 갱신이 누적 갱신이 된다.
 * - ⑦ 에서 새 값을 적어 두는 줄을 빼면 **한 정점을 두 번 갱신할 때만** 답이 갈린다.
 */

export class SubtreeSumQuery {
  private readonly n: number;
  private readonly tin: number[];
  private readonly tout: number[];
  private readonly value: number[];
  private readonly tree: number[];

  constructor(
    n: number,
    edges: [number, number][],
    root: number,
    values: number[],
  ) {
    this.n = n;

    // ① 간선 목록을 정점마다의 이웃 목록으로 옮긴다. 무방향이라 양쪽에 넣는다.
    const near: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      (near[u] as number[]).push(v);
      (near[v] as number[]).push(u);
    }

    // ② 정점마다 적는 칸 — 진입 자리 `tin`, 부분 트리가 끝나는 자리 `tout`, 지금 값 `value`.
    this.tin = Array.from({ length: n }, () => 0);
    this.tout = Array.from({ length: n }, () => 0);
    this.value = values.slice();

    // ③ 배열 스택으로 뿌리에서 한 번 순회한다. `seen` 은 자리를 이미 받은 정점이고 `cursor`
    // 는 그 정점의 이웃 목록에서 다음에 읽을 자리다. 정점 하나가 스택에 한 번만 들어간다.
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const cursor: number[] = Array.from({ length: n }, () => 0);
    const stack: number[] = [root];
    let timer = 0;
    seen[root] = true;
    this.tin[root] = timer;
    timer++;

    while (stack.length > 0) {
      const v = stack[stack.length - 1] as number;
      const nbrs = near[v] as number[];
      const i = cursor[v] as number;

      if (i < nbrs.length) {
        cursor[v] = i + 1;
        const w = nbrs[i] as number;
        // ④ 아직 자리를 안 받은 이웃 — 다음 자리를 주고 스택에 담는다. 이미 받았으면 부모
        // 방향이라 아무것도 하지 않는다.
        if (!(seen[w] as boolean)) {
          seen[w] = true;
          this.tin[w] = timer;
          timer++;
          stack.push(w);
        }
        continue;
      }

      // ⑤ 이웃을 다 본 정점 — 그 사이 나간 자리가 전부 이 정점의 자손이므로, 마지막으로
      // 나간 자리 `timer - 1` 이 이 부분 트리의 끝이다.
      this.tout[v] = timer - 1;
      stack.pop();
    }

    // ⑥ 펜윅 트리를 값에서 한 번에 만든다. 칸 `i` 에 자리 `i - 1` 의 값을 적고, 각 칸을
    // 자기를 덮는 다음 칸 `i + (i & -i)` 에 한 번씩 더한다.
    this.tree = Array.from({ length: n + 1 }, () => 0);
    for (let v = 0; v < n; v++) {
      this.tree[(this.tin[v] as number) + 1] = values[v] as number;
    }
    for (let i = 1; i <= n; i++) {
      const up = i + (i & -i);
      if (up <= n) {
        this.tree[up] = (this.tree[up] as number) + (this.tree[i] as number);
      }
    }
  }

  update(node: number, value: number): void {
    // ⑦ 값을 교체한다. 펜윅 트리는 더하기만 받으므로 새 값과 지금 값의 차이를 넣는다.
    const delta = value - (this.value[node] as number);
    this.value[node] = value;

    // ⑧ 자리 `tin[node]` 를 덮는 칸을 따라 올라가며 그 차이를 더한다.
    for (let i = (this.tin[node] as number) + 1; i <= this.n; i += i & -i) {
      this.tree[i] = (this.tree[i] as number) + delta;
    }
  }

  querySubtree(node: number): number {
    // ⑨ 부분 트리는 자리 `tin[node]` 부터 `tout[node]` 까지 끊기지 않고 이어져 있다. 그
    // 구간의 합은 접두사 합 둘의 차다.
    return (
      this.prefix(this.tout[node] as number) -
      this.prefix((this.tin[node] as number) - 1)
    );
  }

  /** 자리 0 부터 `last` 까지의 합. `last` 가 `-1` 이면 0 이다. */
  private prefix(last: number): number {
    let sum = 0;
    for (let i = last + 1; i > 0; i -= i & -i) {
      sum += this.tree[i] as number;
    }
    return sum;
  }
}
