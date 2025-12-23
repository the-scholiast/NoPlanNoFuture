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
  Link as LinkIcon,
  Monitor
} from 'lucide-react'
import {
  getOwnedShares,
  getSharedWithMe,
  revokeCalendarShare,
  type CalendarShare,
  getEinkDevices,
  createEinkDevice,
  updateEinkDevice,
  deleteEinkDevice,
  type EinkDevice
} from '@/lib/api/calendarShareApi'
import { toast } from 'sonner'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SharesPage() {
  const queryClient = useQueryClient()
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceToken, setNewDeviceToken] = useState<string | null>(null)

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

  // Fetch e-ink devices
  const { data: einkDevices = [], isLoading: loadingDevices } = useQuery({
    queryKey: ['eink-devices'],
    queryFn: getEinkDevices
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

  // Create e-ink device mutation
  const createDeviceMutation = useMutation({
    mutationFn: (deviceName: string) => createEinkDevice(deviceName),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ['eink-devices'] })
      setNewDeviceToken(device.device_token)
      setNewDeviceName('')
      toast.success("Device created successfully. Copy the token now - it won't be shown again!")
    },
    onError: (error: Error) => {
      toast.error(`Failed to create device: ${error.message}`)
    }
  })

  // Update e-ink device mutation
  const updateDeviceMutation = useMutation({
    mutationFn: ({ deviceId, updates }: { deviceId: string; updates: Partial<EinkDevice> }) =>
      updateEinkDevice(deviceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eink-devices'] })
      toast.success("Device updated successfully.")
    },
    onError: (error: Error) => {
      toast.error(`Failed to update device: ${error.message}`)
    }
  })

  // Delete e-ink device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => deleteEinkDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eink-devices'] })
      toast.success("Device deleted successfully.")
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete device: ${error.message}`)
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

  const copyDeviceToken = (deviceToken: string) => {
    navigator.clipboard.writeText(deviceToken)
    toast.success("Device token copied to clipboard!")
  }

  const handleCreateDevice = () => {
    if (!newDeviceName.trim()) {
      toast.error("Device name is required")
      return
    }
    createDeviceMutation.mutate(newDeviceName.trim())
  }

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-y-auto min-h-0">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Shares</h1>
          <p className="text-muted-foreground">
            Manage calendar sharing and view calendars shared with you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendars I've Shared (Outgoing) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              My Shared Calendars
            </CardTitle>
            <CardDescription>
              {"Calendars you've shared with others"} ({ownedShares.length})
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
                <p className="text-sm">{"Click 'Share Calendar' to get started"}</p>
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
                            <span className="font-medium">{`${share.owner?.email}'s Calendar`}</span>
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

        {/* E-ink Devices Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              E-ink Devices
            </CardTitle>
            <CardDescription>
              Manage your e-ink display devices ({einkDevices.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
          {/* Create New Device */}
          <div className="mb-3 p-2 border rounded-lg bg-muted/50">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Device name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDevice()}
                className="flex-1 h-8 text-sm"
              />
              <Button
                onClick={handleCreateDevice}
                disabled={createDeviceMutation.isPending || !newDeviceName.trim()}
                size="sm"
                className="h-8"
              >
                Create
              </Button>
            </div>
            {newDeviceToken && (
              <div className="mt-2 p-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-xs font-medium mb-1">Token (copy now):</p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 break-all text-[10px] bg-white dark:bg-gray-800 p-1 rounded">
                    {newDeviceToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5"
                    onClick={() => {
                      copyDeviceToken(newDeviceToken)
                      setNewDeviceToken(null)
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Device List */}
          {loadingDevices ? (
            <div className="text-center py-2 text-muted-foreground text-xs">
              Loading...
            </div>
          ) : einkDevices.length === 0 ? (
            <div className="text-center py-2 text-muted-foreground">
              <p className="text-xs">No devices yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {einkDevices.map((device: EinkDevice) => (
                <Card key={device.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{device.device_name}</span>
                          <Select
                            value={device.view_type}
                            onValueChange={(value: 'weekly' | 'dual_weekly' | 'dual_monthly' | 'dual_yearly' | 'monthly_square' | 'monthly_re') =>
                              updateDeviceMutation.mutate({ deviceId: device.id, updates: { view_type: value } })
                            }
                            disabled={updateDeviceMutation.isPending}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="dual_weekly">Dual Weekly</SelectItem>
                              <SelectItem value="dual_monthly">Dual Monthly</SelectItem>
                              <SelectItem value="dual_yearly">Dual Yearly</SelectItem>
                              <SelectItem value="monthly_square">Monthly Square</SelectItem>
                              <SelectItem value="monthly_re">Monthly RE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="bg-muted rounded p-1.5 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <code className="flex-1 break-all text-[10px] truncate">
                              {device.device_token}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 flex-shrink-0"
                              onClick={() => copyDeviceToken(device.device_token)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={() => deleteDeviceMutation.mutate(device.id)}
                        disabled={deleteDeviceMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
                <p className="text-sm text-muted-foreground">{`Calendars I've Shared`}</p>
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