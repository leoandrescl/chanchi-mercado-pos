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

/**
 * Uploads an image to Supabase Storage and creates a new product.
 */
export async function addProductWithImage(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const category = formData.get('category') as string;
    const imageFile = formData.get('imageFile') as File | null;
    
    let imageUrl = null;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return { success: false, error: 'Error al subir la imagen. Verifica que el bucket "product-images" exista y sea público.' };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // Insert Product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        price,
        category: category || 'Nuevo',
        image: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product:', insertError);
      if (insertError.code === '23505') {
        return { success: false, error: 'Este producto ya existe en tu lista' };
      }
      return { success: false, error: 'Error al guardar el producto.' };
    }

    revalidatePath('/');
    return { success: true, product };

  } catch (err) {
    console.error('Unexpected error in addProductWithImage:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
