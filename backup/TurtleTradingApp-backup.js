import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush,
} from 'recharts';
import { Alert, AlertTitle } from '@mui/material';
import { Button, TextField, CircularProgress, Chip, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';

// 미국 시가총액 상위 10개 기업 심볼 리스트
const top10Symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BRK.B', 'NVDA', 'META', 'JPM', 'JNJ'];

// 주식 데이터를 가져오는 함수
const fetchStockData = async (symbol) => {
  const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

  // 캐시된 데이터 확인
  const cachedData = localStorage.getItem(`stockData_${symbol}`);
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    const cachedDate = parsedData.date; // 캐시된 데이터의 날짜
    const today = new Date().toISOString().split('T')[0];
    if (cachedDate === today) {
      // 캐시된 데이터가 오늘 날짜인 경우, 캐시된 데이터 반환
      console.log('캐시된 데이터를 사용합니다.');
      return parsedData.data;
    }
  }

  // 캐시가 없거나 유효하지 않은 경우 API 호출
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
    const sortedData = stockData.reverse();

    // 데이터 캐싱
    const cacheEntry = {
      date: new Date().toISOString().split('T')[0], // 오늘 날짜
      data: sortedData,
    };
    localStorage.setItem(`stockData_${symbol}`, JSON.stringify(cacheEntry));

    return sortedData;
  } catch (error) {
    console.error(error);
    throw new Error('데이터를 가져오는 중 오류가 발생했습니다.');
  }
};

// N값과 TR 값 계산 함수
const calculateTRValues = (data) => {
  const trValues = data.map((current, index) => {
    if (index === 0) {
      return {
        ...current,
        tr: current.high - current.low,
        n: 0, // 첫 번째 값은 N 값을 계산할 수 없음
      };
    }
    const previous = data[index - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);
    const tr = Math.max(highLow, highClose, lowClose);

    // 최근 20일의 TR 값으로 N 값 계산
    let n = 0;
    if (index >= 20) {
      const trSlice = data.slice(index - 19, index + 1).map((d, idx) => {
        if (idx === 0) return d.high - d.low;
        const prev = data[index - 20 + idx];
        const hl = d.high - d.low;
        const hc = Math.abs(d.high - prev.close);
        const lc = Math.abs(d.low - prev.close);
        return Math.max(hl, hc, lc);
      });
      n = trSlice.reduce((sum, val) => sum + val, 0) / 20;
    }

    return {
      ...current,
      tr,
      n,
    };
  });

  return trValues;
};

// 매매 신호 계산 함수
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

// 커스텀 테이블 컴포넌트
const CustomTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 px-4 border-b text-center">날짜</th>
          <th className="py-2 px-4 border-b text-center">고가</th>
          <th className="py-2 px-4 border-b text-center">저가</th>
          <th className="py-2 px-4 border-b text-center">종가</th>
          <th className="py-2 px-4 border-b text-center">TR</th>
          <th className="py-2 px-4 border-b text-center">N 값</th>
          <th className="py-2 px-4 border-b text-center">신호</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
            <td className="py-2 px-4 border-b text-center">{row.date}</td>
            <td className="py-2 px-4 border-b text-center">{row.high.toFixed(2)}</td>
            <td className="py-2 px-4 border-b text-center">{row.low.toFixed(2)}</td>
            <td className="py-2 px-4 border-b text-center">{row.close.toFixed(2)}</td>
            <td className="py-2 px-4 border-b text-center">{row.tr ? row.tr.toFixed(2) : '-'}</td>
            <td className="py-2 px-4 border-b text-center">{row.n ? row.n.toFixed(2) : '-'}</td>
            <td className="py-2 px-4 border-b text-center">{row.signal}</td>
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

  const handleAnalysis = async (selectedSymbol) => {
    const searchSymbol = selectedSymbol || symbol;
    if (!searchSymbol) {
      setError('주식 심볼을 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await fetchStockData(searchSymbol);
      if (data.length < 21) {
        setError('데이터가 부족하여 분석할 수 없습니다.');
        setLoading(false);
        return;
      }
      // TR 값과 N 값 계산
      const dataWithTR = calculateTRValues(data);
      setStockData(dataWithTR);
      const n = dataWithTR[dataWithTR.length - 1].n;
      setNValue(n);
      const signalData = calculateSignals(dataWithTR);
      setSignals(signalData);
      setSymbol(searchSymbol); // 검색된 심볼로 업데이트
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 오늘의 고가, 저가, TR 값 가져오기
  const latestData = stockData[stockData.length - 1] || {};

  // 초기화 함수 추가
  const resetAnalysis = () => {
    setSymbol('');
    setStockData([]);
    setNValue(0);
    setSignals([]);
    setError('');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        {/* 왼쪽 상단에 심볼 리스트 추가 */}
        <Stack direction="row" spacing={1}>
          {top10Symbols.map((sym) => (
            <Chip
              key={sym}
              label={sym}
              onClick={() => handleAnalysis(sym)}
              variant="outlined"
            />
          ))}
        </Stack>
        <h1 className="text-2xl font-bold">터틀 트레이딩 주식 분석</h1>
      </div>
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
          onClick={() => handleAnalysis()}
          disabled={loading}
          startIcon={<Search />}
        >
          {loading ? '분석 중...' : '분석'}
        </Button>
        <Button variant="outlined" color="secondary" onClick={resetAnalysis}>
          초기화
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
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold">
              심볼: {symbol.toUpperCase()}
            </h2>
            <h2 className="text-xl font-semibold">
              오늘의 고가: {latestData.high ? latestData.high.toFixed(2) : '-'} | 저가: {latestData.low ? latestData.low.toFixed(2) : '-'}
            </h2>
            <h2 className="text-xl font-semibold">
              오늘의 TR 값: {latestData.tr ? latestData.tr.toFixed(2) : '-'}
            </h2>
            <h2 className="text-xl font-semibold">
              N 값: {nValue ? nValue.toFixed(2) : '-'}
            </h2>
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
              {/* Brush 컴포넌트 추가 */}
              <Brush dataKey="date" height={30} stroke="#8884d8" />
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
