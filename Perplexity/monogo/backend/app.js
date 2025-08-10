const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SAVE_DIR = process.env.SAVE_PATH || path.join(__dirname, 'saved_games');
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR);
}

function safeFilename(name) {
  return name.replace(/[<>:"\/\\|?*]/g, '_');
}

function getNeighbors(x, y, boardSize = 19) {
  const neighbors = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < boardSize - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < boardSize - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
}

function findGroup(x, y, board, player) {
  const boardSize = board.length;
  const group = [];
  const liberties = new Set();
  const visited = new Set();
  const queue = [{ x, y }];
  visited.add(`${x},${y}`);

  while (queue.length > 0) {
    const stone = queue.shift();
    group.push(stone);

    const neighbors = getNeighbors(stone.x, stone.y, boardSize);
    for (const neighbor of neighbors) {
      const nx = neighbor.x;
      const ny = neighbor.y;
      const key = `${nx},${ny}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (board[ny][nx] === 0) {
        liberties.add(key);
      } else if (board[ny][nx] === player) {
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return { group, liberties: liberties.size };
}

app.get('/', (req, res) => {
  res.send('Baduk backend running');
});

// Play API
app.post('/play', (req, res) => {
  const { history, turn, move } = req.body;
  if (!history || !turn || !move) {
    return res.status(400).json({ error: '유효하지 않은 데이터' });
  }

  const currentBoardWithMoveNumber = history[history.length - 1];
  const currentBoard = currentBoardWithMoveNumber.map(row => row.map(cell => cell[0]));

  const { x, y } = move;
  const boardSize = currentBoard.length;
  const opponent = turn === 1 ? 2 : 1;

  if (x < 0 || x >= boardSize || y < 0 || y >= boardSize || currentBoard[x][y] !== 0) {
    return res.status(400).json({ error: '유효하지 않은 착수' });
  }

  const newBoard = currentBoard.map(row => [...row]);
  newBoard[x][y] = turn;

  let capturedStones = 0;
  const neighbors = getNeighbors(x, y, boardSize);

  for (const neighbor of neighbors) {
    const nx = neighbor.x;
    const ny = neighbor.y;
    if (newBoard[nx][ny] === opponent) {
      const { group, liberties } = findGroup(nx, ny, newBoard, opponent);
      if (liberties === 0) {
        capturedStones += group.length;
        for (const stone of group) {
          newBoard[stone.x][stone.y] = 0;
        }
      }
    }
  }

  const { liberties: selfLiberties } = findGroup(x, y, newBoard, turn);
  if (selfLiberties === 0) {
    return res.status(400).json({ error: '자살수는 허용되지 않습니다' });
  }

  const moveNumber = history.length;
  const newBoardWithMoveNumber = newBoard.map((row, r) => row.map((cell, c) => {
    if (cell !== 0) {
      if (currentBoard[r][c] === 0) {
        return [cell, moveNumber];
      } else {
        return currentBoardWithMoveNumber[r][c];
      }
    }
    return [0, 0];
  }));

  const newHistory = [...history, newBoardWithMoveNumber];
  const newTurn = turn === 1 ? 2 : 1;

  res.json({ history: newHistory, turn: newTurn, capturedStones });
});

// 저장 API
app.post('/save', (req, res) => {
  const { name, history, turn, capturedStones } = req.body;
  if (!name || !history || !turn || !capturedStones) {
    return res.status(400).json({ error: '유효하지 않은 데이터' });
  }
  const safeName = safeFilename(name);
  const filePath = path.join(SAVE_DIR, `${safeName}.json`);
  const data = { name, history, turn, capturedStones };
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) return res.status(500).json({ error: '저장 실패' });
    res.json({ message: '게임이 성공적으로 저장되었습니다' });
  });
});

// 목록 조회 API
app.get('/list', (req, res) => {
  console.log('Received /list request'); // 디버그 로그 추가
  fs.readdir(SAVE_DIR, (err, files) => {
    if (err) {
      console.error('SAVE_DIR 읽기 실패:', err); // 에러 로그 추가
      return res.status(500).json({ error: '저장된 게임 목록 불러오기 실패' });
    }
    const games = files.filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
    console.log('게임 목록 전송:', games); // 성공 로그 추가
    res.json(games);
  });
});

// 게임 불러오기 API
app.get('/load/:name', (req, res) => {
  const safeName = safeFilename(req.params.name);
  const filePath = path.join(SAVE_DIR, `${safeName}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: '저장된 게임 불러오기 실패' });
    try {
      const savedGame = JSON.parse(data);
      // Ensure savedGame contains history, turn, and capturedStones
      if (!savedGame.history || !savedGame.turn || !savedGame.capturedStones) {
        return res.status(500).json({ error: '손상된 저장 데이터: history, turn, 또는 capturedStones 누락' });
      }
      res.json(savedGame);
    } catch {
      res.status(500).json({ error: 'Corrupted saved data' });
    }
  });
});

// 삭제 API
app.delete('/delete/:name', (req, res) => {
  const safeName = safeFilename(req.params.name);
  const filePath = path.join(SAVE_DIR, `${safeName}.json`);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: '삭제 실패' });
    res.json({ message: '게임이 성공적으로 삭제되었습니다' });
  });
});

// 이름 변경 API
app.put('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: '유효하지 않은 데이터' });
  const safeOld = safeFilename(oldName);
  const safeNew = safeFilename(newName);
  const oldPath = path.join(SAVE_DIR, `${safeOld}.json`);
  const newPath = path.join(SAVE_DIR, `${safeNew}.json`);
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: '새 이름이 이미 존재합니다' });
  }
  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: '이름 변경 실패' });
    res.json({ message: '게임 이름이 성공적으로 변경되었습니다' });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));