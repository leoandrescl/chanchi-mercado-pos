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

const initialProducts = [
  { name: 'Sopaipilla', price: 500, category: 'Frituras' },
  { name: 'Papas Fritas', price: 1200, category: 'Frituras' },
  { name: 'Bebida 350cc', price: 1000, category: 'Bebidas' },
  { name: 'Empanada', price: 1500, category: 'Masas' },
];

async function seedProducts() {
  console.log("🌱 [SEED] Iniciando migración de productos iniciales...");

  for (const product of initialProducts) {
    // Check if exists
    const { data: exists } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .maybeSingle();

    if (exists) {
      console.log(`⏩ [SEED] El producto '${product.name}' ya existe. Saltando.`);
      continue;
    }

    const { error } = await supabase
      .from('products')
      .insert(product);

    if (error) {
      console.error(`❌ [SEED] Error al insertar '${product.name}':`, error.message);
      console.error("⚠️ Asegúrate de haber ejecutado la migración SQL en el dashboard de Supabase.");
    } else {
      console.log(`✅ [SEED] Producto '${product.name}' insertado con éxito.`);
    }
  }

  console.log("\n✨ [SEED] Proceso de migración finalizado.");
}

seedProducts();
