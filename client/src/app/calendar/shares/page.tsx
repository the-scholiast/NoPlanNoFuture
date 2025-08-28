'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Share2, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Calendar,
  Users,
  Link as LinkIcon
} from 'lucide-react'
import { 
  getOwnedShares, 
  getSharedWithMe, 
  revokeCalendarShare,
  type CalendarShare
} from '@/lib/api/calendarShareApi'
import { toast } from 'sonner'

export default function SharesPage() {
  const queryClient = useQueryClient()

  // Fetch shares I own (sent to others)
  const { data: ownedShares = [], isLoading: loadingOwned } = useQuery({
    queryKey: ['calendar-shares', 'owned'],
    queryFn: getOwnedShares
  })

  // Fetch shares sent to me (received from others)
  const { data: receivedShares = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['calendar-shares', 'received'],
    queryFn: getSharedWithMe
  })

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: (shareId: string) => revokeCalendarShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-shares'] })
      toast.success("Share revoked successfully.")
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke share: ${error.message}`)
    }
  })

  const copyShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/calendar/shared/${shareToken}`
    navigator.clipboard.writeText(link)
    toast.success("Share link copied to clipboard!")
  }

  const openShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/calendar/shared/${shareToken}`
    window.open(link, '_blank')
  }

  const visitSharedCalendar = (shareToken: string) => {
    const link = `${window.location.origin}/calendar/shared/${shareToken}`
    window.open(link, '_blank')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Shares</h1>
          <p className="text-muted-foreground">
            Manage calendar sharing and view calendars shared with you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendars I've Shared (Outgoing) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              My Shared Calendars
            </CardTitle>
            <CardDescription>
              Calendars you've shared with others ({ownedShares.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOwned ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading your shared calendars...
              </div>
            ) : ownedShares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No calendars shared yet</p>
                <p className="text-sm">Click "Share Calendar" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ownedShares.map((share: CalendarShare) => (
                  <Card key={share.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{share.shared_with?.email}</span>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Shared {new Date(share.created_at).toLocaleDateString()}
                          </p>
                          
                          {/* Share Link */}
                          <div className="bg-muted rounded p-2 mt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <LinkIcon className="w-3 h-3" />
                              <code className="flex-1 break-all">
                                {`${window.location.origin}/calendar/shared/${share.share_token}`}
                              </code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(share.share_token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openShareLink(share.share_token)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeShareMutation.mutate(share.id)}
                            disabled={revokeShareMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendars Shared With Me (Incoming) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendars Shared With Me
            </CardTitle>
            <CardDescription>
              Calendars others have shared with you ({receivedShares.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReceived ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading shared calendars...
              </div>
            ) : receivedShares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No calendars shared with you yet</p>
                <p className="text-sm">Ask someone to share their calendar with you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedShares.map((share: CalendarShare) => (
                  <Card key={share.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{share.owner?.email}'s Calendar</span>
                            <Badge variant="outline" className="text-xs">
                              Received
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Shared {new Date(share.created_at).toLocaleDateString()}
                          </p>
                          
                          {/* Share Link */}
                          <div className="bg-muted rounded p-2 mt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <LinkIcon className="w-3 h-3" />
                              <code className="flex-1 break-all">
                                {`${window.location.origin}/calendar/shared/${share.share_token}`}
                              </code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(share.share_token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => visitSharedCalendar(share.share_token)}
                            size="sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calendars I've Shared</p>
                <p className="text-2xl font-bold">{ownedShares.length}</p>
              </div>
              <Share2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calendars Shared With Me</p>
                <p className="text-2xl font-bold">{receivedShares.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}