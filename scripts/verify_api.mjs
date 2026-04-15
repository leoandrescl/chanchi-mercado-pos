import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function verify() {
  console.log('Fetching from REST...');
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/debtors?select=name&limit=1`, {
      method: "GET",
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    console.log("REST Response Status:", res.status);
    const data = await res.json();
    console.log("REST Data:", data);
  } catch (err) {
    console.error("FATAL ERROR FETCH:", err);
  }
}
verify();
