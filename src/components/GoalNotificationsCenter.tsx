import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { 
  Bell,
  BellRinging,
  Target,
  TrendUp,
  Users,
  Sparkle,
  Check,
  X,
  ArrowRight,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { GoalNotification } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface GoalNotificationsCenterProps {
  notifications: GoalNotification[]
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onDismiss: (notificationId: string) => void
}

export function GoalNotificationsCenter({ 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss 
}: GoalNotificationsCenterProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  
  const displayedNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MILESTONE':
        return <Target size={18} weight="duotone" className="text-success" />
      case 'CONTRIBUTION':
        return <TrendUp size={18} weight="duotone" className="text-primary" />
      case 'SHARED_FEEDBACK':
        return <Users size={18} weight="duotone" className="text-accent" />
      case 'OPTIMIZATION':
        return <Sparkle size={18} weight="duotone" className="text-accent" />
      case 'PRIORITY_CHANGE':
        return <ArrowRight size={18} weight="duotone" className="text-warning-foreground" />
      default:
        return <Bell size={18} weight="duotone" className="text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MILESTONE':
        return 'Milestone'
      case 'CONTRIBUTION':
        return 'Contribution'
      case 'SHARED_FEEDBACK':
        return 'Family Update'
      case 'OPTIMIZATION':
        return 'AI Recommendation'
      case 'PRIORITY_CHANGE':
        return 'Priority Update'
      default:
        return 'Notification'
    }
  }

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead(id)
    toast.success('Notification marked as read')
  }

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead()
    toast.success('All notifications marked as read')
  }

  const handleDismiss = (id: string) => {
    onDismiss(id)
    toast.info('Notification dismissed')
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={24} weight="duotone" />
            Notifications
          </CardTitle>
          <CardDescription>Stay updated on your goal progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <Bell size={32} weight="duotone" className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No notifications yet. We'll notify you about milestones, contributions, and more!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <BellRinging size={24} weight="duotone" className="text-accent" />
              ) : (
                <Bell size={24} weight="duotone" />
              )}
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <Check size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={showUnreadOnly ? 'outline' : 'default'}
            size="sm"
            onClick={() => setShowUnreadOnly(false)}
          >
            All
          </Button>
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowUnreadOnly(true)}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {displayedNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No {showUnreadOnly ? 'unread' : ''} notifications
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-card/50 border-border/50' 
                      : 'bg-accent/5 border-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 gap-1 text-xs"
                          >
                            <Check size={12} />
                            Mark read
                          </Button>
                        )}
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                          >
                            View details
                            <ArrowRight size={12} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(notification.id)}
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                        >
                          <X size={12} />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
