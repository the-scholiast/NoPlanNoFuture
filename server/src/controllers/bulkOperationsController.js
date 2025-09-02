import supabase from '../supabaseAdmin.js';
import { formatDateString, getUserDateString } from "../utils/dateUtils.js";

// Bulk hard delete (only deletes based on section and completed keys) -> EXPAND FOR MORE COMPREHENSIVE BULK DELETION
export const bulkDeleteTodos = async (userId, { section, completed, filter }) => {
  let query = supabase
    .from('todos')
    .delete()
    .eq('user_id', userId);

  if (filter) {
    if (filter.section) {
      query = query.eq('section', filter.section);
    }
    if (filter.completed !== undefined) {
      query = query.eq('completed', filter.completed);
    }
  } else {
    if (section) {
      query = query.eq('section', section);
    }
    if (completed !== undefined) {
      query = query.eq('completed', completed);
    }
  }

  const { data, error } = await query.select();

  if (error) throw error;
  return { success: true, deleted: data?.length || 0, deletedCount: data?.length || 0 };
};

// Soft delete completed tasks from a specific section
export const deleteCompletedTodos = async (userId, section) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: formatDateString(new Date()) })
    .eq('user_id', userId)
    .eq('section', section)
    .eq('completed', true)
    .is('deleted_at', null) // Only delete non-deleted tasks
    .select();

  if (error) throw error;
  return data || [];
};

// Soft delete all tasks from a specific section
export const deleteAllTodos = async (userId, section) => {
  const deleted_at = getUserDateString(userId, new Date());
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at })
    .eq('user_id', userId)
    .eq('section', section)
    .is('deleted_at', null) // Only delete non-deleted tasks
    .select();

  if (error) throw error;
  return data || [];
};

// Permanently delete old soft-deleted todos at 30 days (cleanup function) -> Not sure if it will be implemented
export const permanentlyDeleteOldTodos = async (userId, daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', formatDateString(cutoffDate))
    .select();

  if (error) throw error;
  return data || [];
};