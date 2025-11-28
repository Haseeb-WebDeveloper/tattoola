import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Use Expo public env vars so they are embedded in the app bundle
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Temporarily remove Database typing until schema is set up
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable automatic URL detection - we handle it manually
    flowType: 'pkce',
  },
});

// Auth helpers
export const getUser = () => supabase.auth.getUser();
export const getSession = () => supabase.auth.getSession();

// Database helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      artist_profiles(*),
      user_favorite_styles(
        styleId,
        order,
        tattoo_styles(*)
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const getArtistProfile = async (artistId: string) => {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select(`
      *,
      users(*),
      styles:artist_styles(
        styleId,
        order,
        isFavorite,
        style:tattoo_styles(*)
      ),
      artist_services(
        *,
        services(*)
      ),
      artist_body_parts(
        *,
        body_parts(*)
      ),
      portfolio_projects(
        *,
        portfolio_project_media(*)
      )
    `)
    .eq('id', artistId)
    .single();

  if (error) throw error;
  return data;
};

export const getTattooStyles = async () => {
  const { data, error } = await supabase
    .from('tattoo_styles')
    .select('*')
    .eq('isActive', true)
    .order('name');

  if (error) throw error;
  return data;
};

export const getProvinces = async () => {
  const { data, error } = await supabase
    .from('provinces')
    .select(`
      *,
      municipalities(*)
    `)
    .eq('isActive', true)
    .order('name');

  if (error) throw error;
  return data;
};

export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('isActive', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const getBodyParts = async () => {
  const { data, error } = await supabase
    .from('body_parts')
    .select('*')
    .eq('isActive', true)
    .order('name');

  if (error) throw error;
  return data;
};
