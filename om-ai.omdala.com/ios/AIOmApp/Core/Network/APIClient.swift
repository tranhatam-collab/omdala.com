import Foundation

struct APIClient {
    func get(path: String) async throws -> Data {
        let url = URL(string: path)!
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}
