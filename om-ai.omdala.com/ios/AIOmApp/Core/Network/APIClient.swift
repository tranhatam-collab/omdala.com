import Foundation

enum APIClientError: Error {
    case invalidOrigin
    case invalidPath
    case destinationChanged
    case canonicalSessionBridgeUnavailable
}

struct APIClient {
    private let baseURL: URL

    init(baseURL: URL = URL(string: "https://api.omdala.com")!) {
        self.baseURL = baseURL
    }

    func get(path: String) async throws -> Data {
        guard Self.isAllowedOrigin(baseURL) else {
            throw APIClientError.invalidOrigin
        }
        guard path.hasPrefix("/"), !path.hasPrefix("//"), !path.contains("\\") else {
            throw APIClientError.invalidPath
        }
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw APIClientError.invalidPath
        }
        guard url.scheme == baseURL.scheme,
              url.host == baseURL.host,
              url.port == baseURL.port else {
            throw APIClientError.destinationChanged
        }
        _ = url
        throw APIClientError.canonicalSessionBridgeUnavailable
    }

    private static func isAllowedOrigin(_ url: URL) -> Bool {
        guard url.user == nil,
              url.password == nil,
              url.query == nil,
              url.fragment == nil,
              url.path.isEmpty || url.path == "/",
              let scheme = url.scheme,
              let host = url.host else {
            return false
        }

        if scheme == "https", url.port == nil,
           host == "api.omdala.com" || host == "api-staging.omdala.com" {
            return true
        }

        let loopbackHosts = Set(["localhost", "127.0.0.1", "::1"])
        return loopbackHosts.contains(host) && (scheme == "http" || scheme == "https")
    }
}
