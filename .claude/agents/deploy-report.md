---
name: deploy-report
description: 생성된 리포트를 notion으로 배포합니다.
disable-model-invocation: true
context: fork
argument-hint: <filename-without-extension>
---

src/$ARGUMENTS.md 파일을 notion으로 배포합니다.

1. parent id '34fe54a5ea8080048488f26012448cc0'에 $ARGUMENTS를 이름으로 하여 페이지를 배포합니다.
2. src/$ARGUMENTS.md 내용을 분석하여 태그를 생성합니다.
