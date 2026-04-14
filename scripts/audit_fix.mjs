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

async function auditAndFix() {
  console.log("🔍 [AUDITORÍA] Iniciando inspección de 'fantasmas' de 1969...");

  // 1. Identificar registros inválidos (Antes de 1980)
  const { data: ghosts, error: fetchError } = await supabase
    .from('debts')
    .select('*, debtors(name)')
    .lt('date', '1980-01-01');

  if (fetchError) {
    console.error("❌ Error al buscar fantasmas:", fetchError.message);
    return;
  }

  if (ghosts.length === 0) {
    console.log("✅ No se encontraron registros con fecha inválida (1969).");
  } else {
    console.log(`⚠️ Se encontraron ${ghosts.length} registros anómalos:`);
    
    for (const ghost of ghosts) {
      console.log(`   - [${ghost.date}] ${ghost.debtors?.name}: ${ghost.description} ($${ghost.amount})`);
      
      if (ghost.amount === 1750) {
        console.log(`   ✨ Corrigiendo registro de $1.750 a la fecha actual...`);
        const { error: updateError } = await supabase
          .from('debts')
          .update({ date: new Date().toISOString() })
          .eq('id', ghost.id);
        
        if (updateError) console.error(`   ❌ Error al corregir: ${updateError.message}`);
        else console.log(`   ✅ Corregido.`);
      } else {
        console.log(`   🗑️ Eliminando registro irrelevante...`);
        const { error: deleteError } = await supabase
          .from('debts')
          .delete()
          .eq('id', ghost.id);
        
        if (deleteError) console.error(`   ❌ Error al eliminar: ${deleteError.message}`);
        else console.log(`   ✅ Eliminado.`);
      }
    }
  }

  // 2. Verificar integridad de Capital Total
  const { data: unpaid, error: unpaidError } = await supabase
    .from('debts')
    .select('amount')
    .eq('is_paid', false);

  if (!unpaidError && unpaid) {
    const total = unpaid.reduce((acc, d) => acc + d.amount, 0);
    console.log(`\n📊 [AUDITORÍA] Capital Total Actualizado: $${total}`);
  }

  console.log("\n✨ [AUDITORÍA] Proceso finalizado.");
}

auditAndFix();
