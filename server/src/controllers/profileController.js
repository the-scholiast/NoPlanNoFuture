import supabase from '../supabaseAdmin.js';

export const getProfile = async (userId) => {
  console.log('=== GET PROFILE DEBUG ===');
  console.log('Looking for user ID:', userId);

  // First try to get existing profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('Profile query result:', { data, error });

  // If profile exists, return it
  if (data) {
    console.log('Found existing profile for user:', userId);
    return data;
  }

  // If profile doesn't exist (PGRST116 = not found), create it
  if (error && error.code === 'PGRST116') {
    console.log('Profile not found, creating new profile for user:', userId);
    
    // Create a basic profile - user can update details later
    const profileData = {
      id: userId,
      email: '',  // User can fill this in later
      full_name: '',
      avatar_url: ''
    };

    console.log('Creating basic profile with data:', profileData);

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    console.log('Profile creation result:', { profile: newProfile, error: createError });

    if (createError) {
      console.error('Failed to create profile:', createError);
      throw createError;
    }

    console.log('Successfully created new user profile for:', userId);
    return newProfile;
  }

  console.error('Unexpected error getting profile:', error);
  throw error;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return data;
};