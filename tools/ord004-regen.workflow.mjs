export const meta = {
  name: 'ord004-regen-category',
  description: 'ORD-004: 한 카테고리의 가이드를 신규 ORD-003 캔버스로 재집필→품질게이트(사실성 카테고리는 외부검토)',
  phases: [
    { title: 'Write', detail: 'sonnet writer가 신규 캔버스로 재집필+자기검증' },
    { title: 'Gate', detail: 'sonnet gate가 QUALITY_CHECKLIST 채점' },
  ],
}

// args: { category, factSensitive, guides: [{name, path, dir, kind, problem, ts, oldHasSim, oldHasMermaid}] }
// 이 하네스에서 args 가 문자열로 도착할 수 있어 방어적으로 파싱한다.
const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const guides = A.guides
if (!Array.isArray(guides)) throw new Error('args.guides 배열이 필요합니다. 받은 args 타입=' + typeof args)
const fact = Boolean(A.factSensitive)
log(`ORD-004 재생성: ${A.category} — ${guides.length}종${fact ? ' [사실성→외부검토]' : ''}`)

const CANVAS = {
  algo: '.claude/skills/guide-for-problem/algorithm-guide-canvas.md',
  ds: '.claude/skills/guide-for-problem/data-structure-guide-canvas.md',
}
const EXEMPLAR = {
  algo: 'src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.mdx',
  ds: 'src/data-structures/tree/bPlusTree/bPlusTree-guide.mdx',
}

function writePrompt(g) {
  const canvas = CANVAS[g.kind]
  const exemplar = EXEMPLAR[g.kind]
  const newFile = `${g.dir}/${g.name}-guide.new.mdx`
  const scratch = `${g.dir}/_scratch/${g.name}.ts`
  const kindLine = g.kind === 'algo'
    ? `알고리즘 캔버스(10단계): 한눈에보는컨셉 → 출발점(함수 시그니처+계약+제약+naive 코드+비용 ascii) → 아이디어 자세히(수식·그림 / 조건부 3.2 이론 / 조건부 3.3 자료구조 링크 / 왜 모순없이: 귀납·헷갈리는 포인트·엣지) → 아이디어를 코드로 → 더 빠르게 만들 단서 → 단서를 최적화로 → 최적화 코드(+종료 선언 또는 5~7 반복) → 실행 시각화 → 흐름 한눈에 보기(mermaid) → 스스로 점검하기. 자연스러운 최적화 사다리(B6)가 없으면 5~8을 생략하고 사유를 반환에 적는다.`
    : `자료구조 캔버스(5단계): 한눈에보는컨셉 → 언제·왜 쓰는가(### 이런 단서가 보이면: 신호+naive대비 비용표+유사 자료구조 선택기준 / ### 문제 사례와 적용 예시 2~4개) → 자료구조 자세히(### 전체 스펙: 속성·불변식 LaTeX+ascii+연산표 / ### 왜 모순없이: 불변식 보존 귀납·헷갈리는 포인트·엣지) → 아이디어를 코드로 → 실행 시각화 → 스스로 점검하기. **mermaid 단계 없음** — 구 가이드에 mermaid가 있어도 넣지 마라.`
  const mermaidLine = g.kind === 'algo'
    ? `- \`## 흐름 한눈에 보기\`: 구 가이드의 mermaid를 \`bun run tools/ord004-extract-assets.ts ${g.path} --emit mermaid\`로 추출해 그대로 주입. \`bun run tools/guide-preview/check-mermaid.ts <새파일>\`로 파서 검증 통과 필수(구 블록에 구문오류 있을 수 있음 — 있으면 라벨을 큰따옴표로 감싸 고친다).`
    : `- mermaid 없음(자료구조 캔버스). check-mermaid 불필요.`
  return `너는 ORD-003 가이드 집필자다. **${g.name}** 가이드를 신규 캔버스로 **처음부터 재집필**한다(구 가이드는 구 템플릿이라 폐기 예정 — 내용·sim/mermaid 참고용). 결과는 임시 파일에 쓴다.

## 필독 (Read)
- 구 가이드(내용·sim/mermaid 원천): ${g.path}
- 문제 맥락: ${g.problem || '(problem.md 없음 — 구 가이드 주석/본문에서 문제 파악)'}${g.ts ? `, ${g.ts}(시그니처 참고, 정확성 기준 아님)` : ''}
- 캔버스(골격·직무주석=집필규격): ${canvas}
- 체크리스트(전 항목 충족 목표): .claude/skills/guide-for-problem/assets/QUALITY_CHECKLIST.md
- 톤(강제): .claude/skills/guide-for-problem/assets/TONE_REFERENCE.md
- 모범 예시: ${exemplar}

## 골격
${kindLine}
- ## 헤딩 문구·순서 고정. 조건부 절은 해당없으면 문서에서 절 자체를 생략(문서 안 "해당없음" 메타 금지), 생략 사유는 반환의 omitted에.
- 톤 강제: 존댓말 설명체, 핵심 개념 직후 \`\`\`text ascii art, 상태변화 Before/After, "여기서 헷갈리기 쉬운 포인트는 ~입니다" 명시 호출, 확인 질문, 기억법. 한국어 본문+기술용어 원어.
- 코드 진화 사다리(있으면): 원형→개선→최종 각각 TS 코드. 함정은 구체 오답 수치(D6).

## sim/mermaid 무손실 재사용
- \`## 실행 시각화\`: 구 가이드 sim을 \`bun run tools/ord004-extract-assets.ts ${g.path} --emit sim\`로 추출해 그대로 주입. 도입 문단에 고정 입력·실제 반환값·패널 읽는 법 + "> 대화형 시뮬레이션은 MDX 런타임에서 표시됩니다." 한 줄. steps 프레임이 본문 서사·실측과 1:1 일치해야 함(불일치 시 서사를 steps에 맞춤). 구 sim이 없으면 simulation-scaffold 규격으로 새로 작성하되 실측 검증.
${mermaidLine}
- 맨 위 \`import { AlgorithmSimulation } from "#guide-sim";\` 한 줄. 프론트매터 금지(전환 단계에서 부여).

## E3 자기검증 (필수)
본문 코드를 ${scratch}로 추출해 \`bun ${scratch}\` 실행. 본문의 모든 수치·트레이스·시뮬 프레임이 실측과 일치, 대표+엣지+무작위 교차검증. 불일치면 본문/steps를 실측에 맞춘다. sibling ${g.ts || '.ts'}는 학습자 실습 공간이라 채점 대상 아님 — 가이드 자체 코드로 검증.

## 산출 & 검증
- ${newFile}에 Write.
- 반드시 실행: \`bun run tools/guide-preview/compile-check.ts ${newFile}\` (G1)${g.kind === 'algo' ? `, \`bun run tools/guide-preview/check-mermaid.ts ${newFile}\` (G4)` : ''}.
- 둘 다 통과해야 한다. 실패하면 고쳐서 통과시켜라.

## 반환(StructuredOutput)
ok=집필+G1+${g.kind === 'algo' ? 'G4+' : ''}자기검증 모두 성공 여부, g1/g4 결과, scratchOk, newFile 경로, omitted(생략한 조건부 절+사유; 없으면 "없음"), note(한 줄 요약).`
}

function gatePrompt(g, w) {
  const canvas = CANVAS[g.kind]
  return `너는 ORD-003 품질 게이트 채점관이다. 아래 신규 가이드를 채점만 한다(수정 금지).

대상: ${w.newFile}
Read: 대상 / ${canvas} / .claude/skills/guide-for-problem/assets/QUALITY_CHECKLIST.md / .claude/skills/guide-for-problem/assets/TONE_REFERENCE.md

참고: G1=${w.g1}, G4=${w.g4} (이미 실행 확인됨). E3는 본문 코드 추출 _scratch/${g.name}.ts 자기검증됨(scratchOk=${w.scratchOk}) — 가이드 자체 코드 실행 일치를 근거로 본다(sibling .ts 스텁은 대상 아님). ${g.kind === 'ds' ? '자료구조 캔버스는 5단계·mermaid 없음(정당 생략), B6/C4는 알고리즘 전용이라 해당없음.' : '알고리즘 캔버스 10단계. 최적화 사다리 없으면 5~8 생략이 정당한지 확인.'}

QUALITY_CHECKLIST 전 항목(A~F, G1/G4 제외) 충족/미흡/해당없음 + 본문 인용으로 평가. PASS = MUST 전부 충족 + SHOULD 미흡 ≤2 + IF-APPLICABLE 충족 또는 정당한 생략.

StructuredOutput으로: verdict(PASS/FAIL), mustPass, mustTotal, shouldMiss, topGaps(FAIL이면 "[코드] 위치→조치" 3개, PASS면 "없음"), oneLine.`
}

const WRITE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ok', 'g1', 'g4', 'scratchOk', 'newFile', 'omitted', 'note'],
  properties: {
    ok: { type: 'boolean' },
    g1: { type: 'string', enum: ['pass', 'fail'] },
    g4: { type: 'string', enum: ['pass', 'n/a', 'fail'] },
    scratchOk: { type: 'boolean' },
    newFile: { type: 'string' },
    omitted: { type: 'string' },
    note: { type: 'string' },
  },
}
const GATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'mustPass', 'mustTotal', 'shouldMiss', 'topGaps', 'oneLine'],
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
    mustPass: { type: 'number' },
    mustTotal: { type: 'number' },
    shouldMiss: { type: 'number' },
    topGaps: { type: 'string' },
    oneLine: { type: 'string' },
  },
}

const results = await pipeline(
  guides,
  (g) => agent(writePrompt(g), { label: `write:${g.name}`, phase: 'Write', model: 'sonnet', agentType: 'general-purpose', schema: WRITE_SCHEMA }),
  (w, g) => {
    if (!w || !w.ok) return { name: g.name, kind: g.kind, write: w, gate: null, status: 'write-failed' }
    return agent(gatePrompt(g, w), { label: `gate:${g.name}`, phase: 'Gate', model: 'sonnet', agentType: 'general-purpose', schema: GATE_SCHEMA })
      .then((v) => ({ name: g.name, kind: g.kind, newFile: w.newFile, g1: w.g1, g4: w.g4, omitted: w.omitted, write: { note: w.note }, gate: v, status: v && v.verdict === 'PASS' ? 'pass' : 'gate-fail' }))
  },
)

const pass = results.filter((r) => r && r.status === 'pass')
const fail = results.filter((r) => !r || r.status !== 'pass')
log(`완료: PASS ${pass.length}/${guides.length}${fail.length ? ` · 미통과 ${fail.map((r) => r?.name || '?').join(', ')}` : ''}`)
return { category: A.category, pass, fail, results }
