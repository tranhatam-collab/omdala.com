import Foundation

struct PlannerClient {
    func plan(intent: String) async throws -> [String] {
        [intent]
    }
}
