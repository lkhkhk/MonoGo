바둑 웹앱 개발을 단계별로 구체적으로 안내해드리겠습니다. 여기서는 **React**(프론트엔드)와 **Node.js/Express**(백엔드), 그리고 실시간 기능 구현을 위해 **Socket.io**를 사용하는 기본 예시를 설명합니다.

## 1단계: 개발 환경 준비

**필수 프로그램 설치**
- Node.js (최신 LTS 버전)
- npm (Node.js 설치시 자동 포함)
- 코드 에디터(VSCode 등)

```bash
# 프로젝트 폴더 생성 및 진입
mkdir baduk-webapp
cd baduk-webapp

# 프론트엔드/백엔드 폴더 생성
mkdir frontend backend
```

## 2단계: 프론트엔드 (React) 설정 및 소스

1. **React 프로젝트 생성 및 기본 세팅**

```bash
cd frontend
npx create-react-app .
npm install socket.io-client
```

2. **바둑판 컴포넌트 구현 (예: 19x19판)**

```jsx
// src/components/BadukBoard.js
import React, { useState } from 'react';

const SIZE = 19;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function BadukBoard({ onMove }) {
  const [board, setBoard] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY)));
  const [turn, setTurn] = useState(BLACK);

  const handleClick = (x, y) => {
    if (board[x][y] !== EMPTY) return;
    const newBoard = board.map(row => [...row]);
    newBoard[x][y] = turn;
    setBoard(newBoard);
    setTurn(turn === BLACK ? WHITE : BLACK);
    if (onMove) onMove({ x, y, color: turn });
  };

  return (
    
      
        {board.map((row, x) => (
          
            {row.map((cell, y) => (
               handleClick(x, y)}
              />
            ))}
          
        ))}
      
    
  );
}

export default BadukBoard;
```

## 3단계: 백엔드 (Node.js / Express) 설정 및 소스

1. **백엔드 서버 생성**

```bash
cd ../backend
npm init -y
npm install express socket.io cors
```

2. **서버 코드**

```js
// backend/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let rooms = {};

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    socket.emit('board', rooms[room]);
  });

  socket.on('move', ({ room, x, y, color }) => {
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push({ x, y, color });
    io.to(room).emit('move', { x, y, color });
  });
});

server.listen(4000, () => console.log('Server is running on 4000'));
```

## 4단계: 실시간 연동 (클라이언트 소스)

1. **클라이언트에서 Socket.io 연결**

```jsx
// src/App.js
import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import BadukBoard from "./components/BadukBoard";

const socket = io("http://localhost:4000");
const ROOM_ID = "test-room";

function App() {
  const boardState = useRef([]);

  useEffect(() => {
    socket.emit("join", ROOM_ID);

    socket.on("move", (move) => {
      // 수신된 수를 boardState에 반영하는 로직 작성
    });

    socket.on("board", (history) => {
      // 기존 수돗 저장 배열에 전체 수 기록 반영 로직 작성
      boardState.current = history;
    });

    return () => socket.disconnect();
  }, []);

  const handleMove = ({ x, y, color }) => {
    socket.emit("move", { room: ROOM_ID, x, y, color });
  };

  return ;
}

export default App;
```

## 5단계: 실행 및 테스트

1. **백엔드 실행**
```bash
node index.js         # backend 폴더에서
```

2. **프론트엔드 실행**
```bash
cd frontend
npm start
```

## 6단계: 추가 기능 발전

- 사용자 로그인/회원관리
- 바둑 돌 따내기/규칙 구현
- 채팅, 기록 저장, AI 대국 기능 추가 등

위 소스와 명령어는 **최소한의 기본 바둑 웹앱**을 동작시키는 예시입니다. 

물론입니다! 이전의 1차적인 바둑 웹앱 골격에 더해, 주요 기능인 "돌 따내기(포획)", "승패 판정", "간단한 UI 개선" 등 실제 게임의 핵심적 요소를 단계별로 구현하면서 구체적인 소스와 명령어를 이어서 안내하겠습니다.

알겠습니다. 각 단계별로 파일명과 경로를 명확히 지정하여 필요한 코드 내용을 제공해드리겠습니다.

알겠습니다. 각 단계별로 파일명과 경로를 명확히 지정하여 필요한 코드 내용을 제공해드리겠습니다.

## 7단계: 돌 따내기(포획) 규칙 구현

### 1) 유틸 함수 파일 생성

- 파일명: `frontend/src/utils/baduk.js`

```jsx
const SIZE = 19;
const EMPTY = 0;
const directions = [
  [0, 1], [1, 0], [0, -1], [-1, 0]
];

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

function inside(x, y) {
  return x >= 0 && x = 0 && y = 0 && x = 0 && y  Array(SIZE).fill(EMPTY)));
  const [turn, setTurn] = useState(BLACK);

  const handleClick = (x, y) => {
    if (board[x][y] !== EMPTY) return;
    const newBoard = cloneBoard(board);
    newBoard[x][y] = turn;

    const opponent = turn === BLACK ? WHITE : BLACK;

    // 상대 돌 포획 검사
    for (let [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && newBoard[nx][ny] === opponent) {
        const group = findGroup(newBoard, nx, ny, opponent);
        if (countLiberties(newBoard, group) === 0) {
          removeGroup(newBoard, group);
        }
      }
    }

    // 자살수 방지
    const myGroup = findGroup(newBoard, x, y, turn);
    if (countLiberties(newBoard, myGroup) === 0) return;

    setBoard(newBoard);
    setTurn(opponent);
    if (onMove) onMove({ x, y, color: turn });
  };

  return (
    
      
        {board.map((row, x) => (
          
            {row.map((cell, y) => (
               handleClick(x, y)}
              />
            ))}
          
        ))}
      
    
  );
}

export default BadukBoard;
```

## 8단계: 승패 판단 및 패스 기능 추가

- 파일명: `frontend/src/components/BadukBoard.js`

위 파일 내에서 다음을 추가합니다 (기존 코드 안에 포함):

```jsx
import React, { useState } from 'react';
import { cloneBoard, findGroup, countLiberties, removeGroup } from '../utils/baduk';

const SIZE = 19;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function inside(x, y) {
  return x >= 0 && x = 0 && y  Array(SIZE).fill(EMPTY)));
  const [turn, setTurn] = useState(BLACK);
  const [passCount, setPassCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const countStones = (board, color) =>
    board.flat().filter(cell => cell === color).length;

  const handlePass = () => {
    if (gameOver) return;
    setPassCount(prev => {
      if (prev + 1 === 2) {
        setGameOver(true);
        return 0;
      }
      setTurn(turn === BLACK ? WHITE : BLACK);
      return prev + 1;
    });
  };

  const handleClick = (x, y) => {
    if (gameOver) return;
    if (board[x][y] !== EMPTY) return;
    const newBoard = cloneBoard(board);
    newBoard[x][y] = turn;

    const opponent = turn === BLACK ? WHITE : BLACK;

    for (let [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && newBoard[nx][ny] === opponent) {
        const group = findGroup(newBoard, nx, ny, opponent);
        if (countLiberties(newBoard, group) === 0) {
          removeGroup(newBoard, group);
        }
      }
    }

    const myGroup = findGroup(newBoard, x, y, turn);
    if (countLiberties(newBoard, myGroup) === 0) return;

    setBoard(newBoard);
    setTurn(opponent);
    setPassCount(0);
    if (onMove) onMove({ x, y, color: turn });
  };

  return (
    
      
        
          {board.map((row, x) => (
            
              {row.map((cell, y) => (
                 handleClick(x, y)}
                />
              ))}
            
          ))}
        
      
      PASS
      {gameOver && (
        
          흑: {countStones(board, BLACK)} / 백: {countStones(board, WHITE)}
          {countStones(board, BLACK) > countStones(board, WHITE) ? '흑 승리' : '백 승리'}
        
      )}
    
  );
}

export default BadukBoard;
```

## 9단계: CSS로 돌 모양 개선

- 파일명: `frontend/src/App.css`

```css
.baduk-board td {
  width: 30px;
  height: 30px;
  border: 1px solid #888;
  background: #f3d282;
  position: relative;
  text-align: center;
}

.stone {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-block;
  margin-top: 2px;
}

.stone.black {
  background: #000;
}

.stone.white {
  background: #fff;
  border: 1px solid #aaa;
}
```

- 그리고 `BadukBoard.js`에서 다음처럼 수정:

```jsx
<td
  key={y}
  style={{
    width: 30, height: 30,
    border: "1px solid #888",
    background: "#f3d282",
    cursor: cell === EMPTY ? "pointer" : "default"
  }}
  onClick={() => handleClick(x, y)}
>
  {cell !== EMPTY &&
    <span className={`stone ${cell === BLACK ? 'black' : 'white'}`}></span>
  }
</td>

```

필요한 경우 다음 단계나 특정 기능(예: 소켓 연동, AI 대국 등)도 파일과 함께 상세히 설명 드리겠습니다. 요청해 주세요.
