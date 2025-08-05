import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SIZE = 19;
const GRID_SIZE = 32;
const BOARD_MARGIN = 10;
const BOARD_PIXEL = (SIZE - 1) * GRID_SIZE + BOARD_MARGIN * 2;
const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
const API_BASE = process.env.REACT_APP_API_BASE || '/api';
const DEFAULT_REVIEW_INTERVAL_MS = 500;

const numberToAlpha = (num) => String.fromCharCode('A'.charCodeAt(0) + num);

function inside(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function BadukBoard() {
  const [board, setBoard] = useState(
    Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill([EMPTY, 0]))
  );
  const [turn, setTurn] = useState(BLACK);
  const [moveNum, setMoveNum] = useState(1);
  const [passCount, setPassCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [savedGamesList, setSavedGamesList] = useState([]);
  const [moveList, setMoveList] = useState([]);
  const [showLoadList, setShowLoadList] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [isLoadedGame, setIsLoadedGame] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reviewInterval, setReviewInterval] = useState(DEFAULT_REVIEW_INTERVAL_MS);

  const reviewTimerRef = useRef(null);
  const reviewIndexRef = useRef(0);

  useEffect(() => {
    fetchSavedGames();
    return () => {
      if (reviewTimerRef.current) clearTimeout(reviewTimerRef.current);
    };
  }, []);

  const fetchSavedGames = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list`);
      setSavedGamesList(res.data);
    } catch (e) {
      alert('저장된 게임 목록 불러오기 실패: ' + e.message);
    }
  };

  function saveHistory(
    snapshotBoard,
    currentTurn,
    currentMoveNum,
    currentPassCount,
    currentGameOver,
    currentMoveList
  ) {
    const boardCopy = snapshotBoard.map((row) => row.map((cell) => [...cell]));
    setHistory((prev) => [
      ...prev,
      {
        board: boardCopy,
        turn: currentTurn,
        moveNum: currentMoveNum,
        passCount: currentPassCount,
        gameOver: currentGameOver,
        moveList: [...currentMoveList],
      },
    ]);
  }

  const addMoveList = (x, y, color, num) => {
    const col = numberToAlpha(y);
    const row = SIZE - x;
    const player = color === BLACK ? '흑' : '백';
    setMoveList((prev) => [...prev, { num, player, coord: `[${col},${row}]` }]);
  };

  const handlePass = () => {
    if (gameOver || isReviewing || isLoadedGame) return;
    saveHistory(board, turn, moveNum, passCount, gameOver, moveList);
    setPassCount((prev) => {
      if (prev + 1 === 2) {
        setGameOver(true);
        return 0;
      }
      setTurn(turn === BLACK ? WHITE : BLACK);
      return prev + 1;
    });
  };

  const handleClearBoard = () => {
    if (isReviewing) {
      alert('복기 중에는 초기화할 수 없습니다.');
      return;
    }
    setBoard(Array(SIZE).fill().map(() => Array(SIZE).fill([EMPTY, 0])));
    setTurn(BLACK);
    setMoveNum(1);
    setPassCount(0);
    setGameOver(false);
    setHistory([]);
  };

  const playReview = (moves) => {
    setBoard(Array(SIZE).fill().map(() => Array(SIZE).fill([EMPTY, 0])));
    setTurn(BLACK);
    setMoveNum(1);
    setPassCount(0);
    setGameOver(false);
    setHistory([]);
    setMoveList([]);
    setIsReviewing(true);
    setIsPaused(false);

    reviewIndexRef.current = 0;

    const playNext = () => {
      if (isPaused) {
        reviewTimerRef.current = setTimeout(playNext, 200);
        return;
      }
      if (reviewIndexRef.current >= moves.length) {
        setIsReviewing(false);
        return;
      }
      const { num, player, coord } = moves[reviewIndexRef.current];
      const match = coord.match(/^\[([A-S]),(\d{1,2})\]$/);
      if (!match) {
        reviewIndexRef.current++;
        reviewTimerRef.current = setTimeout(playNext, reviewInterval);
        return;
      }
      const y = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
      const x = SIZE - parseInt(match[2], 10);
      if (!inside(x, y)) {
        reviewIndexRef.current++;
        reviewTimerRef.current = setTimeout(playNext, reviewInterval);
        return;
      }
      setBoard((prev) => {
        const newBoard = prev.map((row) => row.map((cell) => [...cell]));
        newBoard[x][y] = [player === '흑' ? BLACK : WHITE, num];
        return newBoard;
      });
      setMoveList(moves.slice(0, reviewIndexRef.current + 1));
      setTurn(player === '흑' ? WHITE : BLACK);
      setMoveNum(num + 1);
      reviewIndexRef.current++;
      reviewTimerRef.current = setTimeout(playNext, reviewInterval);
    };
    playNext();
  };

  const handleStartReview = () => {
    if (!isLoadedGame || moveList.length === 0) {
      alert('복기할 수순이 없습니다.');
      return;
    }
    if (isReviewing) {
      alert('이미 복기 중입니다.');
      return;
    }
    playReview(moveList);
  };

  const handleLoad = async (name) => {
    if (isReviewing) {
      alert('복기 중에는 다른 게임을 불러올 수 없습니다.');
      return;
    }
    try {
      const encodedName = encodeURIComponent(name);
      const res = await axios.get(`${API_BASE}/load/${encodedName}`);
      const obj = res.data;
      if (!obj.board || !obj.turn || !obj.moveNum) {
        alert('잘못된 데이터입니다.');
        return;
      }
      setBoard(obj.board);
      setTurn(obj.turn);
      setMoveNum(obj.moveNum);
      setPassCount(obj.passCount || 0);
      setGameOver(obj.gameOver || false);
      setHistory([]);
      setMoveList(Array.isArray(obj.moveList) ? obj.moveList : []);
      setIsLoadedGame(true);
      setShowLoadList(false);
      setRenameName('');
      setRenameTarget(null);
    } catch (e) {
      alert('불러오기 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const togglePauseResume = () => {
    if (!isReviewing) return;
    //setIsPaused((p) => !p);
    setIsPaused(isPaused ? false : true);
  };

  const handleUndo = () => {
    if (history.length === 0 || isReviewing) return;
    const last = history[history.length - 1];
    setBoard(last.board);
    setTurn(last.turn);
    setMoveNum(last.moveNum);
    setPassCount(last.passCount);
    setGameOver(last.gameOver);
    setMoveList(Array.isArray(last.moveList) ? last.moveList : []);
    setHistory(history.slice(0, -1));
  };

  const handleNewGame = () => {
    if (isReviewing) {
      clearTimeout(reviewTimerRef.current);
      setIsReviewing(false);
      setIsPaused(false);
    }
    setBoard(Array(SIZE).fill().map(() => Array(SIZE).fill([EMPTY, 0])));
    setTurn(BLACK);
    setMoveNum(1);
    setPassCount(0);
    setGameOver(false);
    setHistory([]);
    setMoveList([]);
    setSaveName('');
    setRenameName('');
    setRenameTarget(null);
    setShowLoadList(false);
    setIsLoadedGame(false);
  };

  const handleSave = async () => {
    if (isReviewing) {
      alert('복기 중에는 저장할 수 없습니다.');
      return;
    }
    if (!saveName.trim()) {
      alert('게임 이름을 입력하세요.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/save`, {
        name: saveName.trim(),
        board,
        turn,
        moveNum,
        passCount,
        gameOver,
        moveList,
      });
      alert('게임이 저장되었습니다.');
      setSaveName('');
      fetchSavedGames();
      setShowLoadList(false);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (name) => {
    if (isReviewing) {
      alert('복기 중에는 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`정말 "${name}" 게임을 삭제하시겠습니까?`)) return;
    try {
      const encodedName = encodeURIComponent(name);
      await axios.delete(`${API_BASE}/delete/${encodedName}`);
      alert('게임이 삭제되었습니다.');
      fetchSavedGames();
      if (renameTarget === name) {
        setRenameName('');
        setRenameTarget(null);
      }
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const startRename = (name) => {
    if (isReviewing) {
      alert('복기 중에는 이름을 변경할 수 없습니다.');
      return;
    }
    setRenameTarget(name);
    setRenameName(name);
  };

  const handleRenameSave = async () => {
    if (!renameName.trim()) {
      alert('새 이름을 입력하세요.');
      return;
    }
    if (!renameTarget) return;
    try {
      await axios.put(`${API_BASE}/rename`, {
        oldName: renameTarget,
        newName: renameName.trim(),
      });
      alert('이름이 변경되었습니다.');
      fetchSavedGames();
      setRenameTarget(null);
      setRenameName('');
    } catch (e) {
      alert('이름 변경 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleBoardClick = (e) => {
    if (gameOver || isReviewing || isLoadedGame) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - BOARD_MARGIN;
    const offsetY = e.clientY - rect.top - BOARD_MARGIN;
    const x = Math.round(offsetY / GRID_SIZE);
    const y = Math.round(offsetX / GRID_SIZE);
    if (!inside(x, y)) return;
    if (board[x][y][0] !== EMPTY) return;

    saveHistory(board, turn, moveNum, passCount, gameOver, moveList);

    const newBoard = board.map((row) => row.map((cell) => [...cell]));
    newBoard[x][y] = [turn, moveNum];

    setBoard(newBoard);
    setTurn(turn === BLACK ? WHITE : BLACK);
    setMoveNum(moveNum + 1);
    setPassCount(0);
    addMoveList(x, y, turn, moveNum);
  };

  // Rendering JSX
  const stones = [];
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      const [cell, num] = board[x][y];
      if (cell !== EMPTY) {
        stones.push(
          <div
            key={`stone-${x}-${y}`}
            className={`stone ${cell === BLACK ? 'black' : 'white'}`}
            style={{
              position: 'absolute',
              top: BOARD_MARGIN + x * GRID_SIZE - 13,
              left: BOARD_MARGIN + y * GRID_SIZE - 13,
              width: 26,
              height: 26,
              borderRadius: '50%',
              boxShadow: '1px 1px 4px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              zIndex: 2,
              color: cell === BLACK ? '#fff' : '#111',
              textShadow: cell === WHITE ? '0 0 2px #888' : '0 0 2px #000',
              fontSize: 15,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {num > 0 ? num : ''}
          </div>
        );
      }
    }
  }

  const starCoords = [3, 9, 15];
  const stars = [];
  for (let i of starCoords)
    for (let j of starCoords) {
      stars.push(
        <div
          key={`star-${i}-${j}`}
          style={{
            position: 'absolute',
            width: 7,
            height: 7,
            background: '#111',
            borderRadius: '50%',
            top: BOARD_MARGIN + i * GRID_SIZE - 3,
            left: BOARD_MARGIN + j * GRID_SIZE - 3,
            zIndex: 1,
          }}
        />
      );
    }

  return (
    <div className="baduk-app-wrapper">
      <h1 className="app-title">바둑 대화</h1>
      <div
        className="baduk-main-container"
        style={{ display: 'flex', gap: 20, justifyContent: 'center' }}
      >
        <div
          className="baduk-board-container"
          style={{
            flexShrink: 0,
            minWidth: 620,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
            className="baduk-board-canvas"
            style={{
              position: 'relative',
              width: BOARD_PIXEL,
              height: BOARD_PIXEL,
              background: '#f7e8c4',
              borderRadius: 10,
              border: '2px solid #111',
              boxShadow: '0 6px 30px rgba(0,0,0,0.12)',
              userSelect: 'none',
            }}
            onClick={handleBoardClick}
          >
            <svg
              width={BOARD_PIXEL}
              height={BOARD_PIXEL}
              className="board-grid"
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
            >
              {Array.from({ length: SIZE }, (_, i) => (
                <React.Fragment key={i}>
                  <line
                    x1={BOARD_MARGIN}
                    y1={BOARD_MARGIN + i * GRID_SIZE}
                    x2={BOARD_MARGIN + (SIZE - 1) * GRID_SIZE}
                    y2={BOARD_MARGIN + i * GRID_SIZE}
                    stroke="#222"
                    strokeWidth={i === 0 || i === SIZE - 1 ? 2 : 1}
                  />
                  <line
                    x1={BOARD_MARGIN + i * GRID_SIZE}
                    y1={BOARD_MARGIN}
                    x2={BOARD_MARGIN + i * GRID_SIZE}
                    y2={BOARD_MARGIN + (SIZE - 1) * GRID_SIZE}
                    stroke="#222"
                    strokeWidth={i === 0 || i === SIZE - 1 ? 2 : 1}
                  />
                </React.Fragment>
              ))}
            </svg>
            {stars}
            {stones}
          </div>

          {/* 버튼 그룹 */}
          {!isLoadedGame && !isReviewing && (
            <div
              className="baduk-buttons-row"
              style={{
                marginTop: 14,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={handlePass}>패스</button>
              <button onClick={handleUndo} disabled={history.length === 0}>
                되돌리기
              </button>
              <button onClick={handleNewGame}>새 게임</button>
              <input
                type="text"
                placeholder="게임 이름 입력"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                disabled={renameTarget !== null}
              />
              <button onClick={handleSave} disabled={renameTarget !== null}>
                저장
              </button>
              <button onClick={() => setShowLoadList((prev) => !prev)}>
                게임목록
              </button>
            </div>
          )}
          {isLoadedGame && !isReviewing && (
            <div
              className="baduk-buttons-row"
              style={{
                marginTop: 14,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={handleNewGame}>새 게임</button>
              <button onClick={handleClearBoard} disabled={isReviewing}>
                초기화
              </button>
              <button onClick={handleStartReview} disabled={moveList.length === 0}>
                복기 시작
              </button>
              <input
                type="number"
                min="100"
                max="2000"
                step="100"
                style={{ width: 70 }}
                value={reviewInterval}
                onChange={(e) => setReviewInterval(Number(e.target.value))}
              />
            </div>
          )}
          {isReviewing && (
            <div className="baduk-buttons-row">
              <button onClick={togglePauseResume}>
                {isPaused ? '재개' : '일시정지'}
              </button>
            </div>
          )}

          {showLoadList && (
            <div
              className="baduk-loadlist-box"
              style={{
                marginTop: 12,
                maxHeight: 200,
                overflowY: 'auto',
                width: 260,
                background: '#faf8f0',
                border: '1px solid #ddd7a2',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <b>저장된 게임 목록</b>
              <ul>
                {savedGamesList.length === 0 && <li>저장된 게임이 없습니다.</li>}
                {savedGamesList.map((name) => (
                  <li
                    key={name}
                    className="game-list-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {renameTarget === name ? (
                      <>
                        <input
                          className="rename-input"
                          type="text"
                          value={renameName}
                          onChange={(e) => setRenameName(e.target.value)}
                          autoFocus
                          disabled={isReviewing}
                        />
                        <button onClick={handleRenameSave} disabled={isReviewing}>
                          확인
                        </button>
                        <button onClick={() => setRenameTarget(null)} disabled={isReviewing}>
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleLoad(name)} disabled={isReviewing}>
                          불러오기
                        </button>
                        <span className="game-name">{name}</span>
                        <button onClick={() => startRename(name)} disabled={isReviewing}>
                          이름변경
                        </button>
                        <button onClick={() => handleDelete(name)} disabled={isReviewing}>
                          삭제
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 전체 수순 내역 */}
        <div
          className="baduk-movelist-box"
          style={{
            maxWidth: 260,
            fontSize: 15,
            background: '#faf8f0',
            border: '1px solid #ddd7a2',
            borderRadius: 8,
            padding: '14px 18px',
            overflowY: 'auto',
            height: 420,
          }}
        >
          <b>전체 수순 내역</b>
          <ol>
            {moveList.map(({ num, player, coord }) => (
              <li key={num}>
                {num} {player} {coord}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {gameOver && (
        <div
          className="game-over-box"
          style={{ marginTop: 20, fontSize: 18, textAlign: 'center', fontWeight: 700 }}
        >
          <p>
            흑: {board.flat().filter(([cell]) => cell === BLACK).length} / 백:{' '}
            {board.flat().filter(([cell]) => cell === WHITE).length}
          </p>
          <b>
            {board.flat().filter(([cell]) => cell === BLACK).length >
            board.flat().filter(([cell]) => cell === WHITE).length
              ? '흑 승리'
              : '백 승리'}
          </b>
        </div>
      )}
    </div>
  );
}

export default BadukBoard;
