/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/string/radixTree/radixTree.ts` 는 학습자가 채우는 자리라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`)과 경쟁 설계 계측(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾼다 — 분할 뒤 부모의 자식 자리를 새 중간 노드로 바꾸는 줄, 새 단어가 가른
 * 자리에서 끝날 때 중간 노드에 단어 끝 표시를 남기는 줄, 라벨 도중에 어긋난 것을 없는 것으로
 * 보는 줄, 문자열이 라벨 도중에 끝난 것을 도착으로 보는 줄. 맞는 줄이 정확히 하나가 아니면
 * 던지므로 그 식들을 주석에 다시 적지 않는다.
 *
 * **재귀를 쓰지 않는다.** 제약이 문자열 길이를 100,000 까지 허용해서, 글자마다 한 겹씩
 * 쌓이는 재귀는 그 규모에서 호출 스택이 넘친다. 라딕스 트리 자체의 깊이는 그보다 훨씬
 * 얕지만(노드 하나가 글자 여럿을 담으므로), 같은 문제를 트라이로 풀면 깊이가 문자열 길이와
 * 같아진다 — 사이드카가 두 구조를 나란히 재므로 순회를 전부 스택으로 적는다.
 */

/** 두 문자열이 앞에서부터 몇 글자까지 같은가. */
export function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let k = 0;
  while (k < limit && a[k] === b[k]) k++;
  return k;
}

/**
 * 라딕스 트리의 노드 하나.
 *
 * 부모에서 이 노드로 오는 간선의 **글자들**을 `label` 에 담는다 — 트라이는 그 자리에 글자
 * 하나만 두지만 여기서는 갈림이 없는 구간이 통째로 들어온다.
 */
class RadixNode {
  /** 자식 라벨의 **첫 글자** → 그 라벨을 든 자식 노드. */
  readonly children = new Map<string, RadixNode>();
  /** 뿌리에서 이 노드까지 라벨을 이어 붙인 문자열이 삽입된 단어이면 참. */
  end = false;
  /** 부모에서 이 노드로 오는 간선의 글자들. 뿌리만 빈 문자열이다. */
  label: string;

  constructor(label: string) {
    this.label = label;
  }
}

/** `locate` 가 돌려주는 것. `leftover` 는 도착한 노드의 라벨 중 아직 안 쓴 글자 수다. */
interface Landing {
  node: RadixNode;
  leftover: number;
}

/**
 * 소문자 영문 단어를 담고, **정확히 그 단어가 있는가**(`search`)와 **그 문자열로 시작하는
 * 단어가 있는가**(`startsWith`)를 각각 답하는 압축 접두사 트리.
 *
 * 세 연산 모두 받은 문자열의 길이에만 비례한다 — 담긴 단어의 개수를 보지 않는다.
 */
export class RadixTree {
  private readonly root = new RadixNode("");

  /** `word` 를 담는다. 라벨 도중에 갈리면 그 자리에서 라벨을 둘로 가른다. */
  insert(word: string): void {
    // ① 뿌리에서 출발한다. `rest` 는 아직 트리에 적지 못한 남은 글자들이다.
    let node = this.root;
    let rest = word;
    while (rest !== "") {
      const head = rest[0] as string;
      const child = node.children.get(head);
      if (child === undefined) {
        // ② 첫 글자가 같은 자식이 없으면 남은 글자 전부를 라벨 하나로 단다.
        const leaf = new RadixNode(rest);
        leaf.end = true;
        node.children.set(head, leaf);
        return;
      }
      const k = commonPrefixLength(rest, child.label);
      if (k === child.label.length) {
        // ③ 라벨을 전부 소비했으면 그 자식으로 내려가고 남은 글자를 그만큼 줄인다.
        rest = rest.slice(k);
        node = child;
        continue;
      }
      // ④ 라벨 도중에 갈리면 공통 부분에서 라벨을 둘로 가른다.
      const mid = new RadixNode(child.label.slice(0, k));
      child.label = child.label.slice(k);
      mid.children.set(child.label[0] as string, child);
      // ⑤ 부모가 가리키던 자식 자리를 새 중간 노드로 바꾼다.
      node.children.set(head, mid);
      const tail = rest.slice(k);
      if (tail === "") {
        // ⑥ 새 단어가 가른 자리에서 끝나면 중간 노드가 단어 끝이다.
        mid.end = true;
      } else {
        const leaf = new RadixNode(tail);
        leaf.end = true;
        mid.children.set(tail[0] as string, leaf);
      }
      return;
    }
    // ⑦ 남은 글자가 다 없어졌으면 지금 서 있는 노드가 그 단어의 끝이다.
    node.end = true;
  }

  /** `word` 가 삽입된 적이 있으면 참. */
  search(word: string): boolean {
    const hit = this.locate(word);
    // ⑪ 라벨을 남김없이 소비한 자리여야 하고, 그 노드에 단어 끝 표시도 있어야 한다.
    return hit !== null && hit.leftover === 0 && hit.node.end;
  }

  /** `prefix` 로 시작하는 단어가 하나라도 삽입돼 있으면 참. */
  startsWith(prefix: string): boolean {
    // ⑫ 따라 내려갈 수 있기만 하면 된다. 라벨을 남겼는지도 단어 끝인지도 보지 않는다.
    return this.locate(prefix) !== null;
  }

  /**
   * `s` 를 라벨 단위로 따라간 자리. 못 따라가면 `null`.
   *
   * 반복문을 빠져나오는 경로는 `s` 가 빈 문자열일 때뿐이다 — 라벨을 전부 소비하는 갈래는
   * `rest` 가 아직 남아 있을 때만 오기 때문이다. 그때는 뿌리가 답이다.
   */
  private locate(s: string): Landing | null {
    let node = this.root;
    let rest = s;
    while (rest !== "") {
      const child = node.children.get(rest[0] as string);
      // ⑧ 첫 글자가 같은 자식이 없으면 이 문자열은 어떤 단어의 접두사도 아니다.
      if (child === undefined) return null;
      const k = commonPrefixLength(rest, child.label);
      // ⑨ 문자열이 라벨 도중에 끝났다. 그 노드가 도착이고 라벨이 그만큼 남는다.
      if (k === rest.length)
        return { node: child, leftover: child.label.length - k };
      // ⑩ 라벨 도중에 글자가 어긋났다. 이 자식 말고는 갈 곳이 없다.
      if (k < child.label.length) return null;
      rest = rest.slice(child.label.length);
      node = child;
    }
    return { node, leftover: 0 };
  }
}
