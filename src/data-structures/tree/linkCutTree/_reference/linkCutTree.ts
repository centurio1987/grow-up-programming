/**
 * `tree/linkCutTree` 정본(규약2).
 *
 * 계약은 `../linkCutTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 나무를 오일러 지나기 수열로 펴서
 * 균형 이진 탐색 트리에 담는 구현도 세 행을 전부 상각 로그 안에 한다. 이 파일이 정본인
 * 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"마디 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 자리를 도는 일도 지나간 마디로 센다. 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위).
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **접힌 길(preferred path)을 갈아 끼우는 것이 이 구현의 전부다.** 숲의 각 나무를 여러
 * 길로 쪼개 두고, 길 하나를 이진 탐색 트리 하나에 담는다. 그 트리 안의 중위 순서가 길
 * 위의 순서다. 어떤 마디를 만지면 뿌리에서 그 마디까지가 길 하나가 되도록 갈아 끼우고
 * (`#access`), 갈아 끼우는 비용을 끌어올리기가 갚는다.
 *
 * **뒤집기 표시(`flip`)가 있는 이유는 `link` 가 방향을 요구하기 때문이다.** 간선을 넣으려면
 * 한쪽을 그 나무의 뿌리로 세워야 하는데, 뿌리를 옮기는 일은 길 하나를 통째로 뒤집는 일이다.
 * 실제로 뒤집지 않고 표시만 달아 두었다가 내려가는 길에 내린다(`#push`).
 *
 * **`cut` 이 간선의 존재를 판정하는 자리.** `u` 를 뿌리로 세우고 `v` 를 만지면 뿌리에서
 * `v` 까지가 길 하나가 되고, 그 길이 담긴 트리의 중위 순서가 곧 `u`→`v` 경로다. 그 경로가
 * 정확히 두 마디일 때만 간선 `(u, v)` 가 있다 — 트리에서 그것은 「`v` 의 왼쪽이 `u` 이고
 * `u` 의 오른쪽이 비었다」로 읽힌다.
 *
 * **이 정본이 드는 내부 불변량 셋은 계약에 없다**(불변 사실 109). 계약이 그것을 관측하지
 * 못하므로 네 축 중 어느 것도 이름으로 검사하지 않는다 — 어긋나면 답이 틀리므로 축1이
 * 값에서 잡는다. 셋을 계약에 못 적는 이유는 이 표현에서만 뜻이 있는 말이기 때문이다.
 * ① 길 하나를 담은 트리의 **중위 순서가 길 위의 순서**다(뿌리에 가까운 쪽이 앞).
 * ② 마디마다 **자식으로 든 같은 길의 마디가 하나 이하**이고, 나머지는 자기 길의 머리가 된다.
 * ③ `flip` 은 **그 자리 아래 전부**를 뜻하고, 내려갈 때 자식 둘에게 물려준 뒤 지워진다.
 *
 * **`connected` 도 담는 모양을 고친다.** 뿌리를 찾는 일이 길을 갈아 끼우고 끌어올리므로,
 * 읽기만 하는 호출이 트리를 바꾼다. 계약이 말하는 상태(어느 마디가 어느 나무에 있는가)는
 * 그대로이므로 위반이 아니다(불변 사실 79 와 같은 자리). 그리고 **빼면 계약을 어긴다** —
 * 사슬 끝을 되풀이해 물을 때 매번 끝까지 걸어 올라가게 되고, 그 시퀀스의 평균이 마디 수에
 * 비례한다. 상각 보장은 「접근한 자리는 반드시 끌어올린다」에서만 나온다(불변 사실 101).
 */

// #region guide:core/types
/**
 * 길 하나를 담는 이진 탐색 트리의 자리.
 *
 * `parent` 가 두 가지 일을 겸한다 — 같은 길 안에서는 트리의 부모이고, 길의 머리에서는
 * **그 길이 매달린 위쪽 길의 마디**를 가리킨다. 둘을 가르는 것은 부모가 자신을 자식으로
 * 들고 있는가뿐이고(`#isRoot`), 그래서 자리 하나에 참조를 더 두지 않는다.
 */
interface Node {
  left: Node | null;
  right: Node | null;
  parent: Node | null;
  /** 이 자리 아래의 길이 뒤집혀 있다는 표시. 내려갈 때 내린다. */
  flip: boolean;
}
// #endregion

// #region guide:core/class
export class LinkCutTree {
  readonly #nodes: readonly Node[];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `마디 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    const nodes: Node[] = [];
    for (let made = 0; made < n; made++) {
      nodes.push({ left: null, right: null, parent: null, flip: false });
    }
    this.#nodes = nodes;
  }

  link(u: number, v: number): boolean {
    const from = this.#at(u);
    const to = this.#at(v);
    if (this.#sameTree(from, to)) return false;

    // `from` 을 그 나무의 뿌리로 세운 뒤 `to` 에 매단다. 매다는 것은 위쪽 길을 가리키는
    // 참조 하나이고, `to` 는 그것을 자식으로 들지 않는다 — 그래서 아직 다른 길이다.
    this.#makeRoot(from);
    from.parent = to;
    return true;
  }

  cut(u: number, v: number): boolean {
    const from = this.#at(u);
    const to = this.#at(v);
    if (from === to) return false;

    this.#makeRoot(from);
    this.#access(to);
    this.#splay(to);
    this.#push(to);

    const left = to.left;
    if (left !== from) return false;
    this.#push(from);
    if (from.right !== null) return false;

    to.left = null;
    from.parent = null;
    return true;
  }

  connected(u: number, v: number): boolean {
    const from = this.#at(u);
    const to = this.#at(v);
    if (from === to) return true;
    return this.#sameTree(from, to);
  }

  #at(index: number): Node {
    const node = this.#nodes[index];
    if (node === undefined) {
      throw new RangeError(
        `마디 번호는 [0, ${this.#nodes.length}) 안이어야 한다 — 받은 값은 ${index} 다`,
      );
    }
    return node;
  }

  #sameTree(from: Node, to: Node): boolean {
    return this.#findRoot(from) === this.#findRoot(to);
  }

  /** 그 마디가 속한 나무의 뿌리. 찾은 뒤 끌어올려 다음 호출을 싸게 만든다. */
  #findRoot(node: Node): Node {
    this.#access(node);
    this.#splay(node);
    let at = node;
    for (;;) {
      this.#push(at);
      const next = at.left;
      if (next === null) break;
      this.__cost += 1;
      at = next;
    }
    this.#splay(at);
    return at;
  }

  /** 그 마디를 자기 나무의 뿌리로 세운다. 뿌리까지의 길을 통째로 뒤집는 일이다. */
  #makeRoot(node: Node): void {
    this.#access(node);
    this.#splay(node);
    node.flip = !node.flip;
    this.#push(node);
  }

  /**
   * 나무의 뿌리에서 `node` 까지가 길 하나가 되도록 갈아 끼운다.
   *
   * 위로 한 칸 오를 때마다 그 위쪽 길의 접힌 자식을 버리고 아래에서 올라온 길을 대신
   * 붙인다. 버리는 것은 참조를 끊는 일이 아니라 **자식 자리에서 내리는 일**이고, 내려간
   * 길은 부모 참조를 그대로 들고 있으므로 잃어버리지 않는다.
   */
  #access(node: Node): void {
    this.#splay(node);
    node.right = null;

    let at = node;
    while (at.parent !== null) {
      const above = at.parent;
      this.__cost += 1;
      this.#splay(above);
      above.right = at;
      // `above` 가 이미 자기 길의 트리 뿌리이므로 `at` 은 지금 그 뿌리의 자식이다.
      // 이 호출은 회전 한 번으로 끝난다 — 끌어올리기를 두 번 도는 것이 아니다.
      this.#splay(at);
    }
  }

  /** 같은 길 안에서 `node` 를 그 트리의 뿌리로 끌어올린다. */
  #splay(node: Node): void {
    // 회전하기 전에 뒤집기 표시를 위에서부터 내린다. 안 내리면 자식의 좌우가 뒤바뀐
    // 상태로 회전 방향을 정하게 된다.
    const path: Node[] = [node];
    let top = node;
    while (!this.#isRoot(top)) {
      top = top.parent as Node;
      path.push(top);
    }
    for (let i = path.length - 1; i >= 0; i--) {
      this.__cost += 1;
      this.#push(path[i] as Node);
    }

    while (!this.#isRoot(node)) {
      const parent = node.parent as Node;
      if (!this.#isRoot(parent)) {
        const grand = parent.parent as Node;
        // 자신과 부모가 같은 쪽 자식이면 **부모를 먼저** 돌린다. 이 한 줄이 길을
        // 납작하게 만드는 자리이고, 뒤집으면 사슬이 사슬로 남는다.
        if ((grand.left === parent) === (parent.left === node)) {
          this.#rotate(parent);
        } else {
          this.#rotate(node);
        }
      }
      this.#rotate(node);
    }
  }

  /**
   * 그 자리가 자기 길의 트리 뿌리인가.
   *
   * 부모 참조가 있어도 부모가 자신을 자식으로 들고 있지 않으면 그 참조는 **위쪽 길을
   * 가리키는 것**이므로 여기가 뿌리다.
   */
  #isRoot(node: Node): boolean {
    const parent = node.parent;
    return parent === null || (parent.left !== node && parent.right !== node);
  }

  #push(node: Node): void {
    if (!node.flip) return;
    const swapped = node.left;
    node.left = node.right;
    node.right = swapped;
    if (node.left !== null) node.left.flip = !node.left.flip;
    if (node.right !== null) node.right.flip = !node.right.flip;
    node.flip = false;
  }

  /** `node` 를 부모 위로 올린다. 부모의 자리를 이어받고 부모를 자기 자식으로 내린다. */
  #rotate(node: Node): void {
    const parent = node.parent as Node;
    const grand = parent.parent;
    const parentWasRoot = this.#isRoot(parent);

    if (parent.left === node) {
      parent.left = node.right;
      if (node.right !== null) node.right.parent = parent;
      node.right = parent;
    } else {
      parent.right = node.left;
      if (node.left !== null) node.left.parent = parent;
      node.left = parent;
    }
    parent.parent = node;
    node.parent = grand;

    // 부모가 자기 길의 뿌리였으면 조부모 참조는 위쪽 길을 가리키는 것이므로 자식 자리를
    // 고치지 않는다. 고치면 없던 간선이 생긴다.
    if (!parentWasRoot && grand !== null) {
      if (grand.left === parent) grand.left = node;
      else grand.right = node;
    }
  }
}
// #endregion
