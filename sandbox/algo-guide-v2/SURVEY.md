# 부류 후보 조사 — B0c (S5)

`bun run tools/survey-views.ts` · 2026-08-19 실측.

> **이 문서는 후보 목록이지 정본이 아니다.** L10(그림 의무) 예외의 정본은 **S8(B3)이 실제로
> 써 보고 낸다.** 여기서는 어디를 먼저 시험할지 고르는 데만 쓴다.

## 왜 정본이 아닌가

입력이 **구 명세로 쓰인 111편**이다. 그 명세는 시각화를 `실행 시각화` 절 하나에만 요구했고,
`keyValue` 는 `src/_guide-sim/index.tsx:106` 이 *"범용 상태 패널(변수 스냅샷)"* 로 정의한
**폴백 뷰**다.

그러니 "`keyValue` 단독" 이 말하는 것은 *그림이 불가능하다* 가 아니라
**"앞 집필자가 이 편에 뷰를 안 만들었다"** 이다. 그것을 새 규격의 면제 근거로 쓰면 구
산출물의 결손을 새 규격에 상속시키는 것이고, 이 카드가 세운 독립 원칙과 정면으로 걸린다.

## 뷰 조합 분포 (111편)

| 편 수 | 조합 |
| --- | --- |
| 24 | `array` + `keyValue` |
| **22** | **`keyValue` 단독** |
| 21 | `graph` + `keyValue` |
| 12 | `matrix` + `keyValue` |
| 12 | `array` |
| 10 | `tree` + `keyValue` |
| 4 | `matrix` |
| 3 | `graph` + `priorityQueue` |
| 2 | `priorityQueue` + `keyValue` |
| 1 | `tree` + `matrix` |

## `keyValue` 단독 22편 — 카테고리별

| 편 수 | 카테고리 | 편 |
| --- | --- | --- |
| 10 / 11 | `number-theory` | babyStepGiantStep · binomialModP · crt · extendedEuclidean · fastPower · fftMultiply · gcd · isPrimeTrial · millerRabin · pollardRho |
| 6 / 7 | `geometry` | bentleyOttmann · closestPairOfPoints · pointInPolygon · polygonArea · rotatingCalipersDiameter · segmentsIntersect |
| 4 / 4 | `bit-manipulation` | enumerateSubmasks · lowestSetBit · matrixPowerFibonacci · singleNumberXor |
| 2 / 7 | `advanced` | meetInTheMiddleSubsetSum · minMaxPair |

**"기하 전부 + 수론 전부" 가 아니다.** `convexHull`(기하)과 `sieveOfEratosthenes`(수론)는
`view="array"` 를 쓴다. `bit-manipulation` 은 4/4 로 전부이고, `advanced` 2편도 후보에 든다.

**중단 조건 2 의 현재 값**: 후보 부류 = **4카테고리**. 임계는 5이므로 아직 안 걸린다.
("부류" 는 카테고리 디렉터리로 정의한다 — `SPEC.md` §4.)

## S8 대표 선정 — 규칙을 고쳤다

플랜의 규칙은 *"후보 카테고리 중 편 수가 가장 많은 것에서, `_scratch`/`_deprecated` 가 없고
테스트가 도는 편 중 알파벳 순 첫째"* 였다.

**가운데 조건이 아무것도 못 고른다.** 실측: `number-theory` 후보 10편이 **전부** `_deprecated/`
를 갖고 있다. 이 저장소에서 `_deprecated/` 는 이력 보존 관례라 사실상 모든 구조에 있다 —
"깨끗한 편을 고른다" 는 의도였겠지만 그 뜻으로는 판별식이 되지 않는다.

**고친 규칙**: 후보 카테고리 중 편 수가 가장 많은 것에서, **테스트 파일이 있는 편 중
알파벳 순 첫째.**

- 최대 카테고리: `number-theory` (10편)
- 10편 전부 `<name>.test.ts` 보유(실측)
- 알파벳 순 첫째 → **`babyStepGiantStep`**

**알파벳 순을 쓰는 이유는 임의성이다.** "쉬운 편" 을 고르면 계산 블록 대체안이 성립하는 것이
당연해지고, 시험의 판정력이 사라진다. 4판이 `deep.trap`·`perf.worst` 두 절을 고른 것이
그 실패였다 — 둘 다 정의상 반례와 수치를 요구해서 대체가 거의 자명하다.

## S8 이 실제로 볼 것

`babyStepGiantStep` 의 **세 절**을 새 명세로 쓴다. 전편이 아니다.

| 절 | 왜 이것이 시험대인가 |
| --- | --- |
| `concept` | *"이 절만 읽고도 전체가 잡혀야 한다"* 를 그림 없이 세우는 것이 최대 난관이다 |
| `trace` | 그림/시뮬이 없는 부류에서 **시뮬 프레임 수가 무엇인지** 정의가 없다(P3 이 그것을 잰다) |
| `perf.derive` | P5 결속이 `trace` 판정에 연동된다 |

**예외가 열리면 함께 정할 것 셋** — L11(3자 대조)·P6·L19(웹 동등성)는 마커도 `.sim.ts` 도
ascii 펜스도 없는 편에서 무엇을 뜻하는지가 미정의다. 4판은 예외를 L10 에만 선언하고 파급
셋을 열어 뒀는데, 그러면 예외 부류가 **아무 판정도 안 받는 상태**가 된다.

---

# S8 판정 — L10 예외를 **열지 않는다**

`babyStepGiantStep` 의 `concept`·`trace`·`perf.derive` 세 절을 새 명세로 실제로 썼다
(`pilot/babyStepGiantStep/babyStepGiantStep-guide.partial.md`).

| 절 | 산문 연속 | 그림 |
| --- | --- | --- |
| `concept` | 2 ≤ 2 | **있음** — 아기 걸음 표 ↔ 큰 걸음이 만나는 도식 |
| `trace` | 2 ≤ 2 | **있음** — T1~T6 전개 + 상태 표 |
| `perf.derive` | 2 ≤ 2 | **있음** — 곱셈 횟수 계산 블록 |

**"그림이 성립하지 않는 부류" 라는 가설은 이 표본에서 거짓이다.** 세 절 다 그림이 억지가
아니라 오히려 설명의 중심이었다 — 아기 걸음 표는 그 자체가 알고리즘의 자료구조이고,
큰 걸음이 그 표를 두드리는 그림이 "왜 √m 인가" 를 한 장으로 말한다.

## 그러면 `keyValue` 단독 22편은 무엇이었나

**폴백 뷰를 쓴 흔적이지 그림이 불가능하다는 증거가 아니었다.** `SURVEY.md` 앞부분이 이미
그 가능성을 적어 뒀고, 실물로 확인됐다. 현행 `babyStepGiantStep-guide.mdx:400` 도
`view="keyValue"` 를 쓰는데, 이 부분 원고는 같은 알고리즘을 표와 도식으로 그렸다.

## 따라오는 처분

- **`L10` 의 부류 예외를 열지 않는다.** `SPEC.md` §4 의 "예외는 부류 단위로만" 조항은
  **아직 한 번도 발동하지 않은 상태**로 남는다. 조항 자체는 지운다.
- **`L11`·P6·`L19` 의 "예외 부류에서 무엇을 뜻하는가" 는 정의할 필요가 없어졌다.**
  예외가 없으면 마커·`.sim.ts`·ascii 펜스가 모든 편에 있고, 셋의 정의가 그대로 선다.
- **중단 조건 2**(그림이 성립하지 않는 부류가 5카테고리 초과 → L10·L11 재설계)와
  **중단 조건 4**(계산 블록 대체안이 안 서면 L10 을 MUST 에서 내림)는 **발동하지 않는다.**

## 표본이 하나라는 것

이 판정의 근거는 **한 편**이다. 후보 4카테고리 중 `number-theory` 하나에서 뽑았고,
`geometry`·`bit-manipulation`·`advanced` 는 안 써 봤다.

**그래서 조항을 지우되 판정 절차는 남긴다** — 111편 전개 배치에서 어떤 편이 그림 의무를
못 지키면, 그때 그 편이 **왜 못 지키는지를 이 문서와 같은 형식으로 적고** 부류 예외를
다시 논의한다. 지금 없는 예외를 미리 만들어 두지 않는 것이 요점이다. 예외가 먼저 있으면
집필이 그 문으로 나간다.
