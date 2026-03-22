import { supabase } from '../lib/supabase';
import type { Session, SessionInsert } from '../types/session';

export async function saveSession(data: SessionInsert): Promise<Session> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return session as Session;
}

export async function listSessions(): Promise<readonly Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, total_hours, total_pay, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Session[];
}

export async function getSession(id: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Session;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
