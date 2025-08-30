import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function ensureProfileExists(userId: string, userData?: any) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check profile: ${profileCheckError.message}`);
    }

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const { error: profileCreateError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: userData?.name || userData?.user_metadata?.name || userData?.email?.split('@')[0] || 'Anonymous',
          avatar_url: userData?.avatar_url || userData?.user_metadata?.avatar_url || null,
        });

      if (profileCreateError) {
        throw new Error(`Failed to create profile: ${profileCreateError.message}`);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return { success: false, error: error as Error };
  }
}

export async function getProfile(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { profile: null, error: error as Error };
  }
}

export async function updateProfile(userId: string, updates: {
  name?: string;
  avatar_url?: string;
  bio?: string;
}) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { profile: null, error: error as Error };
  }
}

