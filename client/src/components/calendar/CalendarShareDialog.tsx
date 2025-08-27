'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Trash2 } from 'lucide-react'
import { createCalendarShare, getOwnedShares, revokeCalendarShare } from '@/lib/api/calendarShareApi'
import { toast } from 'sonner'

export function CalendarShareDialog() {
  const [email, setEmail] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch existing shares
  const { data: shares = [] } = useQuery({
    queryKey: ['calendar-shares', 'owned'],
    queryFn: getOwnedShares,
    enabled: isOpen
  })

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: createCalendarShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-shares'] })
      setEmail('')
      toast.success("Calendar shared successfully - The user can now view your calendar.")
    },
    onError: (error: Error) => {
      toast.error(`Failed to share calendar: ${error.message}`)
    }
  })

  // Revoke share mutation  
  const revokeShareMutation = useMutation({
    mutationFn: revokeCalendarShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-shares'] })
      toast.success("Share revoked - The user can no longer view your calendar.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      createShareMutation.mutate(email.trim())
    }
  }

  const copyShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/calendar/shared/${shareToken}`
    navigator.clipboard.writeText(link)
    toast.success("Share link copied to clipboard.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Calendar</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email to share with"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={createShareMutation.isPending}
            className="w-full"
          >
            {createShareMutation.isPending ? 'Sharing...' : 'Share Calendar'}
          </Button>
        </form>

        {shares.length > 0 && (
          <div className="mt-6">
            <Label>Current Shares</Label>
            <div className="space-y-2 mt-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{share.shared_with?.email}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareLink(share.share_token)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeShareMutation.mutate(share.id)}
                      disabled={revokeShareMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}