import Foundation

struct ProofClient {
    func fetchProof(id: String) async throws -> [String: String] {
        ["proof_id": id]
    }
}
