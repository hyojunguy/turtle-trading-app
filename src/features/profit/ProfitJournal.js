import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  IconButton, Autocomplete
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import './styles/profit.css';

const symbolOptions = [
  { code: 'NVDA', name: '엔비디아' },
  { code: 'NVDL', name: '엔비디아 2X Long' },
  { code: 'META', name: '메타' },
  { code: 'HOOD', name: '로빈후드' },
  { code: 'PLTR', name: '팔란티어' },
  { code: 'V', name: '비자' },
  { code: 'NFLX', name: '넷플릭스' },
  { code: 'AAPL', name: '애플' },
  { code: 'MSFT', name: '마이크로소프트' },
  { code: 'GOOGL', name: '알파벳' },
  { code: 'AMZN', name: '아마존' },
  { code: 'TSLA', name: '테슬라' },
  { code: 'TSM', name: 'TSMC' },
  { code: 'AVGO', name: '브로드컴' },
  { code: 'NDAQ', name: '나스닥' },
  { code: 'BRK.B', name: '버크셔 해서웨이' },
  { code: 'JPM', name: 'JP모건' },
  { code: 'JNJ', name: '존슨앤드존슨' },
  { code: 'COIN', name: '코인베이스' },
  { code: 'MSTR', name: '마이크로스트래티지' },
  { code: 'BITX', name: '비트코인 2X Long' },
  { code: 'CONL', name: '코인베이스 2X Long' },
];

const ProfitJournal = () => {
  const [trades, setTrades] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  // 필드명은 백엔드와 일치하도록 snake_case 사용
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    buy_date: '',
    sell_date: '',
    buy_price: '',
    sell_price: '',
    shares: '',
    fee_rate: '0.016', // 입력은 퍼센트 단위가 아닌 원래 값(예: 0.016)
    note: ''
  });

  /**
   * 백엔드 API에서 거래 내역을 불러옵니다.
   */
  const loadTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/profit-journals');
      if (!res.ok) throw new Error('거래 내역 로드 실패');
      const data = await res.json();
      setTrades(data);
      console.log('Loaded trades from API:', data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  /**
   * 새 거래 추가: 입력값 검증 및 수수료, 순손익, 수익률, 상태 계산 후 POST 요청
   */
  const handleAddTrade = async () => {
    const { symbol, buy_date, buy_price, shares } = newTrade;
    if (!symbol || !buy_date || !buy_price || !shares) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    try {
      const buyTotal = parseFloat(buy_price) * parseFloat(shares);
      const sellTotal = newTrade.sell_date && newTrade.sell_price 
        ? parseFloat(newTrade.sell_price) * parseFloat(shares) 
        : 0;
      // fee_rate가 이미 소수형태(예: 0.016)라고 가정
      const feeRate = parseFloat(newTrade.fee_rate);
      const buyFee = buyTotal * feeRate;
      const sellFee = newTrade.sell_date && newTrade.sell_price ? sellTotal * feeRate : 0;
      const totalFees = buyFee + sellFee;
      const netProfit = newTrade.sell_date && newTrade.sell_price 
        ? (sellTotal - buyTotal - totalFees)
        : null;
      const profitRate = netProfit !== null 
        ? parseFloat(((netProfit / buyTotal) * 100).toFixed(2))
        : null;
      
      const status = newTrade.sell_date && newTrade.sell_price ? '완료' : '진행중';

      const payload = {
        symbol: newTrade.symbol,
        buy_date: newTrade.buy_date,
        sell_date: newTrade.sell_date || null,
        buy_price: parseFloat(newTrade.buy_price),
        sell_price: newTrade.sell_date && newTrade.sell_price ? parseFloat(newTrade.sell_price) : null,
        shares: parseFloat(newTrade.shares),
        fee_rate: feeRate,
        note: newTrade.note,
        buy_fee: buyFee,
        sell_fee: sellFee,
        total_fees: totalFees,
        net_profit: netProfit,
        profit: profitRate,
        status
      };

      const res = await fetch('/api/profit-journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('거래 추가 실패');
      const responseData = await res.json();
      console.log('New trade inserted:', responseData);
      await loadTrades();
      setOpenDialog(false);
      setNewTrade({
        symbol: '',
        buy_date: '',
        sell_date: '',
        buy_price: '',
        sell_price: '',
        shares: '',
        fee_rate: '0.016',
        note: ''
      });
    } catch (error) {
      console.error('거래 추가 중 오류:', error);
      alert('거래 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 거래 삭제: 백엔드 DELETE 엔드포인트를 호출합니다.
   * (백엔드에 DELETE /api/profit-journals/{id}가 구현되어 있다고 가정)
   */
  const handleDeleteTrade = async (id) => {
    if (!window.confirm('이 거래 기록을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/profit-journals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      console.log(`Trade ${id} deleted`);
      await loadTrades();
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      alert('거래 삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 완료된 거래 기준 일별 수익률 및 누적 수익률 계산
   */
  const calculateDailyProfits = () => {
    const completedTrades = trades.filter(trade => trade.status === '완료' && trade.sell_date);
    const dailyProfits = {};

    completedTrades.forEach(trade => {
      const date = trade.sell_date;
      if (!dailyProfits[date]) {
        dailyProfits[date] = { date, profit: 0, cumulative: 0 };
      }
      dailyProfits[date].profit += parseFloat(trade.profit);
    });

    const sorted = Object.values(dailyProfits).sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.map((item, index, array) => ({
      ...item,
      cumulative: index > 0 ? array[index - 1].cumulative + item.profit : item.profit
    }));
  };

  /**
   * 엑셀 다운로드: 현재 거래 내역을 XLSX 파일로 저장
   */
  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(trades);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
    XLSX.writeFile(workbook, "profit_journal.xlsx");
  };

  return (
    <div className="profit-journal-container">
      <div className="header-section">
        <h1>수익률 일지</h1>
        <div>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            style={{ marginRight: '10px' }}
          >
            엑셀 다운로드
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            거래 추가
          </Button>
        </div>
      </div>

      {/* 누적 수익률 그래프 */}
      <div className="chart-section">
        <h2>누적 수익률 추이</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={calculateDailyProfits()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="profit" name="일일 수익률" stroke="#82ca9d" />
            <Line type="monotone" dataKey="cumulative" name="누적 수익률" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 기록 테이블 */}
      <TableContainer component={Paper} className="table-section">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>종목</TableCell>
              <TableCell>매수일</TableCell>
              <TableCell>매도일</TableCell>
              <TableCell>매수가</TableCell>
              <TableCell>매도가</TableCell>
              <TableCell>수량</TableCell>
              <TableCell>수수료</TableCell>
              <TableCell>순손익</TableCell>
              <TableCell>수익률</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>메모</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map(trade => (
              <TableRow key={trade.id}>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>{trade.buy_date}</TableCell>
                <TableCell>{trade.sell_date || '-'}</TableCell>
                <TableCell>${trade.buy_price}</TableCell>
                <TableCell>{trade.sell_price !== null ? `$${trade.sell_price}` : '-'}</TableCell>
                <TableCell>{trade.shares}</TableCell>
                <TableCell>${trade.total_fees}</TableCell>
                <TableCell className={trade.net_profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {trade.net_profit !== null ? `$${parseFloat(trade.net_profit).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className={trade.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {trade.profit ? `${trade.profit}%` : '-'}
                </TableCell>
                <TableCell>{trade.status}</TableCell>
                <TableCell>{trade.note}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDeleteTrade(trade.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 거래 추가 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>새 거래 추가</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo
            options={symbolOptions.map(option => `${option.code} - ${option.name}`)}
            value={newTrade.symbol}
            onChange={(event, newValue) => {
              setNewTrade({ ...newTrade, symbol: newValue || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} label="종목 심볼" margin="normal" />
            )}
          />
          <TextField
            label="매수일"
            type="date"
            value={newTrade.buy_date}
            onChange={e => setNewTrade({ ...newTrade, buy_date: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매도일"
            type="date"
            value={newTrade.sell_date}
            onChange={e => setNewTrade({ ...newTrade, sell_date: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매수가 ($)"
            type="number"
            value={newTrade.buy_price}
            onChange={e => setNewTrade({ ...newTrade, buy_price: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="매도가 ($)"
            type="number"
            value={newTrade.sell_price}
            onChange={e => setNewTrade({ ...newTrade, sell_price: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="수량"
            type="number"
            value={newTrade.shares}
            onChange={e => setNewTrade({ ...newTrade, shares: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="수수료율"
            type="number"
            value={newTrade.fee_rate}
            onChange={e => setNewTrade({ ...newTrade, fee_rate: e.target.value })}
            fullWidth
            margin="normal"
            InputProps={{
              inputProps: { min: 0, step: 0.001 }
            }}
            helperText="예: 0.016 (즉, 1.6%)"
          />
          <TextField
            label="메모"
            value={newTrade.note}
            onChange={e => setNewTrade({ ...newTrade, note: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleAddTrade} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProfitJournal;
