import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { cloneBoard, findGroup, countLiberties, removeGroup } from '../utils/baduk';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faEdit, faTrashAlt, faCheck, faList } from '@fortawesome/free-solid-svg-icons';

const SIZE = 19;
const GRID_SIZE = 32;
const BOARD_MARGIN = 10;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_PIXEL = (SIZE - 1) * GRID_SIZE + BOARD_MARGIN * 2;
const SERVER_URL = 'http://localhost:4000';

const numberToAlpha = (num) => String.fromCharCode('A'.charCodeAt(0) + num);

function inside(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function BadukBoard() {
  const [board, setBoard] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill([EMPTY, 0])));
  const [turn, setTurn] = useState(BLACK);
  const [moveNum, setMoveNum] = useState(1);
  const [passCount, setPassCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [savedGamesList, setSavedGamesList] = useState([]);
  const [moveList, setMoveList] = useState([]);
  const [showLoadList, setShowLoadList] = useState(false);

  const [renameName, setRenameName] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);

  useEffect(() => {
    fetchSavedGames();
  }, []);

  const fetchSavedGames = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/list`);
      setSavedGamesList(res.data);
    } catch (e) {
      alert('저장된 게임 목록 불러오기 실패: ' + e.message);
    }
  };

  const countStones = (brd, color) =>
    brd.flat().filter(([cell]) => cell === color).length;

  const saveHistory = (brd, currentTurn, currentMoveNum, currentPassCount, currentGameOver, currentMoveList) => {
    const brdCopy = brd.map(row => row.map(cell => [...cell]));
    setHistory(prev => [...prev, {
      board: brdCopy,
      turn: currentTurn,
      moveNum: currentMoveNum,
      passCount: currentPassCount,
      gameOver: currentGameOver,
      moveList: [...currentMoveList],
    }]);
  };

  const addMoveList = (x, y, color, num) => {
    const col = numberToAlpha(y);
    const row = SIZE - x;
    const player = color === BLACK ? '흑' : '백';
    setMoveList((prev) => [...prev, { num, player, coord: `[${col},${row}]` }]);
  };

  const handlePass = () => {
    if (gameOver) return;
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

  const handleUndo = () => {
    if (history.length === 0) return;
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
    setBoard(Array(SIZE).fill().map(() => Array(SIZE).fill([EMPTY, 0])));
    setTurn(BLACK);
    setMoveNum(1);
    setPassCount(0);
    setGameOver(false);
    setHistory([]);
    setMoveList([]);
    setSaveName('');
    setShowLoadList(false);
    setRenameName('');
    setRenameTarget(null);
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('게임 이름을 입력하세요.');
      return;
    }
    try {
      await axios.post(`${SERVER_URL}/save`, {
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

  const handleLoad = async (name) => {
    try {
      const encodedName = encodeURIComponent(name);
      const res = await axios.get(`${SERVER_URL}/load/${encodedName}`);
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
      setShowLoadList(false);
      setRenameName('');
      setRenameTarget(null);
    } catch (e) {
      alert('불러오기 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`정말 "${name}" 게임을 삭제하시겠습니까?`)) return;
    try {
      const encodedName = encodeURIComponent(name);
      await axios.delete(`${SERVER_URL}/delete/${encodedName}`);
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
      await axios.put(`${SERVER_URL}/rename`, {
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
    if (gameOver) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - BOARD_MARGIN;
    const offsetY = e.clientY - rect.top - BOARD_MARGIN;
    const x = Math.round(offsetY / GRID_SIZE);
    const y = Math.round(offsetX / GRID_SIZE);
    if (!inside(x, y)) return;
    if (board[x][y][0] !== EMPTY) return;

    saveHistory(board, turn, moveNum, passCount, gameOver, moveList);

    const newBoard = board.map(row => row.map(cell => [...cell]));
    newBoard[x][y] = [turn, moveNum];

    const opponent = turn === BLACK ? WHITE : BLACK;

    for (let [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && newBoard[nx][ny][0] === opponent) {
        const group = findGroup(newBoard.map(r => r.map(([c]) => c)), nx, ny, opponent);
        if (countLiberties(newBoard.map(r => r.map(([c]) => c)), group) === 0) {
          for (let pos of group) newBoard[pos.x][pos.y] = [EMPTY, 0];
        }
      }
    }
    const myGroup = findGroup(newBoard.map(r => r.map(([c]) => c)), x, y, turn);
    if (countLiberties(newBoard.map(r => r.map(([c]) => c)), myGroup) === 0) return;

    setBoard(newBoard);
    setTurn(opponent);
    setMoveNum(moveNum + 1);
    setPassCount(0);
    addMoveList(x, y, turn, moveNum);
  };

  const stones = [];
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      const [cell, num] = board[x][y];
      if (cell !== EMPTY) {
        stones.push(
          <div
            key={`stone-${x}-${y}`}
            className={`stone ${cell === BLACK ? "black" : "white"}`}
            style={{
              top: BOARD_MARGIN + x*GRID_SIZE - 13,
              left: BOARD_MARGIN + y*GRID_SIZE - 13,
            }}
          >
            {num > 0 && (
              <span
                className="move-number"
                style={{
                  color: cell === BLACK ? "#fff" : "#111",
                  textShadow: cell === WHITE ? "0 0 2px #888" : "0 0 2px #000",
                }}
              >
                {num}
              </span>
            )}
          </div>
        )
      }
    }
  }

  const starCoords = [3,9,15]
  const stars = []
  for(let i of starCoords)
    for(let j of starCoords){
      stars.push(
        <div 
          key={`star-${i}-${j}`}
          className="star-point"
          style={{top: BOARD_MARGIN + i*GRID_SIZE -3, left: BOARD_MARGIN + j*GRID_SIZE -3}}
        />
      )
    }

  return(
    <div className="baduk-app-wrapper">
      <h1 className="app-title">바둑 대화</h1>

      <div className="baduk-main-container">
        <div className="baduk-board-container">

          <div 
            className="baduk-board-canvas"
            style={{width: BOARD_PIXEL, height: BOARD_PIXEL}}
            onClick={handleBoardClick}
          >
            <svg width={BOARD_PIXEL} height={BOARD_PIXEL} className="board-grid">
              {Array.from({length: SIZE}, (_,i)=>(
                <React.Fragment key={i}>
                  <line 
                    x1={BOARD_MARGIN} y1={BOARD_MARGIN+i*GRID_SIZE}
                    x2={BOARD_MARGIN+(SIZE-1)*GRID_SIZE} y2={BOARD_MARGIN+i*GRID_SIZE}
                    stroke="#222" strokeWidth={i===0||i===SIZE-1?2:1}
                  />
                  <line 
                    x1={BOARD_MARGIN+i*GRID_SIZE} y1={BOARD_MARGIN}
                    x2={BOARD_MARGIN+i*GRID_SIZE} y2={BOARD_MARGIN+(SIZE-1)*GRID_SIZE}
                    stroke="#222" strokeWidth={i===0||i===SIZE-1?2:1}
                  />
                </React.Fragment>
              ))}
            </svg>
            {stars}
            {stones}
          </div>

          <div className="baduk-buttons-row">
            <button onClick={handlePass}>게임 패스</button>
            <button onClick={handleUndo} disabled={history.length === 0}>되돌리기</button>
            <button onClick={handleNewGame}>새 게임</button>
            <input 
              type="text" 
              placeholder="게임 이름 입력" 
              value={saveName} 
              onChange={e=>setSaveName(e.target.value)} 
              disabled={renameTarget!==null}/>
            <button onClick={handleSave} disabled={renameTarget!==null}>저장</button>
            <button onClick={()=>setShowLoadList(prev=>!prev)}>
              <FontAwesomeIcon icon={faFileAlt} /> 게임목록
            </button>
          </div>

          {showLoadList&&(
            <div className="baduk-loadlist-box">
              <b>저장된 게임 목록</b>
              <ul>
                {savedGamesList.length === 0 && <li>저장된 게임이 없습니다.</li>}
                {savedGamesList.map(name=>(
                  <li key={name} className="game-list-item">
                    {renameTarget===name?(
                      <>
                        <input
                          className="rename-input"
                          type="text"
                          value={renameName}
                          onChange={e=>setRenameName(e.target.value)}
                          autoFocus
                        />
                        <button className="rename-btn" onClick={handleRenameSave} title="이름 변경확정">
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button className="delete-btn" onClick={()=>setRenameTarget(null)} title="취소">
                          취소
                        </button>
                      </>
                    ):(
                      <>
                        <button className="load-btn" onClick={()=>handleLoad(name)} title="불러오기">
                          <FontAwesomeIcon icon={faFileAlt} />
                        </button>
                        <span className="game-name">{name}</span>
                        <button className="rename-btn" onClick={()=>startRename(name)} title="이름 바꾸기">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className="delete-btn" onClick={()=>handleDelete(name)} title="삭제">
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        <div className="baduk-movelist-box">
          <b>전체 수순 내역</b>
          <ol>
            {moveList.map(({num,player,coord})=>(
              <li key={num}>{num} {player} {coord}</li>
            ))}
          </ol>
        </div>
      </div>

      {gameOver&&(
        <div className="game-over-box">
          <p>흑: {countStones(board, BLACK)} / 백: {countStones(board, WHITE)}</p>
          <b>{countStones(board, BLACK)>countStones(board, WHITE)?'흑 승리':'백 승리'}</b>
        </div>
      )}
    </div>
  );
}

export default BadukBoard;
