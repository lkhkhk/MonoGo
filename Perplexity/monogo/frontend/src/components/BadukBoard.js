import React from 'react';

const SIZE = 19;
const BLACK = 1;
const EMPTY = 0;

// The component now receives `board` and `onClick` as props.
function BoardGrid({ board, onClick }) {
  const intersections = [];
  const starCoords = [3, 9, 15];
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

// The main component is now much simpler.
function BadukBoard({ board, onClick }) {
  return (
    <div className="baduk-app-wrapper">
      <h1 className="app-title">바둑 연습</h1>
      <div className="baduk-main-container">
        <div
          className="baduk-board-canvas"
          role="grid"
          aria-label="바둑판"
        >
          <BoardGrid board={board} onClick={onClick} />
        </div>
      </div>
    </div>
  );
}

export default BadukBoard;
