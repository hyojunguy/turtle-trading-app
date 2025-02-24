import pytest
from fastapi.testclient import TestClient
from main import app, get_db
import sqlite3
import os

client = TestClient(app)

@pytest.fixture
def test_db():
    # 테스트 전용 SQLite DB를 생성할 때 check_same_thread=False 옵션을 사용합니다.
    conn = sqlite3.connect('test_trading.db', check_same_thread=False)
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS trading_journals (
        id INTEGER PRIMARY KEY,
        type TEXT,
        title TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    ''')
    conn.commit()
    yield conn
    conn.close()
    if os.path.exists('test_trading.db'):
        os.remove('test_trading.db')

def override_get_db():
    # 테스트용 DB 파일에 접근할 때 동일 옵션을 적용합니다.
    conn = sqlite3.connect('test_trading.db', check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()

app.dependency_overrides[get_db] = override_get_db

def test_create_trading_journal(test_db):
    journal_data = {
        "type": "Daily",
        "title": "Market Analysis",
        "content": "Today the market showed significant volatility."
    }
    response = client.post("/api/trading-journals", json=journal_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    response_data = response.json()
    # 반환된 id 값이 None이 아니어야 합니다.
    assert response_data["id"] is not None
    assert response_data["type"] == journal_data["type"]
    assert response_data["title"] == journal_data["title"]
    assert response_data["content"] == journal_data["content"]
    assert "created_at" in response_data
    assert "updated_at" in response_data

    # DB에 실제 데이터가 잘 저장되었는지 검증합니다.
    c = test_db.cursor()
    c.execute("SELECT * FROM trading_journals WHERE id = ?", (response_data["id"],))
    record = c.fetchone()
    assert record is not None
    # record: (id, type, title, content, created_at, updated_at)
    assert record[1] == journal_data["type"]
    assert record[2] == journal_data["title"]
    assert record[3] == journal_data["content"]

def test_get_trading_journals(test_db):
    # 테스트용 DB에 직접 데이터를 삽입합니다.
    c = test_db.cursor()
    sample_data = ("Weekly", "Weekly Summary", "This week was bullish", "2025-01-01T10:00:00", "2025-01-01T10:00:00")
    c.execute("""
        INSERT INTO trading_journals (type, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, sample_data)
    test_db.commit()
    
    response = client.get("/api/trading-journals")
    assert response.status_code == 200
    journals = response.json()
    assert len(journals) > 0
    # 가장 최근 등록된 레코드가 첫번째로 반환되어야 합니다.
    record = journals[0]
    assert record["type"] == "Weekly"
    assert record["title"] == "Weekly Summary"
    assert record["content"] == "This week was bullish"
    assert record["created_at"] == "2025-01-01T10:00:00"
    assert record["updated_at"] == "2025-01-01T10:00:00"

def test_create_trading_journal_invalid_data(test_db):
    # 필수 필드(type, title, content)가 누락된 경우 422 에러가 발생해야 합니다.
    invalid_data = {
        "title": "Missing type and content"
    }
    response = client.post("/api/trading-journals", json=invalid_data)
    assert response.status_code == 422
    json_data = response.json()
    assert "detail" in json_data

def test_get_empty_trading_journals(test_db):
    # trading_journals 테이블의 모든 데이터를 삭제한 후 빈 리스트가 반환되는지 확인합니다.
    c = test_db.cursor()
    c.execute("DELETE FROM trading_journals")
    test_db.commit()
    
    response = client.get("/api/trading-journals")
    assert response.status_code == 200
    journals = response.json()
    assert isinstance(journals, list)
    assert len(journals) == 0


if __name__ == "__main__":
    pytest.main()