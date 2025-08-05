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

app.get('/', (req, res) => {
  res.send('Baduk backend running');
});

// 저장 API
app.post('/save', (req, res) => {
  const { name, board, turn, moveNum, passCount, gameOver, moveList } = req.body;
  if (!name || !board || !turn || !moveNum) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  const safeName = safeFilename(name);
  const filePath = path.join(SAVE_DIR, `${safeName}.json`);
  const data = { name, board, turn, moveNum, passCount, gameOver, moveList };
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Save failed' });
    res.json({ message: 'Game saved successfully' });
  });
});

// 목록 조회 API
app.get('/list', (req, res) => {
  console.log('Received /list request'); // 디버그 로그 추가
  fs.readdir(SAVE_DIR, (err, files) => {
    if (err) {
      console.error('Failed to read SAVE_DIR:', err); // 에러 로그 추가
      return res.status(500).json({ error: 'Failed to list saved games' });
    }
    const games = files.filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
    console.log('Sending game list:', games); // 성공 로그 추가
    res.json(games);
  });
});

// 게임 불러오기 API
app.get('/load/:name', (req, res) => {
  const safeName = safeFilename(req.params.name);
  const filePath = path.join(SAVE_DIR, `${safeName}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to load saved game' });
    try {
      const savedGame = JSON.parse(data);
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
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: 'Game deleted successfully' });
  });
});

// 이름 변경 API
app.put('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Invalid data' });
  const safeOld = safeFilename(oldName);
  const safeNew = safeFilename(newName);
  const oldPath = path.join(SAVE_DIR, `${safeOld}.json`);
  const newPath = path.join(SAVE_DIR, `${safeNew}.json`);
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: 'New name already exists' });
  }
  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: 'Rename failed' });
    res.json({ message: 'Game renamed successfully' });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
