import { supabase } from '@/utils/supabase';

export class BillingService {
  static async getInvoices() {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error('No authenticated user found');

    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), payments(*)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getBillingProfile() {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error('No authenticated user found');
    const { data, error } = await supabase
      .from('billing_profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data || null;
  }

  static async upsertBillingProfile(payload: any) {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error('No authenticated user found');
    const { data, error } = await supabase
      .from('billing_profiles')
      .upsert({ ...payload, userId }, { onConflict: 'userId' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getPaymentMethods() {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error('No authenticated user found');
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('userId', userId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const billingService = new BillingService();


