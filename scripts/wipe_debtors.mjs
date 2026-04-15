import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
  console.log('Wiping debtors via REST...');
  const { error } = await supabase.from('debtors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error(error);
  else console.log('Wiped debtors.');
}
wipe();
