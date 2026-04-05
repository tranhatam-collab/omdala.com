import Foundation

struct ApprovalClient {
    func confirm(id: String) async throws -> Bool {
        _ = id
        return true
    }
}
