import sqlite3
import json
import urllib.request
import os
import sys

# Load .env.local manually
env_vars = {}
try:
    with open('.env.local', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                parts = line.strip().split('=', 1)
                if len(parts) == 2:
                    env_vars[parts[0]] = parts[1]
except Exception as e:
    print(f"Error loading .env.local: {e}")

SUPABASE_URL = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = env_vars.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials in .env.local")
    sys.exit(1)

def supabase_request(table, data=None, method='POST', on_conflict=None, query=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if query:
        url += f"?{query}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    if method == 'POST' and on_conflict:
        headers["Prefer"] = f"resolution=merge-duplicates,return=representation"
        url += f"?on_conflict={on_conflict}"

    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Request error for table {table} ({method}): {e}")
        if hasattr(e, 'read'):
            print(f"Detailed error: {e.read().decode()}")
        return None

def grand_reset():
    log_file = open('reset_log.txt', 'w')
    def log(msg):
        print(msg)
        log_file.write(msg + "\n")
        log_file.flush()

    log("🚀 [GRAND RESET] Iniciando reinicio maestro...")

    # 1. PURGE
    log("🔥 Vaciando deudas...")
    supabase_request('debts', method='DELETE', query='id=not.is.null')
    log("🔥 Vaciando deudores...")
    supabase_request('debtors', method='DELETE', query='id=not.is.null')
    
    # 2. SYNC
    log("📦 Iniciando sincronización limpia desde libreta.db...")
    if not os.path.exists('libreta.db'):
        log("❌ Error: no se encontró libreta.db")
        return

    conn = sqlite3.connect('libreta.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM debtors")
    sqlite_debtors = cursor.fetchall()
    
    debtor_map = {}
    for d in sqlite_debtors:
        log(f"⏳ Deudor: {d['name']}")
        payload = {
            "legacy_id": d['id'],
            "name": d['name'],
            "phone": d['phone'],
            "created_at": d['created_at']
        }
        res = supabase_request('debtors', payload, on_conflict='legacy_id')
        if res and len(res) > 0:
            debtor_map[d['id']] = res[0]['id']
        else:
            log(f"❌ Falló deudor {d['name']}")

    cursor.execute("SELECT * FROM debts")
    sqlite_debts = cursor.fetchall()
    
    success_count = 0
    for d in sqlite_debts:
        supabase_debtor_id = debtor_map.get(d['debtor_id'])
        if not supabase_debtor_id:
            continue
            
        payload = {
            "legacy_id": d['id'],
            "debtor_id": supabase_debtor_id,
            "description": d['description'],
            "amount": d['amount'],
            "date": d['date'],
            "is_paid": bool(d['is_paid'])
        }
        res = supabase_request('debts', payload, on_conflict='legacy_id')
        if res:
            success_count += 1

    log(f"\n✨ RESET COMPLETADO ✨")
    log(f"📊 Deudores: {len(debtor_map)}")
    log(f"📊 Deudas: {success_count}")

    # VERIFY TOTAL
    log("\n💰 Verificando balance final...")
    res = supabase_request('debts', method='GET', query='is_paid=eq.false&select=amount')
    if res:
        total = sum(item['amount'] for item in res)
        log(f"💎 TOTAL FIADO EN SUPABASE: ${total}")
        if total == 1225550:
            log("✅ EL TOTAL COINCIDE PERFECTAMENTE ($1.225.550)")
        else:
            log(f"⚠️ DISCREPANCIA DETECTADA: ${total} vs $1.225.550")
    
    conn.close()
    log_file.close()

if __name__ == "__main__":
    grand_reset()
