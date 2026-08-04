export function bfsShortestPath(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  const distanceList = Array.from({ length: n }, () => -1);
  const adj: number[][] = Array.from({ length: n }, () => []);
  const queue = new CircularQueue<number>(n);
  const visited = new Uint8Array(n);

  for (let [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }

  distanceList[source] = 0;
  queue.enqueue(source);
  visited[source] = 1;

  while (queue.length !== 0) {
    const node = queue.dequeue() as number;

    for (let neighbor of adj[node] as number[]) {
      if (visited[neighbor] === 0) {
        distanceList[neighbor] = distanceList[node]! + 1;
        visited[neighbor] = 1;
        queue.enqueue(neighbor);
      }
    }
  }

  return distanceList;
}

class CircularQueue<T> {
  private arr: T[];
  private capacity: number;
  private head: number;
  private tail: number;
  private counter: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.arr = new Array(capacity);
    this.counter = 0;
    this.head = 0;
    this.tail = 0;
  }

  enqueue(item: T) {
    if (this.capacity === this.counter) throw new Error();

    this.arr[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.counter++;
  }

  dequeue() {
    if (this.counter === 0) return null;

    const item = this.arr[this.head] as number;
    this.head = (this.head + 1) % this.capacity;
    this.counter--;

    return item;
  }

  get length() {
    return this.counter;
  }
}
