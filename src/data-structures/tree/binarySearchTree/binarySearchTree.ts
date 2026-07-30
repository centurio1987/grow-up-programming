/**
 * Binary Search Tree (이진 탐색 트리)
 *
 * 정수 키를 저장하는 BST를 구현하라.
 *
 * 요구사항:
 * - insert(key): 키를 BST에 삽입한다. 이미 존재하면 무시한다.
 * - search(key): 키가 존재하면 true, 없으면 false를 반환한다.
 * - delete(key): 키를 BST에서 제거한다. 없으면 무시한다.
 *   자식이 둘인 경우 오른쪽 서브트리의 최솟값(in-order successor)으로 대체한다.
 * - inorder(): 중위 순회 결과를 오름차순 배열로 반환한다.
 * - min(): BST의 최솟값을 반환한다. 비어있으면 undefined를 반환한다.
 * - max(): BST의 최댓값을 반환한다. 비어있으면 undefined를 반환한다.
 *
 * 시간복잡도 (균형 트리 기준):
 * - insert / search / delete: O(log n) 평균, O(n) 최악
 * - inorder: O(n)
 */

class Node {
  public left: Node | null;
  public right: Node | null;

  constructor(public key: number) {
    this.left = null;
    this.right = null;
  }
}

export class BinarySearchTree {
  private root: Node | null;

  constructor() {
    this.root = null;
  }

  insert(key: number): void {
    if (this.root === null) {
      this.root = new Node(key);
      return;
    }

    let node: Node | null = this.root;

    while (node !== null) {
      if (key === node.key) {
        return;
      } else if (key > node.key) {
        if (node.right === null) {
          node.right = new Node(key);
          return;
        }

        node = node.right;
      } else {
        if (node.left === null) {
          node.left = new Node(key);
          return;
        }
        node = node.left;
      }
    }
  }

  search(key: number): boolean {
    if (this.root === null) {
      return false;
    }

    let node: Node | null = this.root;

    while (node) {
      if (key === node.key) {
        return true;
      } else if (key > node.key) {
        node = node.right;
      } else {
        node = node.left;
      }
    }

    return false;
  }

  delete(key: number): void {
    /**
     * 1. 타겟 찾기
     * 2. 자식 상태에 따라 처리
     */

    let parent: Node | null = null;
    let node: Node | null = this.root;

    while (node !== null) {
      if (key === node.key) {
        break;
      } else if (key > node.key) {
        parent = node;
        node = node.right;
      } else {
        parent = node;
        node = node.left;
      }
    }

    if (node === null) {
      return;
    }

    if (node?.right === null && node?.left === null) {
      this.deleteNoChild(parent, node);
    } else if (node?.right !== null && node?.left !== null) {
      let successor = this.findSuccessor(node, node!.right);

      node!.key = successor.node.key;

      if (successor.node.right !== null) {
        this.deleteOneChild(successor.parent, successor.node);
      } else {
        this.deleteNoChild(successor.parent, successor.node);
      }
    } else {
      this.deleteOneChild(parent, node);
    }
  }

  private deleteNoChild(parent: Node | null, node: Node) {
    if (parent === null) {
      this.root = null;
      return;
    }

    if (parent!.right?.key === node.key) {
      parent.right = null;
    } else {
      parent.left = null;
    }
  }

  private deleteOneChild(parent: Node | null, node: Node) {
    if (parent === null) {
      this.root = node.right ?? node.left;
      return;
    }

    if (parent!.right?.key === node.key) {
      parent.right = node.right ?? node.left;
    } else {
      parent.left = node.right ?? node.left;
    }
  }

  private findSuccessor(parent: Node, node: Node) {
    while (node.left !== null) {
      parent = node;
      node = node.left;
    }

    return {
      parent,
      node,
    };
  }

  inorder(): number[] {
    const arr: number[] = [];
    const stack: Node[] = [];

    /**
     * 노드 푸시
     * 왼쪽 있으면 넘어가기
     * 없으면 팝
     * traverse arr 등록
     * 오른쪽 있으면 푸시하고 넘어가기
     * 왼쪽 있으면 넘어가기
     * 없으면 팝
     */

    if (this.root === null) {
      return arr;
    }

    let node: Node | null = this.root as Node;
    stack.push(node);

    while (stack.length !== 0) {
      if (node !== null && node.left !== null) {
        node = node.left;
        stack.push(node);
      } else {
        node = stack.pop() as Node;
        arr.push(node.key);

        if (node.right !== null) {
          node = node.right;
          stack.push(node);
        } else {
          node = null;
        }
      }
    }

    return arr;
  }

  min(): number | undefined {
    if (this.root === null) {
      return;
    }

    let node: Node | null = this.root;

    while (node.left !== null) {
      node = node.left;
    }

    return node.key;
  }

  max(): number | undefined {
    if (this.root === null) {
      return;
    }

    let node: Node | null = this.root;

    while (node.right !== null) {
      node = node.right;
    }

    return node.key;
  }
}
