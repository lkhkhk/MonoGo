# MonoGo 바둑 연습 웹앱 기획서 – 3단계 (기술 스택 및 구조 설계)
작성일: 2025-08-04

---

## 🏗️ **3단계 – 기술 스택 및 구조 설계**

### 🔹 [3-1] 기술 스택 구성
| 계층               | 스택                                                  | 설명                                |
| ---------------- | --------------------------------------------------- | --------------------------------- |
| **프론트엔드**        | Vue.js 3 (Composition API) 또는 React (Next.js 선택 가능) | 빠른 렌더링, 반응형 UI 구성에 적합             |
| **스타일링**         | Tailwind CSS                                        | 미니멀한 디자인 구현에 유리                   |
| **백엔드**          | Node.js + Express 또는 Firebase Functions             | REST API 또는 무서버(Serverless) 처리 가능 |
| **DB**           | Firebase Firestore / SQLite / Supabase              | 기보, 노트 저장 등 간단한 DB에 적합            |
| **호스팅**          | Vercel / Netlify                                    | 빠른 배포 및 CI/CD 편리                  |
| **기보 포맷 지원**     | SGF (Smart Game Format)                             | 기보 업로드/파싱을 위한 표준 포맷               |
| **AI 수 추천 (선택)** | KataGo 연동 or Rule-based                             | 고급 기능으로 선택 구현 가능                  |

---

### 🔹 [3-2] 시스템 구조 다이어그램 (간단 구조)
```plaintext
[사용자 브라우저]
      |
   [MonoGo 프론트엔드]
      | Vue or React + Tailwind
      |
 [Express API or Firebase Functions]
      |
   [DB: Firestore / SQLite / Supabase]
      |
  [기보 저장, 묘수 노트, 기록 등]

```
AI 수 추천 기능은 다음 방식 중 선택할 수 있습니다:

* 📁 사전 계산된 수 추천 JSON 데이터 활용 (간단/빠름)
* 🤖 KataGo 서버 연동 (고급 기능, 무거움)

---

### 🔹 [3-3] 주요 모듈 구조 (기획 기준)
```css
src/
├─ components/
│  ├─ Board.vue / Board.jsx
│  ├─ MoveControls.vue
│  └─ Notepad.vue
├─ views/
│  ├─ Home.vue
│  ├─ Play.vue
│  ├─ Review.vue
│  └─ Notes.vue
├─ store/         ← 상태관리 (Pinia or Zustand)
├─ utils/         ← SGF 파서, 바둑 로직
└─ api/           ← 서버 통신 모듈
```

---

### 📅 다음 단계

- [ ] 4단계: 개발 계획 및 초기 기능 구현
