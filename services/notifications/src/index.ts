import type { NodeRecord, NotificationRecord } from '@omdala/types'

export function getInboxNotifications(node: NodeRecord): NotificationRecord[] {
  return [
    {
      id: 'notif-trust-proof',
      type: 'trust',
      title: 'Niềm tin có thể tăng thêm một bậc',
      summary: `${node.name} đã có đủ hoạt động để yêu cầu thêm một bằng chứng xác minh trong tuần này.`,
      href: '/resources',
      priority: 'high',
      read: false,
    },
    {
      id: 'notif-offer-follow-up',
      type: 'follow_up',
      title: 'Đề nghị nháp vẫn cần được đóng gói lại',
      summary: 'Một đề nghị vẫn đang ở trạng thái nháp và nên được làm chặt hơn trước khi phân phối rộng hơn.',
      href: '/offers',
      priority: 'normal',
      read: false,
    },
    {
      id: 'notif-match-review',
      type: 'match',
      title: 'Một ghép nối cộng tác đã sẵn sàng để rà soát',
      summary: 'Một đối tượng ghép nối mới đang phù hợp với mức niềm tin hiện tại và năng lực sẵn có của nút.',
      href: '/requests',
      priority: 'normal',
      read: true,
    },
  ]
}
