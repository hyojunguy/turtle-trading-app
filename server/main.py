from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
from datetime import datetime
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # get_db() 대신 직접 연결을 생성하여 사용합니다.
    db = sqlite3.connect('trading.db', check_same_thread=False)
    init_db(db)
    yield
    db.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect('trading.db', check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()

def init_db(db: sqlite3.Connection):
    c = db.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS trading_journals (
        id INTEGER PRIMARY KEY,
        type TEXT,
        title TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT
    )''')
    c.execute('''
    CREATE TABLE IF NOT EXISTS profit_journals (
        id INTEGER PRIMARY KEY,
        symbol TEXT,
        buy_date TEXT,
        sell_date TEXT,
        buy_price REAL,
        sell_price REAL,
        shares REAL,
        fee_rate REAL,
        note TEXT,
        buy_fee REAL,
        sell_fee REAL,
        total_fees REAL,
        net_profit REAL,
        profit REAL,
        status TEXT
    )''')
    db.commit()

class TradingJournal(BaseModel):
    id: Optional[int] = None
    type: str
    title: str
    content: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ProfitJournal(BaseModel):
    id: Optional[int] = None
    symbol: str
    buy_date: str
    sell_date: Optional[str] = None
    buy_price: float
    sell_price: Optional[float] = None
    shares: float
    fee_rate: float
    note: Optional[str] = None
    buy_fee: Optional[float] = None
    sell_fee: Optional[float] = None
    total_fees: Optional[float] = None
    net_profit: Optional[float] = None
    profit: Optional[float] = None
    status: str

@app.get("/api/trading-journals")
def get_trading_journals(db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM trading_journals ORDER BY created_at DESC")
    journals = c.fetchall()
    return [dict(zip(['id', 'type', 'title', 'content', 'created_at', 'updated_at'], journal)) 
            for journal in journals]

@app.post("/api/trading-journals")
def create_trading_journal(journal: TradingJournal, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    now = datetime.now().isoformat()
    c.execute("""
    INSERT INTO trading_journals (type, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    """, (journal.type, journal.title, journal.content, now, now))
    journal_id = c.lastrowid
    db.commit()
    return {**journal.model_dump(), "id": journal_id, "created_at": now, "updated_at": now}

@app.delete("/api/trading-journals/{journal_id}")
def delete_trading_journal(journal_id: int, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("DELETE FROM trading_journals WHERE id=?", (journal_id,))
    db.commit()
    return {"message": "Trading journal deleted"}

@app.put("/api/trading-journals/{journal_id}")
def update_trading_journal(journal_id: int, journal: TradingJournal, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    now = datetime.now().isoformat()
    c.execute("""
        UPDATE trading_journals
        SET type = ?, title = ?, content = ?, updated_at = ?
        WHERE id = ?
    """, (journal.type, journal.title, journal.content, now, journal_id))
    db.commit()
    return {"message": "Trading journal updated", "updated_at": now}


@app.get("/api/profit-journals")
def get_profit_journals(db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM profit_journals ORDER BY buy_date DESC")
    journals = c.fetchall()
    columns = ['id', 'symbol', 'buy_date', 'sell_date', 'buy_price', 'sell_price', 
               'shares', 'fee_rate', 'note', 'buy_fee', 'sell_fee', 'total_fees',
               'net_profit', 'profit', 'status']
    return [dict(zip(columns, journal)) for journal in journals]

@app.post("/api/profit-journals")
def create_profit_journal(journal: ProfitJournal, db: sqlite3.Connection = Depends(get_db)):
    print(f"Received journal data: {journal.model_dump()}")
    c = db.cursor()
    c.execute("""
    INSERT INTO profit_journals (
        symbol, buy_date, sell_date, buy_price, sell_price, shares,
        fee_rate, note, buy_fee, sell_fee, total_fees, net_profit,
        profit, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        journal.symbol, journal.buy_date, journal.sell_date, journal.buy_price,
        journal.sell_price, journal.shares, journal.fee_rate, journal.note,
        journal.buy_fee, journal.sell_fee, journal.total_fees, journal.net_profit,
        journal.profit, journal.status
    ))
    journal_id = c.lastrowid
    db.commit()
    response_data = {**journal.model_dump(), "id": journal_id}
    print(f"Returning response data: {response_data}")
    return response_data

@app.delete("/api/profit-journals/{journal_id}")
def delete_profit_journal(journal_id: int, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("DELETE FROM profit_journals WHERE id=?", (journal_id,))
    db.commit()
    return {"message": "Profit journal deleted"}

@app.put("/api/profit-journals/{journal_id}")
def update_profit_journal(journal_id: int, journal: ProfitJournal, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("""
        UPDATE profit_journals
        SET symbol=?, buy_date=?, sell_date=?, buy_price=?, sell_price=?, shares=?,
            fee_rate=?, note=?, buy_fee=?, sell_fee=?, total_fees=?, net_profit=?,
            profit=?, status=?
        WHERE id=?
    """, (
        journal.symbol, journal.buy_date, journal.sell_date, journal.buy_price, journal.sell_price,
        journal.shares, journal.fee_rate, journal.note, journal.buy_fee, journal.sell_fee,
        journal.total_fees, journal.net_profit, journal.profit, journal.status, journal_id
    ))
    db.commit()
    return {"message": "Profit journal updated"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
