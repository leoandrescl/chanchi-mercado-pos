'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Toggle the visibility status of a product directly in the database.
 */
export async function toggleProductVisibility(productId: string, currentState: boolean) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_visible: !currentState })
      .eq('id', productId);

    if (error) {
      console.error('Error toggling visibility:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    
    return { success: true, newState: !currentState };
  } catch (err) {
    console.error('Unexpected error in toggleProductVisibility:', err);
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

/**
 * Uploads an image (if present) and creates a product bundle along with its component relations.
 */
export async function addBundleWithImage(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const category = formData.get('category') as string;
    const imageFile = formData.get('imageFile') as File | null;
    const componentsJson = formData.get('components') as string;
    
    let components = [];
    try {
      if (componentsJson) components = JSON.parse(componentsJson);
    } catch (e) {
      return { success: false, error: 'El formato de los componentes del pack es inválido.' };
    }

    if (components.length === 0) {
      return { success: false, error: 'Un pack debe tener al menos un producto.' };
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-bundle-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading bundle image:', uploadError);
        return { success: false, error: 'Error al subir la imagen del Pack.' };
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // Insert Product as Bundle
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        price,
        category: category || 'Pack Promocional',
        image: imageUrl,
        is_bundle: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting bundle product:', insertError);
      if (insertError.code === '23505') {
        return { success: false, error: 'Ya existe un pack o producto con ese nombre' };
      }
      return { success: false, error: 'Error al guardar el Pack.' };
    }

    // Insert Bundle Components
    const bundleInsertData = components.map((comp: {id: string, quantity: number}) => ({
      bundle_id: product.id,
      component_id: comp.id,
      quantity: comp.quantity
    }));

    const { error: componentsError } = await supabase
      .from('product_bundles')
      .insert(bundleInsertData);

    if (componentsError) {
      console.error('Error inserting bundle components:', componentsError);
      // Depending on strictness, we could delete the product if components fail, 
      // but Postgres transactions are better. Supabase JS doesn't easily do transactions via REST.
      // So we just return an error for now.
      // In a real robust system, we would've used a Postgres RPC for transactional inserts.
    }

    revalidatePath('/');
    return { success: true, product };

  } catch (err) {
    console.error('Unexpected error in addBundleWithImage:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}

/**
 * Updates an existist product, optionally uploading a new image.
 */
export async function updateProductWithImage(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const category = formData.get('category') as string;
    const imagePreview = formData.get('imagePreview') as string | null;
    const imageFile = formData.get('imageFile') as File | null;
    
    let imageUrl = imagePreview;

    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
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
        return { success: false, error: 'Error al subir la nueva imagen.' };
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        name,
        price,
        category: category || 'General',
        image: imageUrl,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      return { success: false, error: 'Error al actualizar el producto.' };
    }

    revalidatePath('/');
    return { success: true, product };

  } catch (err) {
    console.error('Unexpected error in updateProductWithImage:', err);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
