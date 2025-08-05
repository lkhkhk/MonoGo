# Monogo 프로젝트 개발 계획 (PLAN.MD)

이 문서는 Monogo 프로젝트의 개발 계획 및 진행 상황을 기록합니다.

## TODO 목록

### 완료된 작업

*   **2025-08-06: 초기 서비스 기동 문제 해결 및 문서화**
    *   **문제:** `monogo-backend` 서비스의 `dotenv` 모듈 누락으로 인한 기동 실패.
    *   **해결:** `backend/package.json`에 `dotenv` 종속성 추가 및 서비스 재빌드.
    *   **문제:** Nginx `rewrite or internal redirection cycle` 500 에러.
    *   **해결:** `nginx/nginx.conf`의 `location /` 블록에서 `try_files` 제거.
    *   **문제:** "저장된 게임 목록 불러오기 실패: Request failed with status code 404" 메시지 박스.
    *   **해결:** `frontend/.env.development`의 `REACT_APP_API_BASE`를 `/api`로 변경 및 `nginx/nginx.conf`의 `location /api` `proxy_pass`에 슬래시(`/`) 추가.
    *   **문서화:**
        *   `docs/6.Troubleshooting.md`에 위 문제 해결 과정 상세 기록.
        *   `README.md`에 `docs/6.Troubleshooting.md` 링크 추가 및 프로젝트 개요 업데이트.
        *   `design.md`를 `docs/Developer_Tutorial.md`로 이동하고, 새로운 `design.md`에 프로젝트 아키텍처 및 디자인 개요 작성.

### 진행 중인 작업

*   없음

### 향후 계획

*   없음
