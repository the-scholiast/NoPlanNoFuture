'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { stickerTemplatesApi } from '@/lib/api';
import { todoKeys } from '@/lib/queryKeys';
import { EMOJI_LIST } from '@/lib/constants/emoji';
import { Pencil, Trash2 } from 'lucide-react';

interface StickerLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StickerLibraryDialog({ open, onOpenChange }: StickerLibraryDialogProps) {
  const queryClient = useQueryClient();
  const [addEmoji, setAddEmoji] = useState('⭐');
  const [addPasteEmoji, setAddPasteEmoji] = useState('');
  const [addName, setAddName] = useState('');
  const [editing, setEditing] = useState<{ id: string; emoji: string; name: string } | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: todoKeys.stickerTemplates,
    queryFn: () => stickerTemplatesApi.getTemplates(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (p: { emoji: string; name: string }) => stickerTemplatesApi.create(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.stickerTemplates });
      setAddName('');
      setAddEmoji('⭐');
      setAddPasteEmoji('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, emoji, name }: { id: string; emoji: string; name: string }) =>
      stickerTemplatesApi.update(id, { emoji, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.stickerTemplates });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stickerTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.stickerTemplates });
    },
  });

  const effectiveAddEmoji = addPasteEmoji.trim().slice(0, 10) || addEmoji;

  const handleAdd = () => {
    createMutation.mutate({ emoji: effectiveAddEmoji, name: addName.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage my stickers</DialogTitle>
          <DialogDescription>Create new stickers and manage your library.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Create new sticker</Label>
            <Input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Birthday, Day off"
            />
            <div className="grid grid-cols-10 gap-1 max-h-[180px] overflow-y-auto">
              {EMOJI_LIST.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-lg rounded p-1 ${(addPasteEmoji ? effectiveAddEmoji : addEmoji) === e ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  onClick={() => { setAddEmoji(e); setAddPasteEmoji(''); }}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input
              value={addPasteEmoji}
              onChange={(e) => setAddPasteEmoji(e.target.value)}
              placeholder="Or paste any emoji"
              className="text-base"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={createMutation.isPending || !addName.trim()}
            >
              Add
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>Your stickers</Label>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stickers yet. Add some above.</p>
            ) : (
              <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                {templates.map((t) =>
                  editing?.id === t.id ? (
                    <li key={t.id} className="flex flex-col gap-2 border rounded p-2">
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : null))}
                        placeholder="Name"
                      />
                      <div className="grid grid-cols-10 gap-1 max-h-[140px] overflow-y-auto">
                        {EMOJI_LIST.map((e, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`text-base rounded p-0.5 ${editing.emoji === e ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            onClick={() => setEditing((x) => (x ? { ...x, emoji: e } : null))}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: t.id,
                            emoji: editing.emoji,
                            name: editing.name.trim(),
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 py-1 border-b border-transparent hover:border-muted"
                    >
                      <span className="text-lg" title={t.name}>{t.emoji}</span>
                      <span className="text-sm flex-1 truncate">{t.name || '(no name)'}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditing({ id: t.id, emoji: t.emoji, name: t.name })}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(t.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
