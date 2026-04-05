import Foundation

@MainActor
final class AppStore: ObservableObject {
    @Published var selectedSpaceId: String?
}
