import type { MatchSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'
import type { MatchingService, MatchingStubOptions } from './contracts'

function buildNodeSuggestion(node: NodeRecord, title: string, summary: string, score: number): MatchSuggestion {
  return {
    id: `${node.id}-${score}-${title.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'offer_activation',
    score,
    title,
    summary,
    nextAction: '/resources/new',
  }
}

function rankSuggestionsInternal(suggestions: MatchSuggestion[], limit: number): MatchSuggestion[] {
  return [...suggestions].sort((a, b) => b.score - a.score).slice(0, limit)
}

export function createMatchingServiceStub(options: MatchingStubOptions = {}): MatchingService {
  const defaultLimit = options.defaultLimit ?? 5

  return {
    getNodeSuggestions(node: NodeRecord, resources: ResourceRecord[]): MatchSuggestion[] {
      const suggestions: MatchSuggestion[] = [
        buildNodeSuggestion(
          node,
          'Đóng gói một đề nghị công khai mạnh hơn',
          'Biến phần rõ giá trị nhất của nút này thành một đề nghị có cấu trúc, có bằng chứng và có sẵn khả dụng.',
          88,
        ),
      ]

      if (resources.some((resource) => resource.resourceType === 'space')) {
        suggestions.push({
          id: `${node.id}-space-activation`,
          type: 'distribution',
          score: 84,
          title: 'Kích hoạt công suất không gian',
          summary: 'Tài nguyên không gian hiện đã có và có thể chuyển thành một luồng tiếp đón sẵn sàng cho đặt lịch.',
          nextAction: '/resources',
        })
      }

      if (node.proofCount < 3) {
        suggestions.push({
          id: `${node.id}-trust-upgrade`,
          type: 'trust_upgrade',
          score: 78,
          title: 'Tăng mật độ bằng chứng',
          summary: 'Niềm tin là đòn bẩy nhanh nhất để cải thiện chất lượng ghép nối cho nút này.',
          nextAction: '/profile',
        })
      }

      return rankSuggestionsInternal(suggestions, defaultLimit)
    },

    getResourceSuggestions(resource: ResourceRecord, node: NodeRecord): MatchSuggestion[] {
      const suggestions: MatchSuggestion[] = [
        {
          id: `${resource.id}-activation`,
          type: 'offer_activation',
          score: 82,
          title: `Kích hoạt ${resource.title}`,
          summary: 'Biến tài nguyên này thành một đề nghị công khai với tính sẵn có rõ ràng hơn và tín hiệu niềm tin mạnh hơn.',
          nextAction: `/resources/${resource.id}/edit`,
        },
      ]

      if (resource.resourceType === 'skill' || resource.resourceType === 'knowledge') {
        suggestions.push({
          id: `${resource.id}-collaboration`,
          type: 'collaboration',
          score: 79,
          title: 'Đóng gói thành một quy trình chuyên gia',
          summary: `${node.name} có thể dùng tài nguyên này trong một định dạng tư vấn hoặc triển khai với mức niềm tin cao hơn.`,
          nextAction: `/nodes/${node.id}`,
        })
      }

      if (resource.resourceType === 'space') {
        suggestions.push({
          id: `${resource.id}-distribution`,
          type: 'distribution',
          score: 81,
          title: 'Chuẩn bị cho luồng đặt chỗ theo địa điểm',
          summary: 'Tài nguyên không gian sẽ mạnh hơn khi có quy tắc, khung giờ và trạng thái đặt chỗ được hậu thuẫn bằng niềm tin.',
          nextAction: `/resources/${resource.id}/edit`,
        })
      }

      return rankSuggestionsInternal(suggestions, defaultLimit)
    },

    rankSuggestions(suggestions: MatchSuggestion[], limit?: number): MatchSuggestion[] {
      return rankSuggestionsInternal(suggestions, limit ?? defaultLimit)
    },
  }
}
