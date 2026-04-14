import json
import urllib.request

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

def purge_table(table):
    print(f"🔥 Limpiando tabla {table}...")
    # Using is.not.null is a trick to match every row since DELETE requires a filter
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=not.is.null"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"✅ Tabla {table} vaciada con éxito.")
            return True
    except Exception as e:
        print(f"❌ Error al vaciar {table}: {e}")
        if hasattr(e, 'read'):
            print(f"Detalle: {e.read().decode()}")
        return False

if __name__ == "__main__":
    # Order matters due to Foreign Keys
    if purge_table('debts'):
        purge_table('debtors')
        print("\n✨ Limpieza completada. El sistema está listo para una nueva importación.")
    else:
        print("\n❌ Se canceló la limpieza debido a errores.")
