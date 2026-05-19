---
name: gen-problem
description: 코드 테스트 문제를 세팅하고, 테스트 환경을 구성합니다.
disable-model-invocation: true
argument-hint: <file-name>
---

## generate problem solving env for $ARGUMENTS

테스트 구성은 checklist.md를 참고합니다.

1. src/$ARGUMENTS.ts를 참조합니다.
2. 파일 내부 주석에 적힌 문제를 보고, 문제를 풀기 위해 필요한 함수 스켈레톤을 선언합니다. 함수 주석에는 문제를 LaTex로 정의하여 수학적 표기를 추가합니다. parameter 명은 주석의 내용을 그대로 사용합니다.
3. 주석에 적힌 문제와 함수를 보고, 대응하는 테스트 코드를 생성해야 합니다.
