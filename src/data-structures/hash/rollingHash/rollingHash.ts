/**
 * RollingHash (롤링 해시 / Rabin-Karp)
 *
 * 슬라이딩 윈도우를 한 칸 이동할 때 O(1)에 해시를 재계산하는 기법.
 *
 * 다항식 해시: hash(s) = s[0]*base^(m-1) + s[1]*base^(m-2) + ... + s[m-1]) mod
 * 윈도우를 오른쪽으로 한 칸 이동:
 *   newHash = (oldHash - s[i]*base^(m-1)) * base + s[i+m]) mod
 *
 * 표절 감지, 중복 코드 검색 등 긴 텍스트에서 패턴을 O(n+m) 평균으로 찾는 데 활용.
 *
 * 요구사항:
 * - constructor(base, mod): 해시 파라미터 초기화
 * - hash(s): 문자열 전체의 해시값 반환
 * - search(text, pattern): Rabin-Karp 패턴 매칭, 패턴 시작 인덱스 배열 반환
 *
 * 시간복잡도:
 * - hash: O(m)
 * - search: O(n + m) 평균, O(nm) 최악 (해시 충돌 시)
 */
export class RollingHash {
  private base: number;
  private mod: number;

  constructor(base: number = 31, mod: number = 1_000_000_007) {
    throw new Error("Not implemented");
  }

  hash(s: string): number {
    throw new Error("Not implemented");
  }

  search(text: string, pattern: string): number[] {
    throw new Error("Not implemented");
  }
}
