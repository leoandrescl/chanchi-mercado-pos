import sqlite3
import os
from datetime import datetime

DB_NAME = 'libreta.db'
LOG_DB_NAME = 'logs.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def get_log_db_connection():
    conn = sqlite3.connect(LOG_DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Main DB
    conn = get_db_connection()
    with conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS debtors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS debts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                debtor_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                amount INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_paid BOOLEAN DEFAULT 0,
                FOREIGN KEY (debtor_id) REFERENCES debtors (id)
            )
        ''')
    conn.close()

    # Logs DB
    conn_logs = get_log_db_connection()
    with conn_logs:
        conn_logs.execute('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                action_type TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER,
                description TEXT NOT NULL,
                user TEXT DEFAULT 'System'
            )
        ''')
    conn_logs.close()

# ... (debtor functions remain the same) ...





def add_debtor(name, phone=None):
    conn = get_db_connection()
    with conn:
        cursor = conn.execute('INSERT INTO debtors (name, phone) VALUES (?, ?)', (name, phone))
        debtor_id = cursor.lastrowid
    conn.close()
    return debtor_id

def get_debtors():
    conn = get_db_connection()
    debtors = conn.execute('''
        SELECT d.*, COALESCE(SUM(CASE WHEN db.is_paid = 0 THEN db.amount ELSE 0 END), 0) as total_debt
        FROM debtors d
        LEFT JOIN debts db ON d.id = db.debtor_id
        GROUP BY d.id
    ''').fetchall()
    conn.close()
    
    debtor_list = [dict(row) for row in debtors]
    # Sort in Python to ensure case-insensitivity matches user expectation
    debtor_list.sort(key=lambda x: x['name'].strip().lower())
    
    return debtor_list

def get_debtor(debtor_id):
    conn = get_db_connection()
    debtor = conn.execute('SELECT * FROM debtors WHERE id = ?', (debtor_id,)).fetchone()
    conn.close()
    return dict(debtor) if debtor else None

def delete_debtor(debtor_id):
    conn = get_db_connection()
    with conn:
        conn.execute('DELETE FROM debts WHERE debtor_id = ?', (debtor_id,))
        conn.execute('DELETE FROM debtors WHERE id = ?', (debtor_id,))
    conn.close()

def add_debt(debtor_id, description, amount, date=None, is_paid=False):
    conn = get_db_connection()
    with conn:
        if date:
            conn.execute('INSERT INTO debts (debtor_id, description, amount, date, is_paid) VALUES (?, ?, ?, ?, ?)',
                         (debtor_id, description, amount, date, 1 if is_paid else 0))
        else:
            conn.execute('INSERT INTO debts (debtor_id, description, amount, is_paid) VALUES (?, ?, ?, ?)',
                         (debtor_id, description, amount, 1 if is_paid else 0))
    conn.close()

def get_debts(debtor_id):
    conn = get_db_connection()
    debts = conn.execute('SELECT * FROM debts WHERE debtor_id = ? ORDER BY date DESC', (debtor_id,)).fetchall()
    conn.close()
    return [dict(row) for row in debts]

def set_debt_status(debt_id, is_paid):
    conn = get_db_connection()
    with conn:
        conn.execute('UPDATE debts SET is_paid = ? WHERE id = ?', (1 if is_paid else 0, debt_id))
    conn.close()

def pay_debt(debt_id):
    set_debt_status(debt_id, True)

def delete_debt(debt_id):
    conn = get_db_connection()
    with conn:
        conn.execute('DELETE FROM debts WHERE id = ?', (debt_id,))
    conn.close()

def update_debtor(debtor_id, name, phone):
    conn = get_db_connection()
    with conn:
        conn.execute('UPDATE debtors SET name = ?, phone = ? WHERE id = ?', (name, phone, debtor_id))
    conn.close()

def update_debt(debt_id, description, amount, date):
    conn = get_db_connection()
    with conn:
        conn.execute('UPDATE debts SET description = ?, amount = ?, date = ? WHERE id = ?',
                     (description, amount, date, debt_id))
    conn.close()

def get_total_debt_all():
    conn = get_db_connection()
    result = conn.execute('SELECT SUM(amount) as total FROM debts WHERE is_paid = 0').fetchone()
    conn.close()
    return result['total'] if result['total'] else 0

def write_text_log(action_type, entity_type, description, user):
    """Writes a raw log entry to a monthly text file."""
    try:
        # HARDCODED PATH (To be 100% sure)
        log_dir = "/var/www/vhosts/allisone.cl/cuentas.allisone.cl/logs"
        
        # Debug: Ensure directory exists
        if not os.path.exists(log_dir):
            return None, f"Error: Logs dir {log_dir} does not exist"
            
        # Generate filename based on current month (e.g., activity-2026-01.log)
        current_month = datetime.now().strftime('%Y-%m')
        filename = f"activity-{current_month}.log"
        filepath = os.path.join(log_dir, filename)
        
        # Format entry: [YYYY-MM-DD HH:MM:SS] [ACTION] [ENTITY] Description (User: X)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] [{action_type}] [{entity_type}] {description} (User: {user})\n"
        
        # Append to file
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(log_entry)
            
        return filepath, None # Success, return path
    except Exception as e:
        return None, str(e)

def log_activity(action_type, entity_type, description, entity_id=None, user='System'):
    # 1. Write to Database FIRST
    log_id = None
    try:
        conn = get_log_db_connection()
        with conn:
            cursor = conn.execute('INSERT INTO activity_logs (action_type, entity_type, description, entity_id, user) VALUES (?, ?, ?, ?, ?)',
                         (action_type, entity_type, description, entity_id, user))
            log_id = cursor.lastrowid
        conn.close()
    except Exception as e:
        print(f"Error logging to DB: {e}")

    # 2. Write to Text File (Parallel)
    # We ignore errors here for the main flow as to not disrupt the user experience
    # (Errors are printed to console/stderr)
    write_text_log(action_type, entity_type, description, user)

def get_logs(page=1, per_page=50):
    offset = (page - 1) * per_page
    conn = get_log_db_connection()
    
    # Get total count
    total_count = conn.execute('SELECT COUNT(*) as count FROM activity_logs').fetchone()['count']
    
    # Get paginated logs
    logs = conn.execute('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?', (per_page, offset)).fetchall()
    conn.close()
    
    return [dict(row) for row in logs], total_count
def process_payment(debtor_id, amount_paid, date_str):
    """
    Allocates a payment to the oldest unpaid debts first.
    Splits debts if the payment partially covers them.
    Records the payment split into 'Used' (Paid) and 'Surplus' (Unpaid) portions
    to ensure the ledger balances correctly.
    """
    if amount_paid <= 0:
        return []

    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    logs = [] # To return a list of "Subject ($Amount)" for logging
    
    with conn:
        # 1. Fetch all unpaid debts sorted by date ASC (Oldest first)
        debts = conn.execute('SELECT * FROM debts WHERE debtor_id = ? AND is_paid = 0 ORDER BY date ASC', (debtor_id,)).fetchall()
        
        remaining = amount_paid
        
        for debt in debts:
            if remaining <= 0:
                break
                
            debt_id = debt['id']
            debt_amount = debt['amount']
            # debt['date'] is a string 'YYYY-MM-DD HH:MM:SS'
            
            if remaining >= debt_amount:
                # Fully pay this debt
                conn.execute('UPDATE debts SET is_paid = 1 WHERE id = ?', (debt_id,))
                
                remaining -= debt_amount
                logs.append(f"{debt['description']} (${debt_amount})")
                
            else:
                # Partially pay this debt
                # 1. Reduce original debt to (Amount - Paid)
                new_amount = debt_amount - remaining
                conn.execute('UPDATE debts SET amount = ? WHERE id = ?', (new_amount, debt_id))
                
                # 2. Create a "Paid Slice" record for the amount paid
                # We use the original date to keep history accurate related to that item
                conn.execute('INSERT INTO debts (debtor_id, description, amount, date, is_paid) VALUES (?, ?, ?, ?, 1)',
                             (debtor_id, f"{debt['description']} (Pagado)", remaining, debt['date']))
                
                logs.append(f"{debt['description']} (${remaining})")
                remaining = 0
        
        # Calculate how much was "used" to pay off debts vs what is "surplus"
        # used = Initial - Remaining
        used = amount_paid - remaining
        
        # 1. Record the "Used" portion as a PAiD payment.
        # This balances the debts we just marked as paid.
        if used != 0:
             conn.execute('INSERT INTO debts (debtor_id, description, amount, date, is_paid) VALUES (?, ?, ?, ?, 1)',
                     (debtor_id, "Abono", -used, date_str))
        
        # 2. Record the "Surplus" portion as an UNPAID credit (Saldo a Favor).
        # This becomes the debtor's new positive balance (negative debt).
        if remaining > 0:
             conn.execute('INSERT INTO debts (debtor_id, description, amount, date, is_paid) VALUES (?, ?, ?, ?, 0)',
                     (debtor_id, "Saldo a Favor", -remaining, date_str))
             if used == 0:
                 logs.append("Saldo a Favor") # Only log if it was purely a credit deposit
             else:
                 logs.append(f"Saldo a Favor (${remaining})")

    conn.close()
    return logs