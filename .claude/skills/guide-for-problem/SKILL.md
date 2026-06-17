---
name: guide-for-problem
description: src/$ARGUMENTS.ts 주석을 참고하여, 문제를 풀기위한 해설서를 작성한다. 문제 해설을 부탁해. 문제 해설을 작성해줘. 문제 해설이 필요해.
disable-model-invocation: true
argument-hint: <file-name-without-extension>
---

## 설명

src/$ARGUMENTS.ts 주석을 참고하여, 문제를 풀기위한 해설서를 작성한다. 작성 과정에서 solving-problem-canvas.md 구조를 활용한다.

## 핵심 아이디어 구성

1. 원천이 되는 아이디어 및 알고리즘을 먼저 설명한다.
2. 문제를 풀기위한 솔루션으로 유도하는 과정을 생략 없이 제공한다.

- 무언가를 주장할 때는 주장에 대한 이유를 가급적 동반한다.
- 해설서는 **src/$ARGUMENTS-guide.mdx** 라는 이름의 MDX 문서로, src/$ARGUMENTS.ts 가 위치하는 곳에 나란히 생성한다.

## 시뮬레이션 (MDX)

해설서는 알고리즘 전개 과정을 단계별로 조작·재생할 수 있는 React 시뮬레이션을 포함한다.

1. 산문 4개 섹션(성능 목표 예측 / 목표 함수 / 핵심 아이디어 / 수도 코드와 Activity Diagram)은 기존대로 작성한다. MDX에서 markdown·수식($…$)·코드블록은 그대로 유효하다. 단 `{`, `<` 등 JSX와 충돌하는 원문은 코드블록 안에 두거나 이스케이프한다.
2. `## 핵심 아이디어` 뒤 `## 시뮬레이션` 섹션에 시뮬레이션을 넣는다.
   - MDX 상단에 `import { AlgorithmSimulation } from "#guide-sim";` 한 줄만 추가.
   - 적합한 프리셋 `view`를 고르고, 작은 고정 입력에 대한 **실제 실행 단계**를 선언형 `steps` 데이터로 나열한다.
   - **문제별 JSX 컴포넌트/React Hook을 직접 작성하지 않는다.** `#guide-sim` 외 import 금지.
   - 프레임 스키마·프리셋 목록·예시는 `simulation-scaffold.md`를 따른다.
3. **정확성**: `steps`는 머릿속 추정이 아니라 원본 함수의 실제 실행을 따른다. 사용한 고정 입력과 그 입력에 대한 실제 반환값을 본문에 명시하고, 마지막 프레임의 결과 상태가 그 값과 일치하게 한다.
4. 시뮬레이션 호출부 바로 위에 정적 뷰어용 안내 한 줄("대화형 시뮬레이션은 MDX 런타임에서 표시됩니다.")을 둔다.
