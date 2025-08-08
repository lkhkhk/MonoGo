import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SIZE = 19;
const GRID_SIZE = 32;
const BOARD_MARGIN = 10;
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
  const boardRef = useRef(null);
  const [boardCalculatedSizes, setBoardCalculatedSizes] = useState({
    margin: BOARD_MARGIN,
    grid: GRID_SIZE,
    stoneSize: 26,
    starPointSize: 7,
    stoneFontSize: 15,
  });

  const reviewTimerRef = useRef(null);
  const reviewIndexRef = useRef(0);

  useEffect(() => {
    const updateCalculatedSizes = () => {
          // 뷰포트의 너비와 높이 중 작은 값을 기준으로 바둑판 크기를 조정
          const viewportMin = Math.min(window.innerWidth, window.innerHeight) * 0.95; // 95% 사용
          const calculatedGridSize = (viewportMin - (BOARD_MARGIN * 2)) / (SIZE - 1);

          setBoardCalculatedSizes({
            margin: BOARD_MARGIN * (viewportMin / ((SIZE - 1) * GRID_SIZE + BOARD_MARGIN * 2)), // 마진도 스케일링
            grid: calculatedGridSize,
            stoneSize: calculatedGridSize * (26 / GRID_SIZE), // 돌 크기
            starPointSize: calculatedGridSize * (7 / GRID_SIZE), // 화점 크기
            stoneFontSize: calculatedGridSize * (15 / GRID_SIZE), // 돌 숫자 폰트 크기
          });
        };

    updateCalculatedSizes();
    window.addEventListener('resize', updateCalculatedSizes);

    fetchSavedGames();
    return () => {
      window.removeEventListener('resize', updateCalculatedSizes);
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
    const offsetX = e.clientX - rect.left - boardCalculatedSizes.margin;
    const offsetY = e.clientY - rect.top - boardCalculatedSizes.margin;
    const x = Math.round(offsetY / boardCalculatedSizes.grid);
    const y = Math.round(offsetX / boardCalculatedSizes.grid);
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
              top: boardCalculatedSizes.margin + x * boardCalculatedSizes.grid - boardCalculatedSizes.stoneSize / 2,
              left: boardCalculatedSizes.margin + y * boardCalculatedSizes.grid - boardCalculatedSizes.stoneSize / 2,
              width: boardCalculatedSizes.stoneSize,
              height: boardCalculatedSizes.stoneSize,
              color: cell === BLACK ? '#fff' : '#111',
              textShadow: cell === WHITE ? '0 0 2px #888' : '0 0 2px #000',
              fontSize: boardCalculatedSizes.stoneFontSize,
            }}
          >
            <div className="move-number">
              {num > 0 ? num : ''}
            </div>
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
          className="star-point"
          style={{
            top: boardCalculatedSizes.margin + i * boardCalculatedSizes.grid - boardCalculatedSizes.starPointSize / 2,
            left: boardCalculatedSizes.margin + j * boardCalculatedSizes.grid - boardCalculatedSizes.starPointSize / 2,
            width: boardCalculatedSizes.starPointSize,
            height: boardCalculatedSizes.starPointSize,
          }}
        />
      );
    }

  return (
    <div className="baduk-app-wrapper">
      <h1 className="app-title">바둑 대화</h1>
      <div
        className="baduk-main-container"
      >
        <div
          className="baduk-board-container"
        >
          <div
            ref={boardRef}
            className="baduk-board-canvas"
            onClick={handleBoardClick}
          >
            <svg
              width="100%"
              height="100%"
              className="board-grid"
            >
              {Array.from({ length: SIZE }, (_, i) => (
                <React.Fragment key={i}>
                  <line
                    x1={boardCalculatedSizes.margin}
                    y1={boardCalculatedSizes.margin + i * boardCalculatedSizes.grid}
                    x2={boardCalculatedSizes.margin + (SIZE - 1) * boardCalculatedSizes.grid}
                    y2={boardCalculatedSizes.margin + i * boardCalculatedSizes.grid}
                    stroke="#222"
                    strokeWidth={i === 0 || i === SIZE - 1 ? 2 * (boardCalculatedSizes.grid / GRID_SIZE) : 1 * (boardCalculatedSizes.grid / GRID_SIZE)}
                  />
                  <line
                    x1={boardCalculatedSizes.margin + i * boardCalculatedSizes.grid}
                    y1={boardCalculatedSizes.margin}
                    x2={boardCalculatedSizes.margin + i * boardCalculatedSizes.grid}
                    y2={boardCalculatedSizes.margin + (SIZE - 1) * boardCalculatedSizes.grid}
                    stroke="#222"
                    strokeWidth={i === 0 || i === SIZE - 1 ? 2 * (boardCalculatedSizes.grid / GRID_SIZE) : 1 * (boardCalculatedSizes.grid / GRID_SIZE)}
                  />
                </React.Fragment>
              ))}
            </svg>
            {stars}
            {stones}
          </div>

          {/* 버튼 그룹 */}
          <div className="baduk-buttons-group">
            {!isLoadedGame && !isReviewing && (
              <div
                className="baduk-buttons-row"
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
          </div>

          {showLoadList && (
            <div
              className="baduk-loadlist-box"
            >
              <b>저장된 게임 목록</b>
              <ul>
                {savedGamesList.length === 0 && <li>저장된 게임이 없습니다.</li>}
                {savedGamesList.map((name) => (
                  <li
                    key={name}
                    className="game-list-item"
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
