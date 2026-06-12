---
name: gen-problem
description: 코드 테스트 문제를 세팅하고, 테스트 환경을 구성합니다.
disable-model-invocation: true
argument-hint: <file-name>
---

## generate problem solving env for $ARGUMENTS

테스트 구성은 checklist.md를 참고합니다.

1. src/$ARGUMENTS.ts 주석을 참조합니다.
2. 주석 내용을 사용해서 완전한 문제를 만듭니다.
3. 작성한 문제는 src/$ARGUMENTS-problem.md 로 작성합니다.
4. 작성한 문제에 대응하는 테스트 코드를 작성합니다.
5. 테스트 코드가 문제를 제대로 반영하고, 충분한 커버리지를 제공하는지 검토합니다.

## 문제 구성

- 함수 인터페이스
- 제약 조건
- 문제 상세
- 문제에 대한 예시

## 조건

- 함수의 파라미터명은 언더바를 prefix로 사용하지 않는다.
- 문제 풀이에 대한 힌트를 포함하지 않는다.
