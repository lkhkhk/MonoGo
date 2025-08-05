const SIZE = 19;
const EMPTY = 0;
const directions = [
  [0, 1], [1, 0], [0, -1], [-1, 0]
];

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function inside(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

export function findGroup(board, x, y, color, visited = {}) {
  if (!inside(x, y) || board[x][y] !== color || visited[`${x},${y}`]) return [];
  visited[`${x},${y}`] = true;
  let group = [{ x, y }];
  for (let [dx, dy] of directions) {
    group = group.concat(findGroup(board, x + dx, y + dy, color, visited));
  }
  return group;
}

export function countLiberties(board, group) {
  const liberties = new Set();
  for (const { x, y } of group) {
    for (let [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && board[nx][ny] === EMPTY) {
        liberties.add(`${nx},${ny}`);
      }
    }
  }
  return liberties.size;
}

export function removeGroup(board, group) {
  for (const { x, y } of group) {
    board[x][y] = EMPTY;
  }
}
