import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush,
} from 'recharts';
import { Alert, AlertTitle, Button, TextField, CircularProgress, Chip, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import './styles/turtle.css';

// 기업 심볼 리스트
const top10Symbols = ['NVDA', 'NVDL', 'META', 'HOOD', 'PLTR', 'V', 'NFLX', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'TSM', 'AVGO', 'NDAQ', 'BRK.B', 'JPM', 'JNJ', 'COIN', 'MSTR', 'CONL', 'BITX'];

// 기업 심볼과 한글 이름 매핑
const symbolNames = {
  NVDA: '엔비디아',
  NVDL: '엔비디아 2X Long',
  META: '메타',
  HOOD: '로빈후드',
  PLTR: '팔란티어',
  V: '비자',
  NFLX: '넷플릭스',
  AAPL: '애플',
  MSFT: '마이크로소프트',
  GOOGL: '알파벳',
  AMZN: '아마존',
  TSLA: '테슬라',
  TSM: 'TSMC',
  AVGO: '브로드컴',
  NDAQ: '나스닥',
  'BRK.B': '버크셔 해서웨이',
  JPM: 'JP모건',
  JNJ: '존슨앤드존슨',
  COIN: '코인베이스',
  MSTR: '마이크로스트래티지',
  BITX: '비트코인 2X Long',
  CONL: '코인베이스 2X Long',
};

/**
 * 주식 데이터를 가져오고 캐싱하는 함수
 */
const fetchStockData = async (symbol) => {
  const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
  // 캐시된 데이터 확인
  const cachedData = localStorage.getItem(`stockData_${symbol}`);
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    const cachedDate = parsedData.date;
    const today = new Date().toISOString().split('T')[0];
    if (cachedDate === today) {
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
      date: new Date().toISOString().split('T')[0],
      data: sortedData,
    };
    localStorage.setItem(`stockData_${symbol}`, JSON.stringify(cacheEntry));
    return sortedData;
  } catch (error) {
    console.error(error);
    throw new Error('데이터를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * TR 값과 ATR 값을 계산하는 함수
 */
const calculateTRValues = (data) => {
  const period = 20; // ATR 계산에 사용할 기간 (20일)
  const results = [];
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    let tr = 0;
    // 첫 날: 단순히 고가 - 저가
    if (i === 0) {
      tr = current.high - current.low;
      results.push({ ...current, tr, atr: null });
      continue;
    }
    const previous = data[i - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);
    tr = Math.max(highLow, highClose, lowClose);
    if (i < period - 1) {
      results.push({ ...current, tr, atr: null });
    } else if (i === period - 1) {
      let sumTR = tr;
      for (let j = 0; j < period - 1; j++) {
        sumTR += results[j].tr;
      }
      const firstATR = sumTR / period;
      results.push({ ...current, tr, atr: firstATR });
    } else {
      const prevATR = results[i - 1].atr;
      const newATR = ((prevATR * 19) + (tr * 2)) / 21;
      results.push({ ...current, tr, atr: newATR });
    }
  }
  return results;
};

/**
 * 매매 신호 및 전문가용 열(20일 최고가, 20일 최저가, 손절가)을 계산하는 함수
 */
const calculateSignals = (data) => {
  const signals = data.map((current, index) => {
    if (index < 20) {
      return { ...current, signal: 'HOLD', highest20: null, lowest20: null, stopLoss: null };
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
    // 손절가 계산: 종가 - 2×ATR
    const stopLoss = current.atr != null ? current.close - 2 * current.atr : null;
    return { ...current, signal, highest20: highestHigh, lowest20: lowestLow, stopLoss };
  });
  return signals;
};

/**
 * 이동평균 계산 함수
 */
const calculateMA = (data, period) => {
  return data.map((item, index) => {
    if (index < period - 1) return null;
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, curr) => acc + curr.close, 0);
    return sum / period;
  });
};

/**
 * 커스텀 테이블 컴포넌트 (전문가용 열 추가)
 */
const CustomTable = ({ data }) => {
  // 백분율 계산 함수
  const calculatePercentage = (value, close) => {
    if (!value || !close) return null;
    return ((value / close) * 100).toFixed(1);
  };

  // 전일 대비 변동률 계산 함수
  const calculatePriceChange = (current, previous) => {
    if (!previous) return null;
    return (((current - previous) / previous) * 100).toFixed(2);
  };

  // 방향 이모지 선택 함수
  const getDirectionEmoji = (change) => {
    if (!change) return '';
    return change > 0 
      ? <span style={{ color: '#e53935' }}>▲</span>  // 상승
      : change < 0 
        ? <span style={{ color: '#1e88e5' }}>▼</span>  // 하락
        : ''; // 변동 없음
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-center">날짜</th>
            <th className="py-2 px-4 border-b text-center">고가</th>
            <th className="py-2 px-4 border-b text-center">저가</th>
            <th className="py-2 px-4 border-b text-center">종가 (전일대비)</th>
            <th className="py-2 px-4 border-b text-center">TR (종가대비)</th>
            <th className="py-2 px-4 border-b text-center">ATR (종가대비)</th>
            <th className="py-2 px-4 border-b text-center">신호</th>
            <th className="py-2 px-4 border-b text-center">20일 최고가</th>
            <th className="py-2 px-4 border-b text-center">20일 최저가</th>
            <th className="py-2 px-4 border-b text-center">손절가 (종가-2N)</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 60).map((row, index) => {
            // 역순 정렬된 데이터에서 전일 종가는 다음 인덱스 값
            const previousClose = data[index + 1]?.close;
            const priceChange = calculatePriceChange(row.close, previousClose);
            const directionEmoji = getDirectionEmoji(priceChange);
            const trPercentage = calculatePercentage(row.tr, row.close);
            const atrPercentage = calculatePercentage(row.atr, row.close);
            return (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 border-b text-center">{row.date}</td>
                <td className="py-2 px-4 border-b text-center">{row.high.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center">{row.low.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center">
                  {row.close.toFixed(2)}
                  {priceChange && (
                    <span style={{ marginLeft: '4px' }}>
                      {directionEmoji} ({priceChange}%)
                    </span>
                  )}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {row.tr ? `${row.tr.toFixed(2)} (${trPercentage}%)` : '-'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {row.atr ? `${row.atr.toFixed(2)} (${atrPercentage}%)` : '-'}
                </td>
                <td className="py-2 px-4 border-b text-center">{row.signal}</td>
                <td className="py-2 px-4 border-b text-center">{row.highest20 ? row.highest20.toFixed(2) : '-'}</td>
                <td className="py-2 px-4 border-b text-center">{row.lowest20 ? row.lowest20.toFixed(2) : '-'}</td>
                <td className="py-2 px-4 border-b text-center">{row.stopLoss ? row.stopLoss.toFixed(2) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * 우측 설명 패널 컴포넌트
 */
const ExplanationPanel = ({ explanationTopic, setExplanationTopic }) => {
  let explanationText = '';
  if (explanationTopic === 'TR') {
    explanationText = `TR (True Range)는 가격의 변동폭을 측정하는 지표입니다.
    
TR = MAX(
  현재 고가 - 현재 저가,
  |현재 고가 - 이전 종가|,
  |현재 저가 - 이전 종가|
)

실제 가격 변동을 반영하기 위해 갭도 고려합니다.`;
  } else if (explanationTopic === 'N') {
    explanationText = `N값(ATR)은 TR의 지수이동평균(EMA)으로 계산됩니다.
    
1. 첫 20일: 데이터 수집
2. 20일째: TR 단순평균으로 첫 ATR 계산
3. 21일 이후: Wilder's Smoothing 공식 사용
   ATR = ((이전 ATR × 19) + (현재 TR × 2)) ÷ 21

변동성을 부드럽게 반영합니다.`;
  } else if (explanationTopic === '신호') {
    explanationText = `매매 신호는 20일 기준 돌파 전략을 사용합니다.

1. BUY 신호: 현재 종가가 지난 20일 최고가를 상향 돌파
2. SELL 신호: 현재 종가가 지난 20일 최저가를 하향 돌파
3. HOLD 신호: 위 조건 미충족

추가로 전문가용 열로 20일 최고/최저가와 손절가(종가-2N)를 제공합니다.`;
  } else if (explanationTopic === '심볼') {
    explanationText = '주식 심볼은 각 기업을 식별하기 위한 고유 코드입니다. 예: AAPL은 애플의 심볼입니다.';
  }
  return (
    <div className="p-4 border border-gray-300 rounded shadow-sm">
      <h2 className="text-lg font-bold mb-2">설명</h2>
      <Stack direction="row" spacing={1} className="mb-2">
        <Chip
          label="TR"
          clickable
          color={explanationTopic === 'TR' ? 'primary' : 'default'}
          onClick={() => setExplanationTopic('TR')}
        />
        <Chip
          label="N (ATR)"
          clickable
          color={explanationTopic === 'N' ? 'primary' : 'default'}
          onClick={() => setExplanationTopic('N')}
        />
        <Chip
          label="신호"
          clickable
          color={explanationTopic === '신호' ? 'primary' : 'default'}
          onClick={() => setExplanationTopic('신호')}
        />
        <Chip
          label="심볼"
          clickable
          color={explanationTopic === '심볼' ? 'primary' : 'default'}
          onClick={() => setExplanationTopic('심볼')}
        />
      </Stack>
      <p className="text-sm whitespace-pre-line">{explanationText}</p>
    </div>
  );
};

// 한국어 금액 읽기 함수 추가
const readKoreanAmount = (amount) => {
  if (!amount) return '';
  
  const units = ['', '만', '억', '조'];
  const numbers = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  
  // 숫자를 문자열로 변환하고 4자리씩 나누기
  const amountStr = Math.floor(amount).toString();
  const groups = [];
  for (let i = amountStr.length; i > 0; i -= 4) {
    groups.unshift(amountStr.slice(Math.max(0, i - 4), i));
  }
  
  let result = '';
  groups.forEach((group, index) => {
    const groupNum = parseInt(group);
    if (groupNum === 0) return;
    
    let groupStr = '';
    if (group.length === 4) {
      // 천 자리
      if (group[0] !== '0') {
        groupStr += numbers[group[0]] + '천';
      }
      // 백 자리
      if (group[1] !== '0') {
        groupStr += numbers[group[1]] + '백';
      }
      // 십 자리
      if (group[2] !== '0') {
        groupStr += numbers[group[2]] + '십';
      }
      // 일 자리
      if (group[3] !== '0') {
        groupStr += numbers[group[3]];
      }
    } else {
      // 4자리 미만인 경우
      for (let i = 0; i < group.length; i++) {
        if (group[i] !== '0') {
          groupStr += numbers[group[i]] + ['천', '백', '십', ''][3 - (group.length - 1) + i];
        }
      }
    }
    
    result += groupStr + units[groups.length - 1 - index];
  });
  
  return result;
};

/**
 * 메인 애플리케이션 컴포넌트
 */
const TurtleTradingApp = () => {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState([]);
  const [atrValue, setAtrValue] = useState(0);
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanationTopic, setExplanationTopic] = useState('TR');

  // 수익률 계산기 state
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [shares, setShares] = useState('');
  const [feeRate, setFeeRate] = useState('0.016');
  const [exchangeRate, setExchangeRate] = useState('1450');
  const [profitResult, setProfitResult] = useState(null);

  // 새로운 state 추가
  const [tradingCapital, setTradingCapital] = useState(localStorage.getItem('tradingCapital') || '');
  const [tradingCapitalKRW, setTradingCapitalKRW] = useState('');

  // 새로운 state 추가
  const [entryBasePrice, setEntryBasePrice] = useState('');

  /**
   * 분석 요청 및 데이터 처리 함수
   */
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
      
      // TR과 ATR 계산
      const dataWithTR = calculateTRValues(data);
      
      // 이동평균 계산 (5, 20, 40일)
      const ma5 = calculateMA(dataWithTR, 5);
      const ma20 = calculateMA(dataWithTR, 20);
      const ma40 = calculateMA(dataWithTR, 40);
      
      // 이동평균 추가
      const dataWithMA = dataWithTR.map((item, index) => ({
        ...item,
        ma5: ma5[index],
        ma20: ma20[index],
        ma40: ma40[index],
      }));
      
      // 최신 ATR 저장
      const atr = dataWithMA[dataWithMA.length - 1].atr;
      setAtrValue(atr);
      
      // 매매 신호 및 전문가용 열 계산
      const signalData = calculateSignals(dataWithMA);
      
      // 최신 데이터가 위로 오도록 역순 정렬
      const reversedData = [...signalData].reverse();
      
      setStockData(dataWithMA);
      setSignals(reversedData);
      setSymbol(searchSymbol);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const latestData = stockData[stockData.length - 1] || {};

  // 초기화 함수
  const resetAnalysis = () => {
    setSymbol('');
    setStockData([]);
    setAtrValue(0);
    setSignals([]);
    setError('');
  };

  // 수익률 계산 함수
  const calculateProfit = () => {
    if (!buyPrice || !sellPrice || !shares || !feeRate || !exchangeRate) {
      alert('모든 값을 입력해주세요.');
      return;
    }
    const buyTotal = parseFloat(buyPrice) * parseFloat(shares);
    const sellTotal = parseFloat(sellPrice) * parseFloat(shares);
    const feeRateDecimal = parseFloat(feeRate) / 100;
    const buyFee = buyTotal * feeRateDecimal;
    const sellFee = sellTotal * feeRateDecimal;
    const netProfitUSD = sellTotal - buyTotal - buyFee - sellFee;
    const profitRate = (netProfitUSD / buyTotal) * 100;
    const netProfitKRW = netProfitUSD * parseFloat(exchangeRate);
    setProfitResult({
      profitRate: profitRate.toFixed(2),
      netProfitUSD: netProfitUSD.toFixed(2),
      netProfitKRW: netProfitKRW.toFixed(0),
      totalInvestmentUSD: buyTotal.toFixed(2),
      totalFeesUSD: (buyFee + sellFee).toFixed(2)
    });
  };

  const calculateTurtleUnit = (capital, price, atr, basePrice) => {
    // 입력값 유효성 검사
    if (!capital || !price || !atr || 
        isNaN(capital) || isNaN(price) || isNaN(atr) ||
        capital <= 0 || price <= 0 || atr <= 0) {
      return null;
    }
    
    const onePercent = capital * 0.01;
    const riskPerShare = 2 * atr; // 각 주식의 위험 금액 (손절폭)
    const unitSize = Math.floor(onePercent / riskPerShare); // 거래 가능한 유닛 수
  
    // 기준 가격 설정 (입력된 basePrice 또는 현재가 사용)
    const calculationBase = basePrice ? parseFloat(basePrice) : price;
    
    // 최대 4유닛까지 진입 가격 계산 (1/2N 간격)
    const entryPrices = Array.from({ length: 4 }, (_, i) => {
      const entryPrice = calculationBase + (i * atr * 0.5);
      return {
        unit: i + 1,
        price: entryPrice.toFixed(2),
        stopLoss: (entryPrice - riskPerShare).toFixed(2)  // 손절가는 entryPrice에서 2×ATR만큼 낮게
      };
    });
  
    return {
      onePercent: onePercent.toLocaleString(),
      riskPerShare: riskPerShare.toFixed(2),
      unit: unitSize,
      entryPrices,
      atr: atr.toFixed(2)
    };
  };
  

  // 자금 입력 처리 함수들 수정
  const handleCapitalChange = (e) => {
    const value = e.target.value;
    setTradingCapital(value);
    // 달러 입력 시 원화 자동 계산
    if (value && exchangeRate) {
      const krwValue = (parseFloat(value) * parseFloat(exchangeRate)).toFixed(0);
      setTradingCapitalKRW(krwValue);
    } else {
      setTradingCapitalKRW('');
    }
    localStorage.setItem('tradingCapital', value);
  };

  const handleCapitalKRWChange = (e) => {
    const value = e.target.value;
    setTradingCapitalKRW(value);
    // 원화 입력 시 달러 자동 계산
    if (value && exchangeRate) {
      const usdValue = (parseFloat(value) / parseFloat(exchangeRate)).toFixed(2);
      setTradingCapital(usdValue);
      localStorage.setItem('tradingCapital', usdValue);
    } else {
      setTradingCapital('');
    }
  };

  // 환율 변경 시 자동 재계산
  const handleExchangeRateChange = (e) => {
    const newRate = e.target.value;
    setExchangeRate(newRate);
    
    // 달러 값이 있으면 원화 재계산
    if (tradingCapital && newRate) {
      const krwValue = (parseFloat(tradingCapital) * parseFloat(newRate)).toFixed(0);
      setTradingCapitalKRW(krwValue);
    }
  };

  return (
    <div className="turtle-trading-container">
      {/* 상단바 */}
      <header className="top-bar">
        <h1>트레이딩 앱</h1>
      </header>

      {/* 3열 레이아웃 */}
      <div className="app-container">
        {/* 왼쪽 패널: 기업 심볼 리스트 */}
        <div className="left-panel">
          <div className="symbol-list-panel">
            <h2 className="text-lg font-bold mb-2">기업 목록</h2>
            <ul>
              {top10Symbols.map((sym) => (
                <li key={sym} className="mb-2">
                  <Chip
                    label={`${sym} - ${symbolNames[sym]}`}
                    onClick={() => handleAnalysis(sym)}
                    variant="outlined"
                    clickable
                    className="chip-item"
                    color={symbol && symbol.toUpperCase() === sym ? "primary" : "default"}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 중앙 패널: 분석 UI */}
        <div className="center-panel">
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
              <div className="mb-4">
                {/* 트레이딩 자금 입력 필드 */}
                <div className="trading-capital-input mb-2">
                  <div className="trading-capital-fields">
                    <TextField
                      label="트레이딩 자금 ($)"
                      type="number"
                      value={tradingCapital}
                      onChange={handleCapitalChange}
                      variant="outlined"
                      size="small"
                      style={{ width: '200px', marginRight: '10px' }}
                    />
                    <TextField
                      label="트레이딩 자금 (₩)"
                      type="number"
                      value={tradingCapitalKRW}
                      onChange={handleCapitalKRWChange}
                      variant="outlined"
                      size="small"
                      style={{ width: '200px' }}
                      helperText={tradingCapitalKRW ? readKoreanAmount(tradingCapitalKRW) : ''}
                    />
                  </div>
                  <TextField
                    label="환율 (원/달러)"
                    type="number"
                    value={exchangeRate}
                    onChange={handleExchangeRateChange}
                    variant="outlined"
                    size="small"
                    style={{ width: '150px', marginTop: '10px' }}
                  />
                </div>
                
                <div className="analysis-summary text-center">
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
                    ATR 값: {atrValue ? atrValue.toFixed(2) : '-'}
                  </h2>
                  
                  {/* 터틀 유닛 계산 결과 */}
                  {tradingCapital && latestData.close && atrValue && (
                    <div className="turtle-unit-info mt-2 p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">터틀 유닛 계산</h3>
                      {(() => {
                        const unitInfo = calculateTurtleUnit(
                          parseFloat(tradingCapital),
                          latestData.close,
                          atrValue,
                          entryBasePrice
                        );
                        
                        if (!unitInfo) {
                          return <p>유효한 값을 입력해주세요.</p>;
                        }

                        const krwAmount = (parseFloat(tradingCapital) * parseFloat(exchangeRate)).toFixed(0);
                        const koreanReading = readKoreanAmount(krwAmount);

                        return (
                          <>
                            <p>자금의 1%: ${unitInfo.onePercent}</p>
                            <p>트레이딩 자금: ${Number(tradingCapital).toLocaleString()} (₩{Number(krwAmount).toLocaleString()} - {koreanReading})</p>
                            <p>거래단위×ATR: ${unitInfo.tradeUnit}</p>
                            <p className="text-lg font-bold text-blue-600">
                              적정 유닛: {unitInfo.unit}개
                            </p>
                            
                            {/* 진입 가격 테이블 */}
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">진입 가격 계산</h4>
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  기준가격 입력 (현재 종가: ${latestData.close.toFixed(2)})
                                </label>
                                <input
                                  type="number"
                                  value={entryBasePrice}
                                  onChange={(e) => setEntryBasePrice(e.target.value)}
                                  placeholder={`${latestData.close.toFixed(2)}`}
                                  className="border rounded px-3 py-2 w-40"
                                />
                              </div>
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr>
                                    <th className="border p-2">유닛</th>
                                    <th className="border p-2">진입가격</th>
                                    <th className="border p-2">손절가</th>
                                    <th className="border p-2">손실률</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {unitInfo.entryPrices.map(entry => {
                                    const lossRate = ((entry.stopLoss - entry.price) / entry.price * 100).toFixed(2);
                                    return (
                                      <tr key={entry.unit}>
                                        <td className="border p-2">{entry.unit}유닛</td>
                                        <td className="border p-2">${entry.price}</td>
                                        <td className="border p-2">${entry.stopLoss}</td>
                                        <td className="border p-2 text-red-600">{lossRate}%</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <p className="text-sm text-gray-600 mt-2">
                                * ATR(N): ${unitInfo.atr}
                              </p>
                              <p className="text-sm text-gray-600">
                                * 각 유닛은 이전 진입가에서 1/2N 상승 시 추가
                              </p>
                            </div>

                            {/* 트레일링 스탑 규칙 */}
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">트레일링 스탑 규칙</h4>
                              <ul className="text-sm text-gray-600 list-disc pl-5">
                                <li>가격이 1/2N 상승 시마다 손절가를 1/2N 상향</li>
                                <li>평균 매수가 초과 시 1N 상승마다 1/2N 상향</li>
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
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
                  <Line type="monotone" dataKey="ma5" stroke="#9c27b0" name="5일 이동평균" dot={false} />
                  <Line type="monotone" dataKey="ma20" stroke="#f44336" name="20일 이동평균" dot={false} />
                  <Line type="monotone" dataKey="ma40" stroke="#2196f3" name="40일 이동평균" dot={false} />
                  <Brush dataKey="date" height={30} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">매매 신호</h2>
                <CustomTable data={signals} />
              </div>
            </>
          )}
        </div>

        {/* 오른쪽 패널: 설명 패널 및 수익률 계산기 */}
        <div className="right-panel">
          <ExplanationPanel 
            explanationTopic={explanationTopic} 
            setExplanationTopic={setExplanationTopic} 
          />
          <div className="profit-calculator-card mt-4">
            <div className="profit-calculator-header">
              <h2>수익률 계산기</h2>
              <p>매매 수수료와 환율을 포함한 실제 수익 계산</p>
            </div>
            <div className="calculator-content">
              <div className="input-section">
                <table className="input-table">
                  <tbody>
                    <tr>
                      <td><label>매수가 ($)</label></td>
                      <td>
                        <input
                          type="number"
                          value={buyPrice}
                          onChange={(e) => setBuyPrice(e.target.value)}
                          placeholder="0.00"
                          className="input-field"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td><label>매도가 ($)</label></td>
                      <td>
                        <input
                          type="number"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          placeholder="0.00"
                          className="input-field"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td><label>주식수</label></td>
                      <td>
                        <input
                          type="number"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          placeholder="0"
                          className="input-field"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td><label>수수료율 (%)</label></td>
                      <td>
                        <input
                          type="number"
                          value={feeRate}
                          onChange={(e) => setFeeRate(e.target.value)}
                          placeholder="0.016"
                          step="0.001"
                          className="input-field"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td><label>환율 (원/달러)</label></td>
                      <td>
                        <input
                          type="number"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value)}
                          placeholder="1450"
                          className="input-field"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button className="calculate-button" onClick={calculateProfit}>
                  계산하기
                </button>
              </div>
              {profitResult && (
                <div className="result-section">
                  <div className="result-card profit-rate">
                    <h3>예상 수익률</h3>
                    <p className={profitResult.profitRate >= 0 ? 'positive' : 'negative'}>
                      {profitResult.profitRate}%
                    </p>
                  </div>
                  <div className="result-card net-profit">
                    <h3>순수익</h3>
                    <p className={profitResult.netProfitUSD >= 0 ? 'positive' : 'negative'}>
                      ${profitResult.netProfitUSD}
                    </p>
                    <p className={profitResult.netProfitKRW >= 0 ? 'positive' : 'negative'}>
                      ₩{Number(profitResult.netProfitKRW).toLocaleString()}
                    </p>
                  </div>
                  <div className="result-card investment">
                    <h3>투자 상세</h3>
                    <div className="detail-row">
                      <span>총 투자금:</span>
                      <span>${profitResult.totalInvestmentUSD}</span>
                    </div>
                    <div className="detail-row">
                      <span>총 수수료:</span>
                      <span>${profitResult.totalFeesUSD}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurtleTradingApp;
