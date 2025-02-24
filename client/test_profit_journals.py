import pytest
from fastapi.testclient import TestClient
from main import app, get_db
import sqlite3
import os

client = TestClient(app)

@pytest.fixture
def test_db():
    conn = sqlite3.connect('test_trading.db', check_same_thread=False)
    c = conn.cursor()
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
    conn.commit()
    yield conn
    conn.close()
    if os.path.exists('test_trading.db'):
        os.remove('test_trading.db')

def override_get_db():
    conn = sqlite3.connect('test_trading.db', check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()

app.dependency_overrides[get_db] = override_get_db

def test_create_profit_journal(test_db):
    journal_data = {
        "symbol": "AAPL",
        "buy_date": "2025-01-01",
        "buy_price": 150.0,
        "shares": 10.0,
        "fee_rate": 0.001,
        "note": "Test buy",
        "buy_fee": 1.5,
        "total_fees": 1.5,
        "status": "open"
    }
    
    response = client.post("/api/profit-journals", json=journal_data)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.json()}")
    if response.status_code != 200:
        error_msg = f"Expected status 200, got {response.status_code}: {response.json()}"
        print(error_msg)
        pytest.fail(error_msg)
    assert response.status_code == 200
    
    response_data = response.json()
    assert response_data["id"] is not None
    assert response_data["symbol"] == "AAPL"
    assert response_data["buy_date"] == "2025-01-01"
    assert response_data["status"] == "open"
    
    c = test_db.cursor()
    c.execute("SELECT * FROM profit_journals WHERE id = ?", (response_data["id"],))
    db_record = c.fetchone()
    assert db_record[1] == "AAPL"
    assert db_record[4] == 150.0

def test_get_profit_journals(test_db):
    c = test_db.cursor()
    c.execute("""
    INSERT INTO profit_journals (
        symbol, buy_date, buy_price, shares, fee_rate, status
    ) VALUES (?, ?, ?, ?, ?, ?)
    """, ("TSLA", "2025-02-01", 200.0, 5.0, 0.002, "open"))
    test_db.commit()
    
    response = client.get("/api/profit-journals")
    if response.status_code != 200:
        print(f"Error in test_get_profit_journals: {response.json()}")
    assert response.status_code == 200
    
    journals = response.json()
    assert len(journals) == 1
    assert journals[0]["symbol"] == "TSLA"
    assert journals[0]["buy_price"] == 200.0
    assert journals[0]["status"] == "open"

def test_create_profit_journal_invalid_data(test_db):
    invalid_data = {
        "symbol": "GOOG",
        "buy_date": "2025-01-15",
        "shares": 20.0,
        "fee_rate": 0.001,
        "status": "open"
    }
    
    response = client.post("/api/profit-journals", json=invalid_data)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_get_empty_profit_journals(test_db):
    response = client.get("/api/profit-journals")
    assert response.status_code == 200
    journals = response.json()
    assert len(journals) == 0
    assert journals == []

def test_create_profit_journal_with_sell(test_db):
    journal_data = {
        "symbol": "MSFT",
        "buy_date": "2025-01-10",
        "sell_date": "2025-02-20",
        "buy_price": 300.0,
        "sell_price": 350.0,
        "shares": 10.0,
        "fee_rate": 0.001,
        "note": "Closed position",
        "buy_fee": 3.0,
        "sell_fee": 3.5,
        "total_fees": 6.5,
        "net_profit": 493.5,
        "profit": 500.0,
        "status": "closed"
    }
    
    response = client.post("/api/profit-journals", json=journal_data)
    if response.status_code != 200:
        print(f"Error in test_create_profit_journal_with_sell: {response.json()}")
    assert response.status_code == 200
    
    response_data = response.json()
    assert response_data["net_profit"] == 493.5
    assert response_data["profit"] == 500.0
    assert response_data["status"] == "closed"

if __name__ == "__main__":
    pytest.main()
