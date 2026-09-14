import AppKit
import WebKit
import Security

let arguments = CommandLine.arguments
if arguments.count >= 3 && arguments[1].hasPrefix("--keychain-") {
    let helper = Process()
    helper.executableURL = Bundle.main.resourceURL!.appendingPathComponent("runtime/OMCODEKeychain")
    helper.arguments = Array(arguments[1...2])
    helper.standardInput = FileHandle.standardInput
    helper.standardOutput = FileHandle.standardOutput
    helper.standardError = FileHandle.standardError
    do { try helper.run(); helper.waitUntilExit(); exit(helper.terminationStatus) }
    catch { exit(1) }
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var runtime: Process?
    var currentOrigin: String?
    var ready = false
    var buffer = Data()
    var smokeStarted = false
    var quitting = false
    var smokePath: String? { if let index = arguments.firstIndex(of: "--smoke-test"), arguments.count > index + 1 { return arguments[index + 1] }; return nil }
    var nativeE2EPath: String? { if let index = arguments.firstIndex(of: "--native-e2e"), arguments.count > index + 1 { return arguments[index + 1] }; return nil }
    var verificationPath: String? { nativeE2EPath ?? smokePath }

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let image = NSImage(contentsOf: Bundle.main.resourceURL!.appendingPathComponent("AppIcon.png")) { NSApp.applicationIconImage = image }
        let appMenu = NSMenu()
        let menuItem = NSMenuItem()
        let submenu = NSMenu()
        submenu.addItem(withTitle: "Quit OMCODE", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menuItem.submenu = submenu
        appMenu.addItem(menuItem)
        let edit = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
        let editMenu = NSMenu(title: "Edit")
        for (name, action, key) in [("Undo", "undo:", "z"), ("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            editMenu.addItem(withTitle: name, action: Selector(action), keyEquivalent: key)
        }
        edit.submenu = editMenu
        appMenu.addItem(edit)
        NSApp.mainMenu = appMenu
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(self, name: "chooseProject")
        configuration.userContentController.addUserScript(WKUserScript(source: "window.__omcodeErrors=[];window.addEventListener('error',e=>window.__omcodeErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__omcodeErrors.push(String(e.reason)));", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1380, height: 860), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "OMCODE"
        window.delegate = self
        window.minSize = NSSize(width: 800, height: 560)
        window.center()
        window.contentView = webView
        webView.loadHTMLString("<html><body style='font:16px -apple-system;padding:40px'>OMCODE đang khởi động...</body></html>", baseURL: nil)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        startRuntime()
    }
    func startRuntime() {
        guard let resources = Bundle.main.resourceURL else { return showError("Không tìm thấy runtime.") }
        let process = Process()
        process.executableURL = resources.appendingPathComponent("runtime/node")
        process.arguments = [resources.appendingPathComponent("app/server/index.mjs").path]
        process.currentDirectoryURL = resources.appendingPathComponent("app")
        var env = ProcessInfo.processInfo.environment
        env["OMCODE_NATIVE_PATH"] = Bundle.main.executablePath
        env["OMCODE_KEYCHAIN_PATH"] = resources.appendingPathComponent("runtime/OMCODEKeychain").path
        env["NODE_NO_WARNINGS"] = "1"
        env["PATH"] = resources.appendingPathComponent("runtime").path + ":/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:"
            + NSHomeDirectory() + "/.npm-global/bin:"
            + NSHomeDirectory() + "/.nvm/versions/node/v24.15.0/bin"
        process.environment = env
        let output = Pipe()
        process.standardOutput = output
        process.standardError = FileHandle.nullDevice
        output.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if data.isEmpty { return }
            DispatchQueue.main.async {
                guard let self = self, !self.ready else { return }
                self.buffer.append(data)
                if let line = String(data: self.buffer, encoding: .utf8)?.components(separatedBy: "\n").first,
                   let encoded = line.data(using: .utf8),
                   let value = try? JSONSerialization.jsonObject(with: encoded) as? [String: Any],
                   let url = value["url"] as? String, let token = value["token"] as? String,
                   let target = URL(string: url + "/#" + token) {
                    self.ready = true
                    self.currentOrigin = url
                    self.webView.load(URLRequest(url: target))
                    output.fileHandleForReading.readabilityHandler = nil
                }
            }
        }
        process.terminationHandler = { [weak self] _ in DispatchQueue.main.async { self?.showError("Runtime đã dừng. Mở lại OMCODE để tiếp tục; lịch sử được giữ lại.") } }
        do { try process.run(); runtime = process }
        catch { showError("Không khởi động được runtime: " + error.localizedDescription) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
            guard let self = self, !self.ready else { return }
            self.showError("Runtime chưa sẵn sàng sau 20 giây.")
        }
    }
    func showError(_ text: String) {
        if let output = verificationPath {
            let data = try? JSONSerialization.data(withJSONObject: ["ok": false, "error": text])
            try? data?.write(to: URL(fileURLWithPath: output))
            NSApp.terminate(nil)
            return
        }
        let alert = NSAlert()
        alert.messageText = "OMCODE"
        alert.informativeText = text
        alert.runModal()
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let output = verificationPath, ready, !smokeStarted else { return }
        smokeStarted = true
        if nativeE2EPath != nil { return runNativeE2E(output) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
            let script = "JSON.stringify({title:document.title,app:!!document.querySelector('.app-shell'),buttons:document.querySelectorAll('button').length,provider:document.querySelector('[aria-label=\\\"Nhà cung cấp AI\\\"]')?.value,model:document.querySelector('[aria-label=\\\"Mô hình AI\\\"]')?.value,error:document.querySelector('.error-banner')?.textContent||'',errors:window.__omcodeErrors,overflow:document.documentElement.scrollWidth>innerWidth,width:innerWidth,height:innerHeight})"
            self.webView.evaluateJavaScript(script) { value, error in
                guard error == nil, let string = value as? String, let data = string.data(using: .utf8), var receipt = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return self.showError("Không đọc được trạng thái WebKit native: " + (error?.localizedDescription ?? "unknown")) }
                receipt["ok"] = receipt["app"] as? Bool == true && receipt["error"] as? String == "" && receipt["overflow"] as? Bool == false
                receipt["backendPID"] = self.runtime?.processIdentifier
                receipt["bundle"] = Bundle.main.bundlePath
                if let encoded = try? JSONSerialization.data(withJSONObject: receipt, options: [.prettyPrinted, .sortedKeys]) { try? encoded.write(to: URL(fileURLWithPath: output)) }
                self.webView.takeSnapshot(with: nil) { image, _ in
                    if let image = image, let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) { try? png.write(to: URL(fileURLWithPath: output + ".png")) }
                    NSApp.terminate(nil)
                }
            }
        }
    }
    func runNativeE2E(_ output: String) {
        let command = ProcessInfo.processInfo.environment["OMCODE_NATIVE_E2E_COMMAND"] ?? ""
        guard !command.isEmpty else { return showError("Thiếu lệnh kiểm thử native.") }
        let script = """
        const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const waitFor = async (read, label, timeout = 45000) => {
          const deadline = Date.now() + timeout;
          while (Date.now() < deadline) {
            const value = read();
            if (value) return value;
            await pause(100);
          }
          throw new Error(`Native E2E timeout: ${label}`);
        };
        const setValue = (element, value) => {
          const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        };
        await waitFor(() => document.querySelector('.app-shell'), 'app shell');
        const prompt = await waitFor(() => document.querySelector('[aria-label="Yêu cầu AI"]'), 'agent prompt');
        setValue(prompt, "Dùng read_file đọc README.md, rồi propose_edit tạo hello-native.mjs với nội dung console.log('OMCODE_NATIVE_E2E_OK'); và một dòng xuống dòng. Không chạy lệnh; chờ tôi duyệt.");
        await pause(100);
        const send = await waitFor(() => document.querySelector('[aria-label="Gửi yêu cầu AI"]:not([disabled])'), 'send button');
        send.click();
        const summary = await waitFor(() => document.querySelector('.proposal summary'), 'edit proposal');
        summary.click();
        const apply = await waitFor(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Áp dụng bản sửa' && !button.disabled), 'apply button');
        apply.click();
        await waitFor(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Đã áp dụng'), 'approved write');
        const terminal = await waitFor(() => document.querySelector('[aria-label="Lệnh terminal"]'), 'terminal input');
        setValue(terminal, command);
        await pause(100);
        const run = await waitFor(() => document.querySelector('[aria-label="Chạy lệnh"]:not([disabled])'), 'run command');
        run.click();
        const terminalOutput = await waitFor(() => {
          const text = document.querySelector('.terminal-output')?.textContent || '';
          return text.includes('OMCODE_NATIVE_E2E_OK') && text.includes('[exit 0]') ? text : '';
        }, 'successful command');
        return JSON.stringify({
          title: document.title,
          app: !!document.querySelector('.app-shell'),
          provider: document.querySelector('[aria-label="Nhà cung cấp AI"]')?.value,
          model: document.querySelector('[aria-label="Mô hình AI"]')?.value,
          approvedWrite: true,
          generatedFileExecuted: terminalOutput.includes('OMCODE_NATIVE_E2E_OK'),
          errors: window.__omcodeErrors,
          overflow: document.documentElement.scrollWidth > innerWidth,
          checks: ['native-wkwebview', 'agent-read-file', 'agent-propose-edit', 'user-approved-write', 'terminal-execution']
        });
        """
        webView.callAsyncJavaScript(script, arguments: ["command": command], in: nil, in: .page) { result in
            switch result {
            case .success(let value):
                guard let string = value as? String, let data = string.data(using: .utf8), var receipt = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return self.showError("Không đọc được receipt native E2E.") }
                let errors = receipt["errors"] as? [Any] ?? []
                receipt["ok"] = receipt["app"] as? Bool == true && receipt["approvedWrite"] as? Bool == true && receipt["generatedFileExecuted"] as? Bool == true && errors.isEmpty
                receipt["backendPID"] = self.runtime?.processIdentifier
                receipt["bundle"] = Bundle.main.bundlePath
                if let encoded = try? JSONSerialization.data(withJSONObject: receipt, options: [.prettyPrinted, .sortedKeys]) { try? encoded.write(to: URL(fileURLWithPath: output)) }
                self.webView.takeSnapshot(with: nil) { image, _ in
                    if let image = image, let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) { try? png.write(to: URL(fileURLWithPath: output + ".png")) }
                    NSApp.terminate(nil)
                }
            case .failure(let error): self.showError("Native E2E lỗi: " + error.localizedDescription)
            }
        }
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "chooseProject", message.frameInfo.isMainFrame,
            let url = message.frameInfo.request.url, let origin = currentOrigin,
            url.absoluteString.hasPrefix(origin + "/") else { return }
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.beginSheetModal(for: window) { response in
            guard response == .OK, let selected = panel.url else { return }
            let data = try! JSONSerialization.data(withJSONObject: ["path": selected.path])
            let json = String(data: data, encoding: .utf8)!
            self.webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('omcode:project', {detail: " + json + "}))")
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { return decisionHandler(.cancel) }
        if url.scheme == "about" || (currentOrigin != nil && url.absoluteString.hasPrefix(currentOrigin! + "/")) { return decisionHandler(.allow) }
        if navigationAction.navigationType == .linkActivated && ["https", "http"].contains(url.scheme ?? "") { NSWorkspace.shared.open(url) }
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "OMCODE"
        alert.informativeText = message
        alert.addButton(withTitle: "Tiếp tục")
        alert.addButton(withTitle: "Hủy")
        alert.beginSheetModal(for: window) { response in completionHandler(response == .alertFirstButtonReturn) }
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "OMCODE"
        alert.informativeText = message
        alert.beginSheetModal(for: window) { _ in completionHandler() }
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool { NSApp.terminate(nil); return false }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        guard ready, webView != nil, runtime?.isRunning == true else { return .terminateNow }
        if quitting { return .terminateCancel }
        quitting = true
        webView.callAsyncJavaScript("return await window.omcodeFlushDraft?.()", arguments: [:], in: nil, in: .page) { result in
            switch result {
            case .success: sender.reply(toApplicationShouldTerminate: true)
            case .failure(let error):
                self.quitting = false
                let alert = NSAlert()
                alert.messageText = "Chưa lưu được bản nháp"
                alert.informativeText = error.localizedDescription
                alert.addButton(withTitle: "Tiếp tục chỉnh sửa")
                alert.runModal()
                sender.reply(toApplicationShouldTerminate: false)
            }
        }
        return .terminateLater
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) { runtime?.terminationHandler = nil; runtime?.terminate() }
}
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
