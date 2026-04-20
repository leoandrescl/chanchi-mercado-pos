'use server';

import { supabase } from '@/lib/supabase';

export type AuditActionType = 'FIADO' | 'ABONO' | 'CREACION_CLIENTE' | 'EDICION_CLIENTE' | 'ELIMINACION_CLIENTE' | 'DELETE_DEBT' | 'QUICK_PAY' | 'UPDATE_DEBT';

export async function logAuditAction({
  actionType,
  entityType,
  entityId,
  details
}: {
  actionType: AuditActionType;
  entityType: string;
  entityId?: string;
  details?: any;
}) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Audit Log Error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Audit Log Exception:', err.message);
    return { success: false, error: err.message };
  }
}
