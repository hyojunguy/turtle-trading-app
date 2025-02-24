const API_BASE_URL = 'http://localhost:8000/api';

export const tradingJournalApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/trading-journals`);
    return response.json();
  },
  
  create: async (journalData) => {
    const response = await fetch(`${API_BASE_URL}/trading-journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(journalData),
    });
    return response.json();
  }
};

export const profitJournalApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/profit-journals`);
    return response.json();
  },
  
  create: async (journalData) => {
    const response = await fetch(`${API_BASE_URL}/profit-journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(journalData),
    });
    return response.json();
  }
}; 