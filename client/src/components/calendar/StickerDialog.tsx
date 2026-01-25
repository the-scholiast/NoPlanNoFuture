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
import { Settings2 } from 'lucide-react';

interface StickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  initial: { emoji: string; name: string } | null;
  onSave: (payload: { emoji: string; name: string }) => void;
  onDelete?: () => void;
  onOpenManageStickers?: () => void;
  isPending?: boolean;
}

export function StickerDialog({
  open,
  onOpenChange,
  date,
  initial,
  onSave,
  onDelete,
  onOpenManageStickers,
  isPending = false,
}: StickerDialogProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [pasteEmoji, setPasteEmoji] = useState('');

  const isAdding = initial === null;
  const { data: templates = [] } = useQuery({
    queryKey: todoKeys.stickerTemplates,
    queryFn: () => stickerTemplatesApi.getTemplates(),
    enabled: open && isAdding,
  });

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setEmoji(initial?.emoji || '⭐');
      setPasteEmoji('');
    }
  }, [open, initial?.name, initial?.emoji]);

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const effectiveEmoji = (pasteEmoji.trim().slice(0, 10)) || emoji;

  const handleSave = () => {
    onSave({ emoji: effectiveEmoji, name: name.trim() });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const handleSelectTemplate = (t: { emoji: string; name: string }) => {
    onSave({ emoji: t.emoji, name: t.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAdding ? 'Add your sticker' : `Sticker for ${dateLabel}`}</DialogTitle>
          {isAdding && (
            <DialogDescription>for {dateLabel}</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {isAdding ? (
            <>
              <div className="grid gap-2">
                <Label>Your stickers</Label>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stickers yet. Go to Manage my stickers to create some.</p>
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
              {onOpenManageStickers && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onOpenManageStickers}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Manage my stickers
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="sticker-name">Name</Label>
                <Input
                  id="sticker-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Birthday, Day off"
                />
              </div>
              <div className="grid gap-2">
                <Label>Emoji</Label>
                <div className="grid grid-cols-10 gap-1 max-h-[180px] overflow-y-auto">
                  {EMOJI_LIST.map((e, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`
                        text-lg rounded p-1 transition
                        ${(pasteEmoji ? effectiveEmoji : emoji) === e ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      `}
                      onClick={() => { setEmoji(e); setPasteEmoji(''); }}
                      aria-label={`Select ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <Input
                  value={pasteEmoji}
                  onChange={(e) => setPasteEmoji(e.target.value)}
                  placeholder="Or paste any emoji"
                  className="text-base"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {!isAdding && initial && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isAdding && (
            <Button type="button" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
