import supabase from '../supabaseAdmin.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get all sticker templates for a user.
 */
export const getTemplates = async (userId) => {
  const { data, error } = await supabase
    .from('sticker_templates')
    .select('id, emoji, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    emoji: row.emoji || '',
    name: row.name || ''
  }));
};

/**
 * Create a sticker template.
 */
export const createTemplate = async (userId, { emoji, name }) => {
  const emojiVal = typeof emoji === 'string' ? emoji.trim() : '';
  const nameVal = typeof name === 'string' ? name.trim() : '';

  const { data, error } = await supabase
    .from('sticker_templates')
    .insert({
      user_id: userId,
      emoji: emojiVal || '⭐',
      name: nameVal
    })
    .select('id, emoji, name')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a sticker template by id.
 */
export const updateTemplate = async (userId, id, { emoji, name }) => {
  if (!UUID_REGEX.test(id)) throw new Error('Invalid template id');
  const emojiVal = typeof emoji === 'string' ? emoji.trim() : '';
  const nameVal = typeof name === 'string' ? name.trim() : '';

  const { data, error } = await supabase
    .from('sticker_templates')
    .update({ emoji: emojiVal || '⭐', name: nameVal })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, emoji, name')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Template not found');
  return data;
};

/**
 * Delete a sticker template by id.
 */
export const deleteTemplate = async (userId, id) => {
  if (!UUID_REGEX.test(id)) throw new Error('Invalid template id');

  const { error } = await supabase
    .from('sticker_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};
