# 4. 개발자 가이드

이 문서는 프로젝트의 기술적인 구조와 개발에 필요한 정보를 제공합니다.

## 4.1. 시스템 아키텍처

본 프로젝트는 다음과 같은 3-Tier 아키텍처로 구성됩니다.

```mermaid
graph TD
    A[User's Browser] --> B{Nginx Reverse Proxy};
    B --> C[Frontend (React)];
    B -- /api --> D[Backend (Node.js/Express)];
    D --> E[Data Store (File System/DB)];

    subgraph "Docker Environment"
        direction LR
        B
        C
        D
    end
```

*   **Nginx:** 리버스 프록시 역할을 수행하며, `/` 요청은 프론트엔드 React 앱으로, `/api`로 시작하는 요청은 백엔드 API 서버로 전달합니다.
*   **Frontend (React):** 사용자 인터페이스와 경험(UI/UX)을 담당하는 SPA(Single Page Application)입니다. 모든 비즈니스 로직과 API 통신을 처리합니다.
*   **Backend (Node.js/Express):** 기보 데이터의 CRUD(생성, 조회, 수정, 삭제)를 담당하는 API 서버입니다.
*   **Data Store:** 백엔드 서버는 기보 데이터를 파일 시스템이나 간단한 데이터베이스에 저장합니다.

## 4.2. 프론트엔드 구조

*   **상태 관리:** React Hooks (`useState`, `useEffect`, `useRef`)를 중심으로 컴포넌트의 상태를 관리합니다.
*   **핵심 컴포넌트:**
    *   `BadukBoard`: 바둑판 UI와 게임 로직의 최상위 컴포넌트
    *   `BoardGrid`: 바둑판의 격자와 선을 렌더링
    *   `Stone`: 바둑돌을 렌더링
    *   `Controls`: 각종 버튼과 정보 패널을 포함하는 제어 영역
    *   `Modals`: 게임 저장/로드 등 특정 작업을 위한 모달 창
*   **API 통신:** `axios` 라이브러리를 사용하여 백엔드 API와 비동기 통신을 수행합니다.

## 4.3. 백엔드 API 명세

API 요청과 응답은 모두 JSON 형식을 사용합니다.

| Method | Endpoint | 설명 | 요청 본문 (Body) | 성공 응답 (200 OK) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/save` | 현재 게임 상태를 서버에 저장합니다. | `{ name, board, turn, moveNum, moveList, ... }` | `{ "message": "게임이 저장되었습니다." }` |
| `GET` | `/api/v1/list` | 저장된 모든 게임의 이름 목록을 조회합니다. | (없음) | `["game1", "game2", ...]` |
| `GET` | `/api/v1/load/:name` | `:name`에 해당하는 게임 데이터를 불러옵니다. | (없음) | `{ name, board, turn, ... }` |
| `DELETE` | `/api/v1/delete/:name` | `:name`에 해당하는 게임을 삭제합니다. | (없음) | `{ "message": "게임이 삭제되었습니다." }` |
| `PUT` | `/api/v1/rename` | 저장된 게임의 이름을 변경합니다. | `{ "oldName": "...", "newName": "..." }` | `{ "message": "이름이 변경되었습니다." }` |

## 4.4. 시작 가이드

프로젝트를 로컬 환경에서 실행하려면, 프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요.

```bash
# Docker 이미지를 빌드하고 컨테이너를 백그라운드에서 실행합니다.
docker-compose up --build -d
```

이후 웹 브라우저에서 `http://localhost:8080`으로 접속하여 애플리케이션을 확인할 수 있습니다.
