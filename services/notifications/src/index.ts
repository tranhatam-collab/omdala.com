import type { NodeRecord, NotificationRecord } from '@omdala/types'

export function getInboxNotifications(node: NodeRecord): NotificationRecord[] {
  return [
    {
      id: 'notif-trust-proof',
      type: 'trust',
      title: 'Trust can move one level higher',
      summary: `${node.name} has enough activity to request one more verification proof this week.`,
      href: '/resources',
      priority: 'high',
      read: false,
    },
    {
      id: 'notif-offer-follow-up',
      type: 'follow_up',
      title: 'Draft offer still needs packaging',
      summary: 'One offer is still in draft and should be tightened before broader distribution.',
      href: '/offers',
      priority: 'normal',
      read: false,
    },
    {
      id: 'notif-match-review',
      type: 'match',
      title: 'A collaboration match is ready for review',
      summary: 'A new match candidate aligns with current node trust and available capacity.',
      href: '/requests',
      priority: 'normal',
      read: true,
    },
  ]
}
