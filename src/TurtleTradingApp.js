import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Alert, AlertTitle } from '@mui/material';
import { Button, TextField, CircularProgress } from '@mui/material';
import { Search } from '@mui/icons-material';

// 주식 데이터를 가져오는 함수 (동일)
const fetchStockData = async (symbol) => {
  const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      throw new Error('API 요청에 실패했습니다.');
    }

    const timeSeries = data['Time Series (Daily)'];
    const stockData = Object.keys(timeSeries).map((date) => ({
      date,
      close: parseFloat(timeSeries[date]['4. close']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
    }));

    // 날짜 순서 정렬 (오름차순)
    return stockData.reverse();
  } catch (error) {
    console.error(error);
    throw new Error('데이터를 가져오는 중 오류가 발생했습니다.');
  }
};

// N값 계산 함수 (동일)
const calculateN = (data) => {
  // True Range(TR) 계산
  const trValues = data.map((current, index) => {
    if (index === 0) return current.high - current.low;
    const previous = data[index - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);
    return Math.max(highLow, highClose, lowClose);
  });

  // 20일 지수 이동 평균(EMA) 계산
  const nValues = [];
  const smoothingFactor = 1 / 20;
  trValues.forEach((tr, index) => {
    if (index === 0) {
      nValues.push(tr);
    } else {
      const n = (tr - nValues[index - 1]) * smoothingFactor + nValues[index - 1];
      nValues.push(n);
    }
  });

  // 마지막 N값 반환
  return nValues[nValues.length - 1];
};

// 매매 신호 계산 함수 (동일)
const calculateSignals = (data) => {
  const signals = data.map((current, index) => {
    if (index < 20) {
      return { ...current, signal: 'HOLD' };
    }

    const past20Days = data.slice(index - 20, index);
    const past20Highs = past20Days.map((d) => d.high);
    const past20Lows = past20Days.map((d) => d.low);
    const highestHigh = Math.max(...past20Highs);
    const lowestLow = Math.min(...past20Lows);

    let signal = 'HOLD';
    if (current.close > highestHigh) {
      signal = 'BUY';
    } else if (current.close < lowestLow) {
      signal = 'SELL';
    }

    return { ...current, signal };
  });

  return signals;
};

// 커스텀 테이블 컴포넌트 (동일)
const CustomTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 px-4 border-b">날짜</th>
          <th className="py-2 px-4 border-b">종가</th>
          <th className="py-2 px-4 border-b">신호</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
            <td className="py-2 px-4 border-b">{row.date}</td>
            <td className="py-2 px-4 border-b">{row.close.toFixed(2)}</td>
            <td className="py-2 px-4 border-b">{row.signal}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TurtleTradingApp = () => {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState([]);
  const [nValue, setNValue] = useState(0);
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    if (!symbol) {
      setError('주식 심볼을 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await fetchStockData(symbol);
      if (data.length < 20) {
        setError('데이터가 부족하여 분석할 수 없습니다.');
        setLoading(false);
        return;
      }
      setStockData(data);
      const n = calculateN(data);
      setNValue(n);
      const signalData = calculateSignals(data);
      setSignals(signalData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">터틀 트레이딩 주식 분석</h1>
      <div className="flex items-center space-x-2 mb-4">
        <TextField
          variant="outlined"
          type="text"
          placeholder="주식 심볼 입력 (예: AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAnalysis}
          disabled={loading}
          startIcon={<Search />}
        >
          {loading ? '분석 중...' : '분석'}
        </Button>
      </div>
      {error && (
        <Alert severity="error" className="mb-4">
          <AlertTitle>오류</AlertTitle>
          {error}
        </Alert>
      )}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <CircularProgress />
        </div>
      )}
      {stockData.length > 0 && !error && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">N 값: {nValue.toFixed(2)}</h2>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="close" stroke="#8884d8" name="종가" />
              <Line type="monotone" dataKey="high" stroke="#82ca9d" name="고가" />
              <Line type="monotone" dataKey="low" stroke="#ffc658" name="저가" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">매매 신호</h2>
            <CustomTable data={signals.slice(-10)} />
          </div>
        </>
      )}
    </div>
  );
};

export default TurtleTradingApp;
