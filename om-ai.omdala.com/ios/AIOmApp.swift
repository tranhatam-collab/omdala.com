import SwiftUI

struct OmAIApp: App {
    var body: some Scene {
        WindowGroup {
            OmAIRootView()
        }
    }
}

struct OmAIRootView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("Om AI")
                .font(.largeTitle)
            Text("Trusted execution cockpit")
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}
