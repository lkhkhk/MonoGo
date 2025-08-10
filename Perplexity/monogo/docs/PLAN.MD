# 바둑 연습 프로그램 개발 계획

이 문서는 바둑 연습 프로그램의 개발 계획 및 진행 상황을 기록합니다.

## 1. 개발 목표

기존의 다양한 소스 코드(`BadukBoard.js`, `claude_baduk.html` 등)를 통합하고 발전시켜, 완성도 높은 웹 기반 바둑 연습 프로그램을 개발합니다. 이 프로그램은 기본적인 바둑 규칙을 준수하며, 기보 저장/로드, 복기 등 고급 기능을 포함하는 것을 목표로 합니다.

## 2. 개발 로드맵

### Phase 1: 프론트엔드 기반 구축 및 핵심 로직 구현

*   [x] **Task 1.1: 프로젝트 초기 설정 및 정리**
    *   **Action:** `create-react-app`으로 생성된 기본 파일(로고, 불필요한 CSS 등)을 정리하여 프로젝트 구조를 단순화합니다.
    *   **Verification:** `frontend/src` 디렉토리의 파일 목록을 확인하여 `App.js`, `index.js`, `index.css` 등 필수 파일만 남았는지 확인합니다.

*   [x] **Task 1.2: 핵심 컴포넌트 구조화**
    *   **Action:** UI를 `App.js`(전체 레이아웃), `components/BadukBoard.js`(바둑판), `components/Controls.js`(조작 버튼)로 분리하여 컴포넌트 기반 구조를 설정합니다.
    *   **Verification:** 각 컴포넌트가 생성되고, `App.js`에서 이를 조합하여 기본 화면에 렌더링되는지 확인합니다.

*   [x] **Task 1.3: 바둑 규칙 로직 구현 및 분리**
    *   **Action:** `Developer_Tutorial.md`의 코드를 참고하여, 돌 포획, 활로 계산, 자살수 방지 등 핵심 바둑 규칙 로직을 `utils/baduk.js` 파일로 분리하여 작성합니다.
    *   **Verification:** `utils/baduk.js` 파일이 생성되고, 내부에 `findGroup`, `countLiberties`, `removeGroup` 등의 함수가 정의되었는지 확인합니다.

*   [x] **Task 1.4: 바둑판-규칙 연동 및 착수 기능 완성**
    *   **Action:** `BadukBoard.js`에서 `utils/baduk.js`의 함수들을 가져와 사용합니다. 사용자가 바둑판을 클릭했을 때, 규칙에 따라 돌을 포획하거나 자살수를 방지하는 로직을 `handleClick` 이벤트에 연동합니다.
    *   **Verification:** 바둑판에 돌을 놓았을 때 상대방 돌이 정상적으로 포획되는지, 자살수에 해당하는 위치에는 돌을 놓을 수 없는지 시각적으로 확인합니다.

*   [x] **Task 1.5: 기본 제어 기능 구현**
    *   **Action:** `Controls.js` 컴포넌트에 '무르기(Undo)', '패스(Pass)', '새 게임(New Game)' 버튼을 추가하고, 각 버튼에 해당하는 상태 관리 로직을 `App.js` 또는 `BadukBoard.js`에 구현합니다。
    *   **Verification:** 각 버튼을 클릭했을 때, 게임 상태(이전 수, 차례 넘김, 초기화)가 정상적으로 변경되는지 확인합니다.

### Phase 2: 백엔드 API 및 기보 관리 기능 구현

*   [x] **Task 2.1: 백엔드 서버 구축 및 API 구현**
    *   **Action:** `4_Developer_Guide.md`의 API 명세에 따라 Node.js/Express로 기보 저장/목록/불러오기/삭제/이름 변경 API를 구현합니다。
    *   **Verification:** Postman 또는 유사한 도구를 사용하여 각 API 엔드포인트가 명세대로 동작하는지 테스트합니다.

*   [x] **Task 2.2: 프론트엔드-백엔드 연동**
    *   **Action:** `axios`를 사용하여 프론트엔드에 '저장', '불러오기' 등 버튼을 만들고, 백엔드 API와 연동하여 기보 관리 기능을 완성합니다。
    *   **Verification:** 웹 UI에서 게임을 저장하면 목록에 표시되고, 불러오기를 통해 해당 게임 상태가 복원되는지 확인합니다.

### Phase 3: 복기 기능 및 UI/UX 고도화

*   [Current] **Task 3.1: 복기 기능 구현**
    *   **Action:** 불러온 게임의 수순(moveList)을 기반으로, 처음부터 한 수씩 자동으로 돌을 놓는 복기 기능을 구현합니다。
    *   **Verification:** '복기 시작' 버튼을 누르면 저장된 기보가 바둑판에 순서대로 재생되는지 확인합니다.

*   [ ] **Task 3.2: 복기 제어 UI 추가**
    *   **Action:** 복기 과정을 제어할 '일시정지/재개', '속도 조절', '한수/열수씩 보기' 등 제어 UI를 추가합니다。
    *   **Verification:** 각 제어 버튼이 복기 기능에 정상적으로 연동되어 동작하는지 확인합니다.

### Phase 4: 테스트 및 배포

*   [ ] **Task 4.1: 단위/통합 테스트 작성**
    *   **Action:** Jest와 React Testing Library를 사용하여 핵심 규칙 로직, 컴포넌트, API 연동 기능에 대한 테스트 코드를 작성합니다。
    *   **Verification:** `npm test` 스크립트를 실행하여 모든 테스트가 통과하는지 확인합니다.

*   [ ] **Task 4.2: 최종 배포 환경 점검**
    *   **Action:** `docker-compose.yml`과 `nginx.conf` 설정을 최종 검토하고, `6.Troubleshooting.md`에 기록된 문제들이 해결된 상태인지 확인합니다。
    *   **Verification:** `docker-compose up --build -d` 명령으로 모든 서비스가 에러 없이 기동하고, 웹 브라우저에서 정상적으로 접속되는지 확인합니다.

---

## TODO 목록

*   **[DONE]** `PLAN.MD`: 개발 계획 구체화
*   **[DONE]** `Task 1.1`: 프로젝트 초기 설정 및 정리
*   **[DONE]** `Task 1.2`: 핵심 컴포넌트 구조화
*   **[DONE]** `Task 1.3`: 바둑 규칙 로직 구현 및 분리
*   **[DONE]** `Task 1.4`: 바둑판-규칙 연동 및 착수 기능 완성
*   **[DONE]** `Task 1.5`: 기본 제어 기능 구현
*   **[DONE]** `Task 2.1`: 백엔드 서버 구축 및 API 구현
*   **[DONE]** `Task 2.2`: 프론트엔드-백엔드 연동
*   **[Current]** `Task 3.1`: 복기 기능 구현