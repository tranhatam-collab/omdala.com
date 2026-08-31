import {
  OM_AI_PROVIDER_CAPABILITIES,
  resolveOmAiProviderRoute,
} from "@omdala/core";
import type {
  AiActionSuggestion,
  NodeRecord,
  OmAiProviderRouteDecision,
  ResourceRecord,
} from "@omdala/types";

function scorePriority(priority: AiActionSuggestion['priority']): number {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

export function getAiActionSuggestions(
  node: NodeRecord,
  resources: ResourceRecord[],
): AiActionSuggestion[] {
  const primaryResource = resources[0]
  const suggestions: AiActionSuggestion[] = [
    {
      id: 'ai-plan-activation',
      mode: 'planner',
      title: 'Đóng gói tài nguyên mạnh nhất thành một đề nghị cao cấp',
      summary: primaryResource
        ? `${primaryResource.title} là ứng viên rõ ràng nhất cho đề nghị công khai tiếp theo của ${node.name}.`
        : `Hãy xác định đề nghị có cấu trúc đầu tiên mà ${node.name} có thể đưa ra thị trường.`,
      nextAction: '/offers/new',
      priority: 'high',
      confidence: 0.84,
      rationale: 'Lớp đề nghị là cách mở khóa giá trị nhanh nhất từ các tài nguyên hiện đang sẵn có.',
    },
    {
      id: 'ai-operator-proof',
      mode: 'operator',
      title: 'Thu thập thêm một bằng chứng trước khi mở rộng phân phối',
      summary: 'Củng cố niềm tin trước khi mở bề mặt tiếp theo cho lưu lượng công khai có giới hạn.',
      nextAction: '/resources',
      priority: node.proofCount < 3 ? 'high' : 'medium',
      confidence: node.proofCount < 3 ? 0.88 : 0.74,
      rationale: 'Mật độ bằng chứng ảnh hưởng trực tiếp đến niềm tin và chất lượng chuyển đổi của ghép nối.',
    },
    {
      id: 'ai-analyst-demand',
      mode: 'analyst',
      title: 'Rà soát các nhu cầu đang mở và đối chiếu với năng lực hiện tại',
      summary: 'Dùng tín hiệu từ nhu cầu để quyết định nên tối ưu cho tốc độ, niềm tin hay độ phù hợp.',
      nextAction: '/requests',
      priority: 'medium',
      confidence: 0.79,
      rationale: 'Tín hiệu từ phía nhu cầu sẽ dẫn đường cho việc ưu tiên đề nghị nào ở bước tiếp theo.',
    },
  ]

  return suggestions.sort((a, b) => {
    const priorityDiff = scorePriority(b.priority) - scorePriority(a.priority)
    if (priorityDiff !== 0) return priorityDiff
    return (b.confidence ?? 0) - (a.confidence ?? 0)
  })
}

export function getOmAiProviderRoutingSnapshot(): OmAiProviderRouteDecision[] {
  return Object.values(OM_AI_PROVIDER_CAPABILITIES).map((capability) =>
    resolveOmAiProviderRoute(capability),
  );
}
