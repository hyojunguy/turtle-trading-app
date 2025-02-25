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
  const [openEditDialog, setOpenEditDialog] = useState(false);
  // 거래 추가용 상태
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    buy_date: '',
    sell_date: '',
    buy_price: '',
    sell_price: '',
    shares: '',
    fee_rate: '0.016',
    note: ''
  });
  // 거래 수정용 상태
  const [editingTrade, setEditingTrade] = useState(null);

  /**
   * 백엔드 API에서 거래 내역을 불러옵니다.
   */
  const loadTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/profit-journals');
      if (!res.ok) throw new Error('거래 내역 로드 실패');
      const data = await res.json();
      
      // 매도일 기준으로 정렬 (null 값은 상단에 배치)
      const sortedData = data.sort((a, b) => {
        // 둘 다 매도일이 없으면 매수일로 정렬
        if (!a.sell_date && !b.sell_date) {
          return new Date(b.buy_date) - new Date(a.buy_date);
        }
        // 매도일이 없는 거래를 상단에 배치
        if (!a.sell_date) return -1;
        if (!b.sell_date) return 1;
        // 매도일 기준 내림차순 정렬
        return new Date(b.sell_date) - new Date(a.sell_date);
      });

      setTrades(sortedData);
      console.log('Loaded trades from API:', sortedData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  /**
   * 새 거래 추가: 입력값 검증 및 계산 후 POST 요청
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
      const feeRate = parseFloat(newTrade.fee_rate);
      // 소수점 셋째자리에서 반올림 (0.001 단위)
      const buyFee = parseFloat((buyTotal * feeRate).toFixed(3));
      const sellFee = newTrade.sell_date && newTrade.sell_price 
        ? parseFloat((sellTotal * feeRate).toFixed(3))
        : 0;
      const totalFees = parseFloat((buyFee + sellFee).toFixed(3));
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
   * 거래 삭제: DELETE 요청
   */
  const handleDeleteTrade = async (id, e) => {
    e.stopPropagation();
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
   * 테이블 행 클릭 시 수정 다이얼로그 오픈
   */
  const handleRowClick = (trade) => {
    setEditingTrade(trade);
    setOpenEditDialog(true);
  };

  /**
   * 거래 수정: 수정된 데이터 계산 후 PUT 요청
   */
  const handleEditTrade = async () => {
    if (!editingTrade) return;
    const { id, symbol, buy_date, buy_price, shares } = editingTrade;
    if (!symbol || !buy_date || !buy_price || !shares) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    try {
      const buyTotal = parseFloat(buy_price) * parseFloat(shares);
      const sellTotal = editingTrade.sell_date && editingTrade.sell_price 
        ? parseFloat(editingTrade.sell_price) * parseFloat(shares) 
        : 0;
      const feeRate = parseFloat(editingTrade.fee_rate);
      // 소수점 셋째자리에서 반올림 (0.001 단위)
      const buyFee = parseFloat((buyTotal * feeRate).toFixed(3));
      const sellFee = editingTrade.sell_date && editingTrade.sell_price 
        ? parseFloat((sellTotal * feeRate).toFixed(3))
        : 0;
      const totalFees = parseFloat((buyFee + sellFee).toFixed(3));
      const netProfit = editingTrade.sell_date && editingTrade.sell_price 
        ? (sellTotal - buyTotal - totalFees)
        : null;
      const profitRate = netProfit !== null 
        ? parseFloat(((netProfit / buyTotal) * 100).toFixed(2))
        : null;
      
      const status = editingTrade.sell_date && editingTrade.sell_price ? '완료' : '진행중';

      const payload = {
        symbol: editingTrade.symbol,
        buy_date: editingTrade.buy_date,
        sell_date: editingTrade.sell_date || null,
        buy_price: parseFloat(editingTrade.buy_price),
        sell_price: editingTrade.sell_date && editingTrade.sell_price ? parseFloat(editingTrade.sell_price) : null,
        shares: parseFloat(editingTrade.shares),
        fee_rate: feeRate,
        note: editingTrade.note,
        buy_fee: buyFee,
        sell_fee: sellFee,
        total_fees: totalFees,
        net_profit: netProfit,
        profit: profitRate,
        status
      };

      const res = await fetch(`/api/profit-journals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('거래 수정 실패');
      console.log('Trade updated successfully');
      await loadTrades();
      setOpenEditDialog(false);
      setEditingTrade(null);
    } catch (error) {
      console.error('거래 수정 중 오류:', error);
      alert('거래 수정 중 오류가 발생했습니다.');
    }
  };

  /**
   * 완료된 거래를 바탕으로 "일자별 순손익"과 "누적 순손익"을 계산합니다.
   */
  const calculateDailyNetProfits = () => {
    // sell_date가 있고 status가 '완료'인 거래만 대상
    const completedTrades = trades.filter(
      (trade) => trade.status === '완료' && trade.sell_date && trade.net_profit !== null
    );

    // 날짜별 순손익 합계를 구하기 위한 객체
    const dailyMap = {};

    completedTrades.forEach((trade) => {
      const date = trade.sell_date;
      if (!dailyMap[date]) {
        dailyMap[date] = 0;
      }
      // net_profit이 null이 아닐 때만 더해줌
      dailyMap[date] += parseFloat(trade.net_profit);
    });

    // 날짜 오름차순 정렬
    const sortedDates = Object.keys(dailyMap).sort((a, b) => new Date(a) - new Date(b));

    let cumulative = 0;
    return sortedDates.map((date) => {
      const dailyNetProfit = dailyMap[date];
      cumulative += dailyNetProfit;
      return {
        date,
        dailyNetProfit: parseFloat(dailyNetProfit.toFixed(2)),
        cumulativeNetProfit: parseFloat(cumulative.toFixed(2)),
      };
    });
  };

  /**
   * 엑셀 다운로드: 거래 내역 XLSX 파일 저장
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

      {/* 일단위 누적 순손익 그래프 */}
      <div className="chart-section">
        <h2>일단위 누적 순손익 그래프</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={calculateDailyNetProfits()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* 일자별 순손익 라인 */}
            <Line
              type="monotone"
              dataKey="dailyNetProfit"
              name="일일 순손익"
              stroke="#82ca9d"
            />
            {/* 누적 순손익 라인 */}
            <Line
              type="monotone"
              dataKey="cumulativeNetProfit"
              name="누적 순손익"
              stroke="#8884d8"
            />
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
            {trades.map((trade) => (
              <TableRow
                key={trade.id}
                onClick={() => handleRowClick(trade)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>{trade.buy_date}</TableCell>
                <TableCell>{trade.sell_date || '-'}</TableCell>
                <TableCell>${trade.buy_price}</TableCell>
                <TableCell>
                  {trade.sell_price !== null ? `$${trade.sell_price}` : '-'}
                </TableCell>
                <TableCell>{trade.shares}</TableCell>
                <TableCell>${trade.total_fees}</TableCell>
                <TableCell
                  className={
                    trade.net_profit >= 0 ? 'profit-positive' : 'profit-negative'
                  }
                >
                  {trade.net_profit !== null
                    ? `$${parseFloat(trade.net_profit).toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell
                  className={
                    trade.profit >= 0 ? 'profit-positive' : 'profit-negative'
                  }
                >
                  {trade.profit ? `${trade.profit}%` : '-'}
                </TableCell>
                <TableCell>{trade.status}</TableCell>
                <TableCell>{trade.note}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleDeleteTrade(trade.id, e)}>
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
            options={symbolOptions.map((option) => `${option.code} - ${option.name}`)}
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
            onChange={(e) =>
              setNewTrade({ ...newTrade, buy_date: e.target.value })
            }
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매도일"
            type="date"
            value={newTrade.sell_date}
            onChange={(e) =>
              setNewTrade({ ...newTrade, sell_date: e.target.value })
            }
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매수가 ($)"
            type="number"
            value={newTrade.buy_price}
            onChange={(e) =>
              setNewTrade({ ...newTrade, buy_price: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="매도가 ($)"
            type="number"
            value={newTrade.sell_price}
            onChange={(e) =>
              setNewTrade({ ...newTrade, sell_price: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="수량"
            type="number"
            value={newTrade.shares}
            onChange={(e) =>
              setNewTrade({ ...newTrade, shares: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="수수료율"
            type="number"
            value={newTrade.fee_rate}
            onChange={(e) =>
              setNewTrade({ ...newTrade, fee_rate: e.target.value })
            }
            fullWidth
            margin="normal"
            InputProps={{
              inputProps: { min: 0, step: 0.001 },
            }}
            helperText="예: 0.016 (즉, 1.6%)"
          />
          <TextField
            label="메모"
            value={newTrade.note}
            onChange={(e) =>
              setNewTrade({ ...newTrade, note: e.target.value })
            }
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleAddTrade} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거래 수정 다이얼로그 */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
      >
        <DialogTitle>거래 수정</DialogTitle>
        <DialogContent>
          {editingTrade && (
            <>
              <Autocomplete
                freeSolo
                options={symbolOptions.map(
                  (option) => `${option.code} - ${option.name}`
                )}
                value={editingTrade.symbol}
                onChange={(event, newValue) => {
                  setEditingTrade({
                    ...editingTrade,
                    symbol: newValue || '',
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="종목 심볼" margin="normal" />
                )}
              />
              <TextField
                label="매수일"
                type="date"
                value={editingTrade.buy_date}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    buy_date: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="매도일"
                type="date"
                value={editingTrade.sell_date || ''}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    sell_date: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="매수가 ($)"
                type="number"
                value={editingTrade.buy_price}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    buy_price: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
              />
              <TextField
                label="매도가 ($)"
                type="number"
                value={editingTrade.sell_price || ''}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    sell_price: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
              />
              <TextField
                label="수량"
                type="number"
                value={editingTrade.shares}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    shares: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
              />
              <TextField
                label="수수료율"
                type="number"
                value={editingTrade.fee_rate}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    fee_rate: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{
                  inputProps: { min: 0, step: 0.001 },
                }}
                helperText="예: 0.016 (즉, 1.6%)"
              />
              <TextField
                label="메모"
                value={editingTrade.note || ''}
                onChange={(e) =>
                  setEditingTrade({
                    ...editingTrade,
                    note: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditDialog(false);
              setEditingTrade(null);
            }}
          >
            취소
          </Button>
          <Button onClick={handleEditTrade} variant="contained">
            수정
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProfitJournal;
