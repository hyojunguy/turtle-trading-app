import React, { useState, useEffect, useCallback } from 'react';
import initSqlJs from 'sql.js/dist/sql-wasm.js';
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

// 미리 정의된 종목 옵션 (추가 입력도 가능하도록 freeSolo)
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
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    buyDate: '',
    sellDate: '',
    buyPrice: '',
    sellPrice: '',
    shares: '',
    feeRate: '0.016',
    note: ''
  });
  const [db, setDb] = useState(null);

  /**
   * 1) DB 초기화
   */
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Initializing DB...');
        const SQL = await initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        let database;
        const savedDb = localStorage.getItem('profitJournalDb');
        
        if (savedDb) {
          try {
            const uInt8Array = new Uint8Array(JSON.parse(savedDb));
            database = new SQL.Database(uInt8Array);
            console.log('Loaded existing DB from localStorage');
          } catch (error) {
            console.error('저장된 DB 로드 실패:', error);
            database = new SQL.Database();
            console.log('Created a new in-memory DB (existing DB load failed)');
          }
        } else {
          database = new SQL.Database();
          console.log('Created a new in-memory DB (no existing DB)');
        }

        database.run(`CREATE TABLE IF NOT EXISTS trades (
          id INTEGER PRIMARY KEY,
          symbol TEXT,
          buyDate TEXT,
          sellDate TEXT,
          buyPrice REAL,
          sellPrice REAL,
          shares REAL,
          feeRate REAL,
          note TEXT,
          buyFee REAL,
          sellFee REAL,
          totalFees REAL,
          netProfit REAL,
          profit REAL,
          status TEXT
        )`);

        setDb(database);
      } catch (error) {
        console.error('DB 초기화 실패:', error);
      }
    };

    initDb();
  }, []);

  /**
   * 2) DB가 준비되면 한 번만 거래내역 불러오기
   */
  const loadTradesFromDb = useCallback(() => {
    if (!db) return;
    try {
      const res = db.exec("SELECT * FROM trades ORDER BY buyDate DESC");
      if (res.length > 0) {
        const columns = res[0].columns;
        const rows = res[0].values.map(rowValues => {
          const rowObj = {};
          rowValues.forEach((val, index) => {
            rowObj[columns[index]] = val;
          });
          return rowObj;
        });
        setTrades(rows);
        console.log('Loaded trades from DB:', rows);
      } else {
        setTrades([]);
        console.log('No trades found in DB');
      }
    } catch (error) {
      console.error('거래 내역 로드 실패:', error);
    }
  }, [db]);

  useEffect(() => {
    if (db) {
      loadTradesFromDb();
    }
  }, [db, loadTradesFromDb]);

  /**
   * 3) 컴포넌트 언마운트 시 DB를 localStorage에 저장 (db.close()는 제거)
   */
  useEffect(() => {
    return () => {
      if (db) {
        try {
          const data = db.export();
          localStorage.setItem('profitJournalDb', JSON.stringify(Array.from(data)));
          console.log('DB exported to localStorage on unmount');
          // db.close();  // DB를 종료하면 다시 접근이 안 되므로 제거
        } catch (error) {
          console.error('DB cleanup 실패:', error);
        }
      }
    };
  }, [db]);

  /**
   * 4) 새 거래 추가
   *    - 추가 직후 DB export를 하여 곧바로 로컬 스토리지에 반영
   */
  const handleAddTrade = () => {
    if (!newTrade.symbol || !newTrade.buyDate || !newTrade.buyPrice || !newTrade.shares) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      const buyTotal = parseFloat(newTrade.buyPrice) * parseFloat(newTrade.shares);
      const sellTotal = newTrade.sellPrice ? parseFloat(newTrade.sellPrice) * parseFloat(newTrade.shares) : 0;
      const feeRate = parseFloat(newTrade.feeRate) / 100;
      
      const buyFee = buyTotal * feeRate;
      const sellFee = newTrade.sellPrice ? sellTotal * feeRate : 0;
      const totalFees = buyFee + sellFee;

      const netProfit = newTrade.sellPrice 
        ? (sellTotal - buyTotal - totalFees)
        : null;
      const profitRate = netProfit 
        ? ((netProfit / buyTotal) * 100).toFixed(2)
        : null;

      if (db) {
        const stmt = db.prepare(`
          INSERT INTO trades (
            id, symbol, buyDate, sellDate, buyPrice, sellPrice, 
            shares, feeRate, note, buyFee, sellFee, totalFees, 
            netProfit, profit, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          Date.now(),
          newTrade.symbol,
          newTrade.buyDate,
          newTrade.sellDate || null,
          parseFloat(newTrade.buyPrice),
          newTrade.sellPrice ? parseFloat(newTrade.sellPrice) : null,
          parseFloat(newTrade.shares),
          parseFloat(newTrade.feeRate),
          newTrade.note,
          buyFee,
          sellFee,
          totalFees,
          netProfit,
          profitRate,
          newTrade.sellPrice ? '완료' : '진행중'
        ]);
        stmt.free();

        // 여기서 바로 localStorage에 export
        const data = db.export();
        localStorage.setItem('profitJournalDb', JSON.stringify(Array.from(data)));
        console.log('New trade inserted and DB exported to localStorage');

        loadTradesFromDb(); // 테이블 갱신
        setOpenDialog(false);
        setNewTrade({
          symbol: '',
          buyDate: '',
          sellDate: '',
          buyPrice: '',
          sellPrice: '',
          shares: '',
          feeRate: '0.016',
          note: ''
        });
      }
    } catch (error) {
      console.error('거래 추가 실패:', error);
      alert('거래 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 5) 거래 삭제
   *    - 삭제 후 DB export
   */
  const handleDeleteTrade = (id) => {
    if (!window.confirm('이 거래 기록을 삭제하시겠습니까?')) return;
    if (db) {
      try {
        db.run("DELETE FROM trades WHERE id = ?", [id]);
        // 삭제 후 export
        const data = db.export();
        localStorage.setItem('profitJournalDb', JSON.stringify(Array.from(data)));
        console.log(`Trade ${id} deleted and DB exported to localStorage`);
        loadTradesFromDb();
      } catch (error) {
        console.error('거래 삭제 실패:', error);
      }
    }
  };

  /**
   * 6) 일별 수익률 계산 (완료된 거래 기준)
   */
  const calculateDailyProfits = () => {
    const completedTrades = trades.filter(trade => trade.status === '완료' && trade.sellDate);
    const dailyProfits = {};

    completedTrades.forEach(trade => {
      const date = trade.sellDate;
      if (!dailyProfits[date]) {
        dailyProfits[date] = {
          date,
          profit: 0,
          cumulative: 0
        };
      }
      dailyProfits[date].profit += parseFloat(trade.profit);
    });

    // 날짜순 정렬 및 누적 수익률 계산
    const sorted = Object.values(dailyProfits)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return sorted.map((item, index, array) => ({
      ...item,
      cumulative: index > 0 
        ? array[index - 1].cumulative + item.profit 
        : item.profit
    }));
  };

  /**
   * 7) 엑셀 다운로드
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

      {/* 수익률 그래프 */}
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
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>{trade.buyDate}</TableCell>
                <TableCell>{trade.sellDate}</TableCell>
                <TableCell>${trade.buyPrice}</TableCell>
                <TableCell>${trade.sellPrice}</TableCell>
                <TableCell>{trade.shares}</TableCell>
                <TableCell>${trade.totalFees}</TableCell>
                <TableCell
                  className={trade.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}
                >
                  {trade.netProfit !== null ? `$${trade.netProfit.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell
                  className={trade.profit >= 0 ? 'profit-positive' : 'profit-negative'}
                >
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
          {/* Autocomplete로 종목 옵션 선택 (freeSolo로 자유 입력 허용) */}
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
            value={newTrade.buyDate}
            onChange={(e) => setNewTrade({ ...newTrade, buyDate: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매도일"
            type="date"
            value={newTrade.sellDate}
            onChange={(e) => setNewTrade({ ...newTrade, sellDate: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="매수가 ($)"
            type="number"
            value={newTrade.buyPrice}
            onChange={(e) => setNewTrade({ ...newTrade, buyPrice: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="매도가 ($)"
            type="number"
            value={newTrade.sellPrice}
            onChange={(e) => setNewTrade({ ...newTrade, sellPrice: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="수량"
            type="number"
            value={newTrade.shares}
            onChange={(e) => setNewTrade({ ...newTrade, shares: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="수수료율 (%)"
            type="number"
            value={newTrade.feeRate}
            onChange={(e) => setNewTrade({ ...newTrade, feeRate: e.target.value })}
            fullWidth
            margin="normal"
            InputProps={{
              inputProps: { 
                min: 0,
                step: 0.001
              }
            }}
            helperText="기본값: 0.016% (즉 0.00016)"
          />
          <TextField
            label="메모"
            value={newTrade.note}
            onChange={(e) => setNewTrade({ ...newTrade, note: e.target.value })}
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
