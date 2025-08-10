import React, { useState } from 'react';

const Controls = ({
  turn,
  capturedStones,
  onNewGame,
  onPass,
  onUndo,
  savedGames,
  onSave,
  onLoad,
  onDelete,
  onStartReview,
  onStopReview,
  isReviewing,
  onFirstMove,
  onPrevMove,
  onNextMove,
  onLastMove
}) => {
  const [saveName, setSaveName] = useState('');

  const handleSaveClick = () => {
    onSave(saveName);
    setSaveName('');
  };

  return (
    <div className="controls">
      <div>
        <h2>게임 제어</h2>
        <div className="game-info">
          <h3>현재 차례: {turn === 1 ? '흑' : '백'}</h3>
          <p>흑돌 잡은 수: {capturedStones[1]}</p>
          <p>백돌 잡은 수: {capturedStones[2]}</p>
        </div>
        <button onClick={onNewGame} disabled={isReviewing}>새 게임</button>
        <button onClick={onPass} disabled={isReviewing}>패스</button>
        <button onClick={onUndo} disabled={isReviewing}>무르기</button>
      </div>

      <div className="review-controls">
        <h2>복기</h2>
        {isReviewing && <p className="review-mode-indicator">복기 모드</p>}
        {isReviewing ? (
          <>
            <button onClick={onStopReview}>복기 중지</button>
            <button onClick={onFirstMove}>처음</button>
            <button onClick={onPrevMove}>이전</button>
            <button onClick={onNextMove}>다음</button>
            <button onClick={onLastMove}>마지막</button>
          </>
        ) : (
          <button onClick={onStartReview}>복기 시작</button>
        )}
      </div>

      <div className="data-controls">
        <h2>게임 데이터</h2>
        <div className="save-game">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="게임 이름 입력"
            disabled={isReviewing}
          />
          <button onClick={handleSaveClick} disabled={isReviewing}>저장</button>
        </div>
        <div className="saved-games-list">
          <h3>저장된 게임</h3>
          {savedGames.length === 0 ? (
            <p>저장된 게임이 없습니다.</p>
          ) : (
            <ul>
              {savedGames.map((gameName) => (
                <li key={gameName}>
                  <span>{gameName}</span>
                  <div>
                    <button onClick={() => onLoad(gameName)} disabled={isReviewing}>불러오기</button>
                    <button onClick={() => onDelete(gameName)} className="delete-btn" disabled={isReviewing}>삭제</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
