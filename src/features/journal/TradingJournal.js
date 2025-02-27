import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Grid,
  Box,
  Paper,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  Stack
} from '@mui/material';
import './styles/journal.css';

const initialRulesMarkdown = `## 나만의 규칙

- **거래 종목**: 유동성, 변동성, 매수, 매도 가능. 거래량 많다. 글로벌 탑 기업 위주
- **트레이딩 자금**: 연간 수익 목표는 80%, 2025년도 2억
- **1회당 거래량**: ATR에서 역산한 1유닛 단위
- **최대 거래량**: 동일 종목 최대 4유닛, 상관관계가 높아지지 않는 범위에서 3종목 최대 12유닛까지
- **진입규칙**: 이동평균선 대순환 분석과 MACD 신호를 바탕으로 진입
- **손절매 규칙**: 진입 지점 반대 ATR×2 지점
- **트레일링 스탑 규칙**: 가격이 1/2N 상승할 때 손절매 라인을 1/2N 만큼 올리고, 평균 매수가를 넘어서면 가격이 1N 상승할 때마다 1/2N씩 끌어올림
- **수익확정 규칙**
- **포지션 추가 규칙**: 가격이 1/2N 상승할 때마다 1유닛 추가 (최대 4유닛)
`;

const defaultSymbols = {
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

const TradingJournal = () => {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);
  const [journalType, setJournalType] = useState('entry');

  const [formData, setFormData] = useState({
    orderDate: '',
    orderTime: '',
    symbolCode: '',
    symbolName: '',
    tradeType: '',
    orderType: '',
    volume: '',
    orderPrice: '',
    executionTime: '',
    executionPrice: '',
    atr: '',
    unitConversion: '',
    entryReason: '',
    fee: '',
    exitReason: '',
    nConversion: '',
    deductedProfitLoss: '',
    rulesMarkdown: initialRulesMarkdown,
  });

  const [editData, setEditData] = useState({
    title: '',
    content: ''
  });

  // 종목 리스트 (기본 + 사용자 추가)
  const [symbols, setSymbols] = useState(defaultSymbols);
  const [openSymbolDialog, setOpenSymbolDialog] = useState(false);
  const [newSymbol, setNewSymbol] = useState({ code: '', name: '' });

  // 컴포넌트 마운트 시 API로부터 일지 데이터 로드
  useEffect(() => {
    fetch("/api/trading-journals")
      .then(response => response.json())
      .then(data => setJournals(data))
      .catch(err => console.error("Error fetching journals:", err));
  }, []);

  // 로컬 스토리지에서 사용자 종목 로드 (종목은 기존 방식 유지)
  useEffect(() => {
    const savedSymbols = localStorage.getItem('customSymbols');
    if (savedSymbols) {
      setSymbols(JSON.parse(savedSymbols));
    }
  }, []);

  const handleJournalClick = (journal) => {
    setSelectedJournal(journal);
    setIsEditing(false);
    setEditingExisting(false);
  };

  const handleNewJournal = () => {
    setSelectedJournal(null);
    setIsEditing(true);
    setEditingExisting(false);
    setJournalType('entry');
    setFormData({
      orderDate: '',
      orderTime: '',
      symbolCode: '',
      symbolName: '',
      tradeType: '',
      orderType: '',
      volume: '',
      orderPrice: '',
      executionTime: '',
      executionPrice: '',
      atr: '',
      unitConversion: '',
      entryReason: '',
      fee: '',
      exitReason: '',
      nConversion: '',
      deductedProfitLoss: '',
      rulesMarkdown: initialRulesMarkdown,
    });
  };

  // 입력 폼 변경 핸들러
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 기존 일지 수정 폼 변경 핸들러
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // 새 종목 추가
  const handleAddSymbol = () => {
    if (newSymbol.code && newSymbol.name) {
      const updatedSymbols = {
        ...symbols,
        [newSymbol.code]: newSymbol.name
      };
      setSymbols(updatedSymbols);
      setNewSymbol({ code: '', name: '' });
      setOpenSymbolDialog(false);
      localStorage.setItem('customSymbols', JSON.stringify(updatedSymbols));
    }
  };

  // 종목 선택 옵션
  const symbolOptions = [
    { code: '+', name: '새 종목 추가' },
    ...Object.entries(symbols).map(([code, name]) => ({
      code,
      name: `${code} - ${name}`
    }))
  ];

  // 종목 선택 핸들러
  const handleSymbolSelect = (event, value) => {
    if (value?.code === '+') {
      setOpenSymbolDialog(true);
      return;
    }
    if (value) {
      setFormData(prev => ({
        ...prev,
        symbolCode: value.code,
        symbolName: symbols[value.code]
      }));
    }
  };

  // 마크다운 내용 생성
  const generateMarkdown = () => {
    if (journalType === 'entry') {
      return `## 진입 기록

- **주문날짜**: ${formData.orderDate}
- **주문 시간**: ${formData.orderTime}
- **종목코드**: ${formData.symbolCode}
- **종목명**: ${formData.symbolName}
- **매매종류**: ${formData.tradeType}
- **주문 종류**: ${formData.orderType}
- **거래량**: ${formData.volume}
- **주문 가격**: ${formData.orderPrice}
- **체결 시간**: ${formData.executionTime}
- **체결 가격**: ${formData.executionPrice}
- **ATR**: ${formData.atr}
- **유닛 환산**: ${formData.unitConversion}
- **진입 이유**: ${formData.entryReason}
`;
    } else if (journalType === 'exit') {
      return `## 청산 기록

- **주문날짜**: ${formData.orderDate}
- **주문 시간**: ${formData.orderTime}
- **종목코드**: ${formData.symbolCode}
- **종목명**: ${formData.symbolName}
- **매매종류**: ${formData.tradeType}
- **주문 종류**: ${formData.orderType}
- **거래량**: ${formData.volume}
- **주문 가격**: ${formData.orderPrice}
- **체결 시간**: ${formData.executionTime}
- **체결 가격**: ${formData.executionPrice}
- **ATR**: ${formData.atr}
- **유닛 환산**: ${formData.unitConversion}
- **수수료**: ${formData.fee}
- **청산 이유**: ${formData.exitReason}
- **N 환산**: ${formData.nConversion}
- **차감 손익**: ${formData.deductedProfitLoss}
`;
    } else if (journalType === 'rules') {
      return formData.rulesMarkdown;
    }
  };

  // 신규 작성 저장 (API POST)
  const handleSave = () => {
    const markdownContent = generateMarkdown();
    const newJournal = {
      type: journalType,
      title:
        journalType === 'entry'
          ? `진입 기록 - ${formData.orderDate}`
          : journalType === 'exit'
          ? `청산 기록 - ${formData.orderDate}`
          : '나만의 규칙',
      content: markdownContent,
    };

    fetch("/api/trading-journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJournal),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to save journal");
        }
        return response.json();
      })
      .then(data => {
        setJournals(prev => [data, ...prev]);
        setSelectedJournal(data);
        setIsEditing(false);
      })
      .catch(error => console.error("Error saving journal:", error));
  };

  // 기존 일지 수정 (API PUT)
  const handleUpdate = () => {
    if (!selectedJournal) return;
    const updatedJournal = {
      type: selectedJournal.type,
      title: editData.title,
      content: editData.content,
    };

    fetch(`/api/trading-journals/${selectedJournal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedJournal),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to update journal");
        }
        return response.json();
      })
      .then(data => {
        const updated = { 
          ...selectedJournal, 
          ...updatedJournal, 
          updated_at: data.updated_at 
        };
        setJournals(prev => prev.map(j => j.id === updated.id ? updated : j));
        setSelectedJournal(updated);
        setIsEditing(false);
        setEditingExisting(false);
      })
      .catch(error => console.error("Error updating journal:", error));
  };

  // 일지 삭제 (API DELETE)
  const handleDelete = () => {
    if (selectedJournal && window.confirm('정말 삭제하시겠습니까?')) {
      fetch(`/api/trading-journals/${selectedJournal.id}`, {
        method: "DELETE",
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to delete journal");
          }
          return response.json();
        })
        .then(() => {
          setJournals(prev => prev.filter(j => j.id !== selectedJournal.id));
          setSelectedJournal(null);
        })
        .catch(error => console.error("Error deleting journal:", error));
    }
  };

  // 기존 일지 수정 모드로 전환
  const handleEditJournal = () => {
    if (selectedJournal) {
      setEditingExisting(true);
      setIsEditing(true);
      setEditData({
        title: selectedJournal.title,
        content: selectedJournal.content,
      });
    }
  };

  return (
    <>
      {/* 상단 AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            트레이딩 일지
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 메인 레이아웃 컨테이너 */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* 왼쪽 사이드바 */}
        <Paper
          elevation={2}
          sx={{
            width: 300,
            p: 2,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            트레이딩 일지 목록
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNewJournal}
            sx={{ mb: 2 }}
          >
            새 일지 작성
          </Button>
          <List sx={{ flex: 1, overflowY: 'auto' }}>
            {journals.map((journal) => (
              <ListItemButton
                key={journal.id}
                onClick={() => handleJournalClick(journal)}
                selected={selectedJournal?.id === journal.id}
              >
                <ListItemText primary={journal.title} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* 오른쪽 메인 컨텐츠 영역 */}
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
          {isEditing ? (
            editingExisting ? (
              // 기존 일지 수정 폼
              <Card>
                <CardHeader title="일지 수정" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="제목"
                        name="title"
                        value={editData.title}
                        onChange={handleEditChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="내용 (마크다운)"
                        name="content"
                        value={editData.content}
                        onChange={handleEditChange}
                        multiline
                        rows={10}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleUpdate}>
                      업데이트
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingExisting(false);
                      }}
                    >
                      취소
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              // 신규 일지 작성 폼
              <Card>
                <CardHeader title="새 일지 작성" />
                <CardContent>
                  <Grid container spacing={2}>
                    {/* 일지 종류 선택 */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        fullWidth
                        label="일지 종류"
                        name="journalType"
                        value={journalType}
                        onChange={(e) => setJournalType(e.target.value)}
                      >
                        <MenuItem value="entry">진입 기록</MenuItem>
                        <MenuItem value="exit">청산 기록</MenuItem>
                        <MenuItem value="rules">나만의 규칙</MenuItem>
                      </TextField>
                    </Grid>

                    {journalType !== 'rules' && (
                      <>
                        {/* 주문날짜 */}
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="주문날짜"
                            type="date"
                            name="orderDate"
                            value={formData.orderDate}
                            onChange={handleFormChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        {/* 주문 시간 */}
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="주문 시간"
                            type="time"
                            name="orderTime"
                            value={formData.orderTime}
                            onChange={handleFormChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        {/* 종목 선택 */}
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            options={symbolOptions}
                            getOptionLabel={(option) => option.name}
                            onChange={handleSymbolSelect}
                            renderInput={(params) => (
                              <TextField {...params} label="종목 선택 또는 추가" fullWidth />
                            )}
                          />
                        </Grid>
                        {/* 매매종류 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            select
                            label="매매종류"
                            name="tradeType"
                            value={formData.tradeType}
                            onChange={handleFormChange}
                          >
                            <MenuItem value="">선택</MenuItem>
                            <MenuItem value="매수">매수</MenuItem>
                            <MenuItem value="매도">매도</MenuItem>
                          </TextField>
                        </Grid>
                        {/* 주문 종류 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            select
                            label="주문 종류"
                            name="orderType"
                            value={formData.orderType}
                            onChange={handleFormChange}
                          >
                            <MenuItem value="">선택</MenuItem>
                            <MenuItem value="지정가">지정가</MenuItem>
                            <MenuItem value="시장가">시장가</MenuItem>
                            <MenuItem value="Stop-limit">Stop-limit</MenuItem>
                          </TextField>
                        </Grid>
                        {/* 거래량 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="거래량"
                            name="volume"
                            value={formData.volume}
                            onChange={handleFormChange}
                          />
                        </Grid>
                        {/* 주문 가격 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="주문 가격"
                            name="orderPrice"
                            value={formData.orderPrice}
                            onChange={handleFormChange}
                          />
                        </Grid>
                        {/* 체결 시간 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="체결 시간"
                            type="time"
                            name="executionTime"
                            value={formData.executionTime}
                            onChange={handleFormChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        {/* 체결 가격 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="체결 가격"
                            name="executionPrice"
                            value={formData.executionPrice}
                            onChange={handleFormChange}
                          />
                        </Grid>
                        {/* ATR */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="ATR"
                            name="atr"
                            value={formData.atr}
                            onChange={handleFormChange}
                          />
                        </Grid>
                        {/* 유닛 환산 */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="유닛 환산"
                            name="unitConversion"
                            value={formData.unitConversion}
                            onChange={handleFormChange}
                          />
                        </Grid>
                        {journalType === 'entry' && (
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="진입 이유"
                              name="entryReason"
                              value={formData.entryReason}
                              onChange={handleFormChange}
                              multiline
                              rows={3}
                            />
                          </Grid>
                        )}
                        {journalType === 'exit' && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="수수료"
                                name="fee"
                                value={formData.fee}
                                onChange={handleFormChange}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="청산 이유"
                                name="exitReason"
                                value={formData.exitReason}
                                onChange={handleFormChange}
                                multiline
                                rows={3}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="N 환산"
                                name="nConversion"
                                value={formData.nConversion}
                                onChange={handleFormChange}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="차감 손익"
                                name="deductedProfitLoss"
                                value={formData.deductedProfitLoss}
                                onChange={handleFormChange}
                              />
                            </Grid>
                          </>
                        )}
                      </>
                    )}
                    {journalType === 'rules' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="나만의 규칙 (마크다운)"
                          name="rulesMarkdown"
                          value={formData.rulesMarkdown}
                          onChange={handleFormChange}
                          multiline
                          rows={10}
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSave}>
                      저장하기
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )
          ) : selectedJournal ? (
            // 일지 보기 모드
            <Card>
              <CardHeader title={selectedJournal.title} />
              <CardContent>
                <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleEditJournal}>
                    수정
                  </Button>
                  <Button variant="outlined" onClick={handleDelete}>
                    삭제
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography>왼쪽에서 일지를 선택하거나 새 일지를 작성해주세요.</Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* 새 종목 추가 다이얼로그 */}
      <Dialog open={openSymbolDialog} onClose={() => setOpenSymbolDialog(false)}>
        <DialogTitle>새 종목 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="종목 코드"
            fullWidth
            value={newSymbol.code}
            onChange={(e) =>
              setNewSymbol(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
          />
          <TextField
            margin="dense"
            label="종목명"
            fullWidth
            value={newSymbol.name}
            onChange={(e) =>
              setNewSymbol(prev => ({ ...prev, name: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSymbolDialog(false)}>취소</Button>
          <Button onClick={handleAddSymbol}>추가</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TradingJournal;
