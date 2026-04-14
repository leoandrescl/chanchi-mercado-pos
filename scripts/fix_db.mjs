import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan variables de entorno en .env.local (URL o Key)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hardFix() {
  console.log("🛠️ [HARD FIX] Iniciando reparación forzada de datos en Supabase...");

  // 1. Corregir fechas inválidas o nulas
  const { data, error } = await supabase
    .from('debts')
    .update({ 
      date: new Date().toISOString(),
      created_at: new Date().toISOString() 
    })
    .or('date.lt.1980-01-01,date.is.null');

  if (error) {
    console.error("❌ Error durante el Hard Fix:", error.message);
    return;
  }

  console.log(`✅ Reparación completada. Los registros anómalos han sido actualizados con el timestamp actual.`);
  
  // 2. Auditoría post-reparación
  const { data: ghosts, error: auditError } = await supabase
    .from('debts')
    .select('id')
    .lt('date', '1980-01-01');

  if (!auditError && ghosts && ghosts.length === 0) {
    console.log("✨ Auditoría exitosa: No quedan registros de 1969 en la base de datos.");
  } else {
    console.log(`⚠️ Advertencia: Aún se detectan ${ghosts?.length} registros con fechas antiguas.`);
  }
}

hardFix();
