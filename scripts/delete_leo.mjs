import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deleteLeo() {
  const { data, error } = await supabase.from('debtors').delete().eq('name', '01 leo prueba').select();
  if (error) console.error(error);
  else console.log('Deleted:', data);
}
deleteLeo();
