# Monogo 프로젝트 디자인 문서

이 문서는 Monogo 바둑 웹 애플리케이션의 전반적인 아키텍처, 주요 컴포넌트, 사용된 기술 스택 및 디자인 원칙을 설명합니다.

## 1. 아키텍처 개요

Monogo는 클라이언트-서버 아키텍처를 기반으로 하는 웹 애플리케이션입니다. Docker를 사용하여 각 서비스가 독립적인 컨테이너로 실행되며, Nginx를 통해 요청을 라우팅합니다.

```mermaid
graph TD
    A[사용자 웹 브라우저] --> B[Nginx (monogo-nginx)];
    B -- 정적 파일 및 API 프록시 --> C[React Frontend (monogo-frontend)];
    B -- API 프록시 (/api/*) --> D[Node.js Backend (monogo-backend)];
    D -- 게임 데이터 저장/로드 --> E[로컬 파일 시스템 (saved_games/)];
```

## 2. 주요 컴포넌트

*   **프론트엔드 (monogo-frontend):**
    *   **기술 스택:** React.js
    *   **역할:** 사용자 인터페이스(UI)를 제공하고, 바둑판 렌더링, 사용자 입력 처리, 백엔드 API 호출 등을 담당합니다.
    *   **주요 파일:** `frontend/src/App.js`, `frontend/src/components/BadukBoard.js`, `frontend/src/utils/baduk.js`

*   **백엔드 (monogo-backend):**
    *   **기술 스택:** Node.js, Express.js
    *   **역할:** 게임 데이터(바둑판 상태, 수순 등)의 저장, 로드, 목록 조회, 삭제, 이름 변경 등 CRUD 작업을 처리하는 RESTful API를 제공합니다. 게임 로직(돌 따내기, 승패 판단 등)은 현재 프론트엔드에서 처리하고 있습니다.
    *   **주요 파일:** `backend/app.js`

*   **Nginx (monogo-nginx):**
    *   **기술 스택:** Nginx
    *   **역할:** 리버스 프록시 서버로 작동하여 사용자 요청을 적절한 프론트엔드 또는 백엔드 서비스로 라우팅합니다. 정적 파일 서빙 및 API 요청 프록시를 담당합니다.
    *   **주요 파일:** `nginx/nginx.conf`

## 3. 데이터 흐름

1.  **사용자 요청:** 웹 브라우저에서 `http://localhost`로 접속하면 Nginx가 `monogo-frontend` 컨테이너의 React 애플리케이션을 서빙합니다.
2.  **API 호출:** React 애플리케이션에서 게임 저장, 불러오기 등의 기능이 사용되면 `/api` 경로를 통해 백엔드 API를 호출합니다.
3.  **Nginx 프록시:** Nginx는 `/api`로 시작하는 요청을 `monogo-backend` 컨테이너로 프록시합니다. 이때 Nginx 설정에 따라 `/api` 접두사가 제거되어 백엔드가 올바른 경로를 받도록 합니다.
4.  **백엔드 처리:** `monogo-backend`는 요청을 처리하고, 필요한 경우 `saved_games/` 디렉토리에 게임 데이터를 JSON 파일 형태로 저장하거나 로드합니다.
5.  **응답:** 백엔드의 처리 결과는 Nginx를 통해 다시 프론트엔드로 전달되고, 프론트엔드는 이를 사용자 인터페이스에 반영합니다.

## 4. 디자인 원칙

*   **모듈화:** 프론트엔드, 백엔드, 프록시 서버를 독립적인 Docker 컨테이너로 분리하여 개발 및 배포의 유연성을 확보합니다.
*   **단순성:** 핵심 기능에 집중하고, 복잡성을 최소화하여 유지보수 및 확장을 용이하게 합니다.
*   **확장성:** 향후 실시간 대국, AI 대국, 사용자 인증 등 추가 기능 확장을 고려한 아키텍처를 지향합니다.
*   **환경 분리:** `.env.development`, `.env.production` 파일을 통해 개발 및 운영 환경 설정을 분리하여 관리합니다.