'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { stickerTemplatesApi } from '@/lib/api';
import { todoKeys } from '@/lib/queryKeys';
import { EMOJI_LIST } from '@/lib/constants/emoji';
import { Settings2, Pencil, Trash2 } from 'lucide-react';

interface DaySticker {
  id: string;
  emoji: string;
  name: string;
}

interface DayStickerManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  dayStickers: DaySticker[];
  onAdd: (payload: { emoji: string; name: string }) => void;
  onUpdate: (id: string, payload: { emoji: string; name: string }) => void;
  onDelete: (id: string) => void;
  onOpenManageStickers: () => void;
  isPending?: boolean;
}

export function DayStickerManagerDialog({
  open,
  onOpenChange,
  date,
  dayStickers,
  onAdd,
  onUpdate,
  onDelete,
  onOpenManageStickers,
  isPending = false,
}: DayStickerManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('⭐');
  const [editPasteEmoji, setEditPasteEmoji] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: todoKeys.stickerTemplates,
    queryFn: () => stickerTemplatesApi.getTemplates(),
    enabled: open,
  });

  const editing = editingId ? dayStickers.find((s) => s.id === editingId) : null;

  useEffect(() => {
    if (open) {
      setEditingId(null);
    }
  }, [open]);

  useEffect(() => {
    if (editing) {
      setEditName(editing.name);
      setEditEmoji(editing.emoji);
      setEditPasteEmoji('');
    }
  }, [editing]);

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const effectiveEditEmoji = editPasteEmoji.trim().slice(0, 10) || editEmoji;

  const handleSelectTemplate = (t: { emoji: string; name: string }) => {
    onAdd({ emoji: t.emoji, name: t.name });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdate(editingId, { emoji: effectiveEditEmoji, name: editName.trim() });
      setEditingId(null);
    }
  };

  const handleDeleteEdit = () => {
    if (editingId) {
      onDelete(editingId);
      setEditingId(null);
    }
  };

  const hasStickers = dayStickers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stickers for {dateLabel}</DialogTitle>
          <DialogDescription>
            {hasStickers
              ? 'View, edit, or add stickers for this day.'
              : 'Add a sticker for this day.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {hasStickers && (
            <div className="grid gap-2">
              <Label>Stickers on this day</Label>
              <ul className="space-y-2 max-h-[160px] overflow-y-auto">
                {dayStickers.map((s) =>
                  editingId === s.id ? (
                    <li key={s.id} className="flex flex-col gap-2 border rounded p-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <div className="grid grid-cols-10 gap-1 max-h-[120px] overflow-y-auto">
                        {EMOJI_LIST.map((e, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`text-base rounded p-0.5 transition ${effectiveEditEmoji === e ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            onClick={() => {
                              setEditEmoji(e);
                              setEditPasteEmoji('');
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={editPasteEmoji}
                        onChange={(e) => setEditPasteEmoji(e.target.value)}
                        placeholder="Or paste any emoji"
                        className="text-base"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteEdit}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 py-1 border-b border-transparent hover:border-muted"
                    >
                      <span className="text-lg" title={s.name}>{s.emoji}</span>
                      <span className="text-sm flex-1 truncate">{s.name || '(no name)'}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(s.id)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(s.id)}
                        disabled={isPending}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <div className="grid gap-2">
            <Label>{hasStickers ? 'Add from your stickers' : 'Your stickers'}</Label>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stickers yet. Go to Manage my stickers to create some.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="text-lg rounded p-1.5 border hover:bg-muted transition"
                    title={t.name || undefined}
                    onClick={() => handleSelectTemplate(t)}
                  >
                    {t.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onOpenManageStickers}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Manage my stickers
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
