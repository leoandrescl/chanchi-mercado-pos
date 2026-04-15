'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Toggle the favorite status of a product directly in the database.
 */
export async function toggleProductFavorite(productId: string, currentState: boolean) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_favorite: !currentState })
      .eq('id', productId);

    if (error) {
      console.error('Error toggling favorite:', error);
      return { success: false, error: error.message };
    }

    // Optional: Revalidate the main page to show updated sorting if using Server Components
    revalidatePath('/');
    
    return { success: true, newState: !currentState };
  } catch (err) {
    console.error('Unexpected error in toggleProductFavorite:', err);
    return { success: false, error: 'Internal Server Error' };
  }
}
