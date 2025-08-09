import React, { useState } from 'react';

const SIZE = 19;
const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;

// 1. BoardGrid : 19×19 격자점(.intersection) 생성
function BoardGrid({ board, onClick }) {
  const intersections = [];
  const starCoords = [3, 9, 15]; // Define star coordinates here
  const isStarPoint = (r, c) =>
    starCoords.includes(r) && starCoords.includes(c);

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const classes = ['intersection'];
      if (row === 0) classes.push('top-edge');
      if (row === SIZE - 1) classes.push('bottom-edge');
      if (col === 0) classes.push('left-edge');
      if (col === SIZE - 1) classes.push('right-edge');

      const [color, moveNum] = board[row][col];
      const hasStone = color !== EMPTY;

      intersections.push(
        <div
          key={`${row}-${col}`}
          className={classes.join(' ')}
          onClick={() => onClick(row, col)}
        >
          {isStarPoint(row, col) && <div className="star-point" />}
          {hasStone && <Stone color={color} moveNum={moveNum} />}
        </div>
      );
    }
  }
  return <>{intersections}</>;
}

// 2. Stone : 바둑돌 위치 및 스타일
function Stone({ color, moveNum }) {
  return (
    <div
      className={`stone ${color === BLACK ? 'black' : 'white'}`}
      title={`수: ${moveNum}`}
    >
      <div className="move-number">{moveNum > 0 ? moveNum : ''}</div>
    </div>
  );
}

// 3. 메인 컴포넌트
function BadukBoard() {
  const [board, setBoard] = useState(
    Array(SIZE)
      .fill(null)
      .map(() => Array(SIZE).fill(null).map(() => [EMPTY, 0]))
  );
  const [turn, setTurn] = useState(BLACK);

  // 바둑판 클릭 이벤트: 클릭 위치에 돌 놓기
  const handleBoardClick = (x, y) => {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
    if (board[x][y][0] !== EMPTY) return;

    const newBoard = board.map(row => row.map(cell => [...cell]));
    const moveNumber =
      board.flat().reduce((max, [, num]) => (num > max ? num : max), 0) + 1;
    newBoard[x][y] = [turn, moveNumber];

    setBoard(newBoard);
    setTurn(turn === BLACK ? WHITE : BLACK);
  };

  return (
    <div className="baduk-app-wrapper">
      <h1 className="app-title">바둑 연습</h1>
      <div className="baduk-main-container">
        <div
          className="baduk-board-canvas"
          role="grid"
          aria-label="바둑판"
        >
          <BoardGrid board={board} onClick={handleBoardClick} />
        </div>
      </div>
    </div>
  );
}

export default BadukBoard;
