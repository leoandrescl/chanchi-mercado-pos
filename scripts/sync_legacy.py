import sqlite3
import json
import urllib.request
import os
from datetime import datetime

# Load .env.local manually
env_vars = {}
try:
    with open('.env.local', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, val = line.strip().split('=', 1)
                env_vars[key] = val
except Exception as e:
    print(f"Error loading .env.local: {e}")

SUPABASE_URL = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = env_vars.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials in .env.local")
    exit(1)

def supabase_request(table, data, method='POST', on_conflict=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    if method == 'POST' and on_conflict:
        headers["Prefer"] = f"resolution=merge-duplicates,return=representation"
        url += f"?on_conflict={on_conflict}"

    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Request error for table {table}: {e}")
        if hasattr(e, 'read'):
            print(f"Detailed error: {e.read().decode()}")
        return None

def sync():
    print("🚀 [SYNC] Iniciando sincronización de datos legacy (Python)...")
    
    conn = sqlite3.connect('libreta.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Sync Debtors
    print("📦 Procesando Deudores...")
    cursor.execute("SELECT * FROM debtors")
    sqlite_debtors = cursor.fetchall()
    
    debtor_map = {} # legacy_id -> supabase_uuid
    
    for d in sqlite_debtors:
        print(f"⏳ Sincronizando: {d['name']}... ", end='', flush=True)
        payload = {
            "legacy_id": d['id'],
            "name": d['name'],
            "phone": d['phone'],
            "created_at": d['created_at']
        }
        res = supabase_request('debtors', payload, on_conflict='legacy_id')
        if res and len(res) > 0:
            debtor_map[d['id']] = res[0]['id']
            print(f"✅")
        else:
            print(f"❌ (Asegúrate de haber corrido la migración SQL para legacy_id)")
            return

    # 2. Sync Debts
    print("\n📦 Procesando Deudas...")
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

    print(f"\n✨ Sincronización finalizada.")
    print(f"📊 Deudores: {len(debtor_map)}")
    print(f"📊 Deudas (Upsert): {success_count}")
    
    conn.close()

if __name__ == "__main__":
    sync()
