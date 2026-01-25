import supabase from '../supabaseAdmin.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get all day stickers for a user in a given month. Supports multiple stickers per date.
 * @param {string} userId
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Array<{ id: string, date: string, emoji: string, name: string }>>}
 */
export const getMonthStickers = async (userId, year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('day_stickers')
    .select('id, date, emoji, name')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    emoji: row.emoji || '',
    name: row.name || ''
  }));
};

/**
 * Create a new sticker for a day.
 * @param {string} userId
 * @param {string} dateStr YYYY-MM-DD
 * @param {{ emoji: string, name: string }} payload
 */
export const createSticker = async (userId, dateStr, { emoji, name }) => {
  if (!DATE_REGEX.test(dateStr)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  const emojiVal = typeof emoji === 'string' ? emoji.trim() : '';
  const nameVal = typeof name === 'string' ? name.trim() : '';

  const { data, error } = await supabase
    .from('day_stickers')
    .insert({
      user_id: userId,
      date: dateStr,
      emoji: emojiVal || '⭐',
      name: nameVal
    })
    .select('id, date, emoji, name')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing sticker by id.
 * @param {string} userId
 * @param {string} id sticker uuid
 * @param {{ emoji: string, name: string }} payload
 */
export const updateSticker = async (userId, id, { emoji, name }) => {
  if (!UUID_REGEX.test(id)) {
    throw new Error('Invalid sticker id');
  }
  const emojiVal = typeof emoji === 'string' ? emoji.trim() : '';
  const nameVal = typeof name === 'string' ? name.trim() : '';

  const { data, error } = await supabase
    .from('day_stickers')
    .update({
      emoji: emojiVal || '⭐',
      name: nameVal,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, date, emoji, name')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Sticker not found');
  return data;
};

/**
 * Delete a sticker by id.
 * @param {string} userId
 * @param {string} id sticker uuid
 */
export const deleteSticker = async (userId, id) => {
  if (!UUID_REGEX.test(id)) {
    throw new Error('Invalid sticker id');
  }

  const { error } = await supabase
    .from('day_stickers')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};
