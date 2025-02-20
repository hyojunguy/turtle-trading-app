import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import TurtleTradingApp from './features/turtle/TurtleTradingApp';
import TradingJournal from './features/journal/TradingJournal';
import ProfitJournal from './features/profit/ProfitJournal';
import './features/journal/styles/journal.css';
import './components/common/styles/navbar.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<TurtleTradingApp />} />
        <Route path="/journal" element={<TradingJournal />} />
        <Route path="/profit" element={<ProfitJournal />} />
      </Routes>
    </Router>
  );
};

export default App;

