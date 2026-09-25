import Foundation
import Security

// Keep this helper's signed binary stable across UI builds.
SecKeychainSetUserInteractionAllowed(false)
let args = CommandLine.arguments
guard args.count == 3, ["--keychain-get", "--keychain-set"].contains(args[1]),
      args[2].range(of: "^[a-zA-Z0-9_-]{1,80}$", options: .regularExpression) != nil else { exit(2) }
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "com.omdala.omcode.providers.v1",
    kSecAttrAccount as String: args[2]
]
if args[1] == "--keychain-set" {
    let secret = FileHandle.standardInput.readDataToEndOfFile()
    guard !secret.isEmpty, secret.count <= 16384 else { exit(2) }
    var status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: secret] as CFDictionary)
    if status == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = secret
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        status = SecItemAdd(item as CFDictionary, nil)
    }
    if status != errSecSuccess { FileHandle.standardError.write(Data(("Keychain status " + String(status)).utf8)) }
    exit(status == errSecSuccess ? 0 : 1)
}
var request = query
request[kSecReturnData as String] = true
request[kSecMatchLimit as String] = kSecMatchLimitOne
var item: CFTypeRef?
let status = SecItemCopyMatching(request as CFDictionary, &item)
if status == errSecSuccess, let secret = item as? Data {
    FileHandle.standardOutput.write(secret)
    exit(0)
}
if status == errSecItemNotFound { exit(3) }
FileHandle.standardError.write(Data(("Keychain status " + String(status)).utf8))
exit(1)
