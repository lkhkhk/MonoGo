import React, { useState, useEffect } from 'react';
import BadukBoard from './components/BadukBoard';
import Controls from './components/Controls';
import { cloneBoard, findGroup, countLiberties, removeGroup, inside } from './utils/baduk';
import * as api from './utils/api';
import './App.css';

const SIZE = 19;
const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
const initialBoard = Array(SIZE).fill(null).map(() => Array(SIZE).fill([EMPTY, 0]));

function App() {
  const [history, setHistory] = useState([initialBoard]);
  const [turn, setTurn] = useState(BLACK);
  const [savedGames, setSavedGames] = useState([]);
  const [reviewState, setReviewState] = useState({ isActive: false, currentMove: 0 });

  const displayedBoard = reviewState.isActive ? history[reviewState.currentMove] : history[history.length - 1];

  useEffect(() => {
    if (reviewState.isActive && reviewState.currentMove < history.length - 1) {
      const timer = setTimeout(() => {
        setReviewState(prev => ({ ...prev, currentMove: prev.currentMove + 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reviewState, history]);

  useEffect(() => {
    fetchGameList();
  }, []);

  const fetchGameList = async () => {
    try {
      const response = await api.getGameList();
      setSavedGames(response.data);
    } catch (error) {
      console.error("Failed to fetch game list:", error);
      alert("저장된 게임 목록을 불러오는데 실패했습니다.");
    }
  };

  const handleBoardClick = (x, y) => {
    if (reviewState.isActive) return;
    if (!inside(x, y) || history[history.length - 1][x][y][0] !== EMPTY) return;

    const currentBoard = history[history.length - 1];
    const newBoard = cloneBoard(currentBoard);
    const opponent = turn === BLACK ? WHITE : BLACK;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    const moveNumber = currentBoard.flat().reduce((max, [, num]) => (num > max ? num : max), 0) + 1;
    newBoard[x][y] = [turn, moveNumber];

    const colorBoard = newBoard.map(row => row.map(cell => cell[0]));

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (inside(nx, ny) && colorBoard[nx][ny] === opponent) {
        const group = findGroup(colorBoard, nx, ny, opponent);
        if (countLiberties(colorBoard, group) === 0) {
          for (const { x: gx, y: gy } of group) {
            newBoard[gx][gy] = [EMPTY, 0];
          }
        }
      }
    }

    const finalColorBoard = newBoard.map(row => row.map(cell => cell[0]));
    const myGroup = findGroup(finalColorBoard, x, y, turn);
    if (countLiberties(finalColorBoard, myGroup) === 0) {
      console.log("Suicide move is not allowed.");
      return;
    }

    setHistory([...history, newBoard]);
    setTurn(opponent);
  };

  const handleNewGame = () => {
    setReviewState({ isActive: false, currentMove: 0 });
    setHistory([initialBoard]);
    setTurn(BLACK);
  };

  const handleUndo = () => {
    if (reviewState.isActive) return;
    if (history.length > 1) {
      setHistory(history.slice(0, history.length - 1));
      setTurn(turn === BLACK ? WHITE : BLACK);
    }
  };

  const handlePass = () => {
    if (reviewState.isActive) return;
    setTurn(turn === BLACK ? WHITE : BLACK);
  };

  const handleSaveGame = async (name) => {
    if (!name) {
      alert("저장할 파일 이름을 입력하세요.");
      return;
    }
    try {
      const gameState = { history, turn };
      await api.saveGame(name, gameState);
      alert("게임이 저장되었습니다.");
      fetchGameList();
    } catch (error) {
      console.error("Failed to save game:", error);
      alert("게임 저장에 실패했습니다.");
    }
  };

  const handleLoadGame = async (name) => {
    try {
      const response = await api.loadGame(name);
      const gameState = response.data;
      setHistory(gameState.history || [initialBoard]);
      setTurn(gameState.turn || BLACK);
      setReviewState({ isActive: false, currentMove: 0 });
      alert("게임을 불러왔습니다.");
    } catch (error) {
      console.error("Failed to load game:", error);
      alert("게임 불러오기에 실패했습니다.");
    }
  };

  const handleDeleteGame = async (name) => {
    if (window.confirm(`'${name}' 게임을 정말 삭제하시겠습니까?`)) {
      try {
        await api.deleteGame(name);
        alert("게임이 삭제되었습니다.");
        fetchGameList();
      } catch (error) {
        console.error("Failed to delete game:", error);
        alert("게임 삭제에 실패했습니다.");
      }
    }
  };

  const handleStartReview = () => {
    if (history.length <= 1) {
      alert("복기할 내용이 없습니다.");
      return;
    }
    setReviewState({ isActive: true, currentMove: 0 });
  };

  const handleStopReview = () => {
    setReviewState({ isActive: false, currentMove: 0 });
  };

  return (
    <div className="app-container">
      <BadukBoard board={displayedBoard} onClick={handleBoardClick} />
      <Controls
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        onPass={handlePass}
        savedGames={savedGames}
        onSave={handleSaveGame}
        onLoad={handleLoadGame}
        onDelete={handleDeleteGame}
        onStartReview={handleStartReview}
        onStopReview={handleStopReview}
        isReviewing={reviewState.isActive}
      />
    </div>
  );
}

export default App;
