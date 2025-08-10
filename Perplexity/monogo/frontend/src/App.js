import React, { useState, useEffect } from 'react';
import BadukBoard from './components/BadukBoard';
import Controls from './components/Controls';
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
  const [capturedStones, setCapturedStones] = useState({ [BLACK]: 0, [WHITE]: 0 });

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

  const handleBoardClick = async (x, y) => {
    if (reviewState.isActive) return;

    try {
      const response = await api.playMove(history, turn, { x, y });
      const { history: newHistory, turn: newTurn, capturedStones: newCapturedStones } = response.data;

      setHistory(newHistory);
      setTurn(newTurn);
      if (newCapturedStones > 0) {
        setCapturedStones(prev => ({
          ...prev,
          [turn]: prev[turn] + newCapturedStones
        }));
      }

    } catch (error) {
      console.error("Failed to play move:", error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  const handleNewGame = () => {
    setReviewState({ isActive: false, currentMove: 0 });
    setHistory([initialBoard]);
    setTurn(BLACK);
    setCapturedStones({ [BLACK]: 0, [WHITE]: 0 });
  };

  const handleUndo = () => {
    if (reviewState.isActive) return;
    if (history.length > 1) {
      setHistory(history.slice(0, history.length - 1));
      setTurn(turn === BLACK ? WHITE : BLACK);
      // Note: captured stones are not restored on undo
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
      const gameState = { history, turn, capturedStones };
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
      setCapturedStones(gameState.capturedStones || { [BLACK]: 0, [WHITE]: 0 });
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
        turn={turn}
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
        capturedStones={capturedStones}
      />
    </div>
  );
}

export default App;