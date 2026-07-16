class AVLNode<T> {
  value: T;
  left: AVLNode<T> | undefined = undefined;
  right: AVLNode<T> | undefined = undefined;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

// 노드가 없으면 높이는 0으로 취급합니다 — 리프의 높이가 1이 되도록 맞추는 관례예요.
function h<T>(node: AVLNode<T> | undefined): number {
  return node?.height ?? 0;
}

function bf<T>(node: AVLNode<T>): number {
  return h(node.left) - h(node.right);
}

function updateHeight<T>(node: AVLNode<T>): void {
  node.height = 1 + Math.max(h(node.left), h(node.right));
}

function rotateRight<T>(z: AVLNode<T>): AVLNode<T> {
  const y = z.left!;
  z.left = y.right;
  y.right = z;
  updateHeight(z); // 아래(z) 먼저
  updateHeight(y); // 위(y) 나중
  return y;
}

function rotateLeft<T>(z: AVLNode<T>): AVLNode<T> {
  const y = z.right!;
  z.right = y.left;
  y.left = z;
  updateHeight(z);
  updateHeight(y);
  return y;
}

function rebalance<T>(node: AVLNode<T>): AVLNode<T> {
  updateHeight(node);
  const balance = bf(node);

  if (balance > 1) {
    if (bf(node.left!) < 0) {
      node.left = rotateLeft(node.left!); // LR: 자식부터 반대 방향으로
    }
    return rotateRight(node); // LL, 또는 LR 교정 후
  }

  if (balance < -1) {
    if (bf(node.right!) > 0) {
      node.right = rotateRight(node.right!); // RL: 자식부터 반대 방향으로
    }
    return rotateLeft(node); // RR, 또는 RL 교정 후
  }

  return node;
}

export class AVLTree<T> {
  private root: AVLNode<T> | undefined = undefined;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(value: T): void {
    if (this.has(value)) return; // set 의미론: 중복은 무시
    this.root = this.insertNode(this.root, value);
    this._size++;
  }

  private insertNode(node: AVLNode<T> | undefined, value: T): AVLNode<T> {
    if (node === undefined) return new AVLNode(value);
    const cmp = this.comparator(value, node.value);
    if (cmp < 0) node.left = this.insertNode(node.left, value);
    else node.right = this.insertNode(node.right, value);
    return rebalance(node); // 재귀가 돌아올 때마다 아래에서 위로 재균형
  }

  delete(value: T): boolean {
    if (!this.has(value)) return false;
    this.root = this.deleteNode(this.root, value);
    this._size--;
    return true;
  }

  private deleteNode(node: AVLNode<T> | undefined, value: T): AVLNode<T> | undefined {
    if (node === undefined) return undefined;
    const cmp = this.comparator(value, node.value);
    if (cmp < 0) {
      node.left = this.deleteNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.deleteNode(node.right, value);
    } else {
      if (node.left === undefined) return node.right;
      if (node.right === undefined) return node.left;
      // 자식이 둘: 중위 후계자(오른쪽 서브트리의 최솟값)로 값을 바꾼 뒤
      // 그 후계자를 실제로 삭제한다.
      let successor = node.right;
      while (successor.left !== undefined) successor = successor.left;
      node.value = successor.value;
      node.right = this.deleteNode(node.right, successor.value);
    }
    return rebalance(node);
  }

  has(value: T): boolean {
    let node = this.root;
    while (node !== undefined) {
      const cmp = this.comparator(value, node.value);
      if (cmp === 0) return true;
      node = cmp < 0 ? node.left : node.right;
    }
    return false;
  }

  min(): T | undefined {
    let node = this.root;
    if (node === undefined) return undefined;
    while (node.left !== undefined) node = node.left;
    return node.value;
  }

  max(): T | undefined {
    let node = this.root;
    if (node === undefined) return undefined;
    while (node.right !== undefined) node = node.right;
    return node.value;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: AVLNode<T> | undefined) => {
      if (node === undefined) return;
      walk(node.left);
      result.push(node.value);
      walk(node.right);
    };
    walk(this.root);
    return result;
  }

  size(): number {
    return this._size;
  }

  height(): number {
    return h(this.root);
  }
}