import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Nginx will proxy this to the backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGameList = () => {
  return apiClient.get('/list');
};

export const saveGame = (name, gameState) => {
  return apiClient.post('/save', { name, ...gameState });
};

export const loadGame = (name) => {
  return apiClient.get(`/load/${name}`);
};

export const deleteGame = (name) => {
  return apiClient.delete(`/delete/${name}`);
};

export const renameGame = (oldName, newName) => {
  return apiClient.put('/rename', { oldName, newName });
};
