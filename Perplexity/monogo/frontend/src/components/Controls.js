import React, { useState } from 'react';

const Controls = ({
  onNewGame,
  onPass,
  onUndo,
  savedGames,
  onSave,
  onLoad,
  onDelete,
  onStartReview,
  onStopReview,
  isReviewing
}) => {
  const [saveName, setSaveName] = useState('');

  const handleSaveClick = () => {
    onSave(saveName);
    setSaveName('');
  };

  return (
    <div className="controls">
      <div>
        <h2>Game Controls</h2>
        <button onClick={onNewGame}>New Game</button>
        <button onClick={onPass} disabled={isReviewing}>Pass</button>
        <button onClick={onUndo} disabled={isReviewing}>Undo</button>
      </div>

      <div className="review-controls">
        <h2>Review</h2>
        {isReviewing ? (
          <button onClick={onStopReview}>Stop Review</button>
        ) : (
          <button onClick={onStartReview}>Start Review</button>
        )}
      </div>

      <div className="data-controls">
        <h2>Game Data</h2>
        <div className="save-game">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter game name"
            disabled={isReviewing}
          />
          <button onClick={handleSaveClick} disabled={isReviewing}>Save</button>
        </div>
        <div className="saved-games-list">
          <h3>Saved Games</h3>
          {savedGames.length === 0 ? (
            <p>No saved games.</p>
          ) : (
            <ul>
              {savedGames.map((gameName) => (
                <li key={gameName}>
                  <span>{gameName}</span>
                  <div>
                    <button onClick={() => onLoad(gameName)} disabled={isReviewing}>Load</button>
                    <button onClick={() => onDelete(gameName)} className="delete-btn" disabled={isReviewing}>Delete</button>
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
