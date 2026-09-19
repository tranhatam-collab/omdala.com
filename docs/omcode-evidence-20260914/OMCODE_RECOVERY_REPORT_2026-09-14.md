# OMCODE: Khoi Phuc, Kiem Thu Va Gioi Han

Ngay kiem tra: 14/09/2026, Asia/Ho_Chi_Minh.

## Ket Luan

Da tao va cai OMCODE Desktop 0.2.0 doc lap voi cac ung dung AI IDE khac. Phan local da duoc kiem thu, nhung khong the ket luan toan bo ung dung dev tren may da duoc sua hoan toan, hoac khong con bat ky loi nao.

AI mac dinh duoc chon la Google Gemini 3.1 Flash Lite, da qua E2E tren dung bundle da cai luc 01:11 ngay 14/09/2026, voi catalog that 345 skills va 5 MCP. Gemini 3.8 co E2E pass truoc do nhung cac luot sau gap HTTP 429. Khong coi mot lan pass la bao dam quota luon con.

## Vi Tri

| Thanh phan | Duong dan |
|---|---|
| Ung dung | /Users/tranhatam/Applications/OMCODE.app |
| Source da khoi phuc | /Users/tranhatam/Developer/OMCODE/source |
| Module desktop moi | /Users/tranhatam/Developer/OMCODE/source/apps/omcode-desktop |
| Du lieu, lich su, ban nhap, ban luu tep, skills | /Users/tranhatam/Library/Application Support/OMCODE |
| Launcher | /Users/tranhatam/.local/bin/omcode |
| Manifest cai dat | /Users/tranhatam/Developer/OMCODE/installation-receipt.json |
| Bang chung kiem thu | /Users/tranhatam/Developer/OMCODE/evidence |

Alias omcode trong ~/.zshrc da duoc doi dung mot dong. Ban truoc sua duoc giu tai:

/Users/tranhatam/Library/Application Support/OMCODE/repair-backups/2026-09-13T17-51-00-818Z/.zshrc.before-omcode

Ban OMCODE vua cai truoc ban sua Keychain duoc giu tai:

/Users/tranhatam/Developer/OMCODE/repair-backups/2026-09-13T18-00-03-125Z

Khong tu dong phuc hoi de len cac du lieu moi. Muon rollback can dong OMCODE va doi chieu manifest truoc.

## Nhung Gi Thuc Su Da Sua

1. Tach OMCODE thanh module desktop rieng: AppKit/WKWebView, React, CodeMirror, backend Node kem trong bundle. Khong can chay Devin, OpenCode, Codex, Claude hay OpenClaw.
2. Bo phu thuoc launcher cu nam trong Documents. Launcher cu chi cho 4 giay va nhan bat ky tien trinh o cong 3000 la app; ban moi cho backend bao san sang va dung cong loopback ngau nhien.
3. Sua cau hinh model Google: chuan hoa tien to models/ va su dung model thuc su co trong danh sach tai khoan.
4. Tach Keychain thanh helper ky ma on dinh. Ban rebuild native ban dau khong doc duoc khoa vi nhan dang chu ky da thay doi; loi nay da duoc tai hien, sua va kiem tra tren duong dan app da cai.
5. Khi khong doc duoc Keychain, app dung va bao loi ro rang, khong gui yeu cau AI thieu khoa.
6. Them ban nhap ben vung, khoi phuc sau tai lai, cho luu ban nhap khi dong native app, luu ban truoc/sau chinh sua va kiem tra hash de tranh ghi de thay doi ben ngoai.
7. AI chi de xuat sua tep/lenh. Nguoi dung phai duyet sua tep; lenh phai duoc bam chay. Khong co API xoa tep.
8. Them giao dien sang/toi, explorer, editor, lich su, Git status/diff, agent, skills va ket noi.

Keychain moi: com.omdala.omcode.providers.v1. Ba khoa Google/DeepSeek/Cerebras da duoc sao chep trong pham vi OMCODE tu service cu; service cu van duoc giu. Khong in khoa, khong ghi khoa vao source/receipt. Khong chuyen OAuth cua ung dung khac.

Nhan dang chu ky va quyen Keychain co lien quan truc tiep theo [Apple: Code Signing Requirements](https://developer.apple.com/documentation/technotes/tn3127-inside-code-signing-requirements). Helper on dinh la bien phap cho ban cai local; ban phat hanh rong van can quy trinh ky/notarize phu hop.

## Danh Tinh Source

- Repo remote: https://github.com/tranhatam-collab/omdala.com
- Nhanh phuc hoi: OMCODE/go-live-e2e-20260829.
- Upstream base: 415927e5f1580d539013b55765dfba834de655e7.
- Nhanh local: codex/omcode-local-recovery-20260913.
- Module moi chua commit/push; khong deploy production.
- Source digest cua ban cai: 8f8b34d4655656762924580b68e0fe89462536183c16598444d08d771a843ca6.
- Manifest tung tep va hash binary/helper nam trong installation-receipt.json.

Quan trong: source Documents goc van khong doc on dinh. Thay doi local chua commit o do CHUA duoc doi chieu. Ban phuc hoi tu remote KHONG duoc goi la ban local moi nhat da hop nhat day du.

## Kiem Thu

| Lop bang chung | Ket qua |
|---|---|
| Backend Node | 10/10, gom suite tong va test con; khong failure |
| Chromium/WebKit | 20/20 luong, desktop 1440x900 va mobile 390x844 |
| Ban nhap | Khoi phuc sau reload/restart, tep goc khong bi ghi khi chi luu nhap |
| AI fixture | Tool call, de xuat, duyet, ghi tep, thuc thi, lich su |
| AI that | Da qua voi Google gemini-3.8-flash; xem them trang thai moi nhat |
| Bundle da cai | Da qua E2E voi Node/backend/frontend/Keychain that trong OMCODE.app |
| Native WKWebView | App mo, dung provider/model, khong overflow va khong loi JS trong smoke test |
| Chu ky local | codesign --verify --deep --strict: pass |
| Dependency audit | npm audit --omit=dev: 0 lo hong da biet tai thoi diem kiem tra |
| MCP tai lieu Cloudflare | List 2 tools va goi search_cloudflare_documentation thanh cong |

Test browser bao gom sua va luu tep that, terminal that, duyet ban sua AI, chay tep AI tao ra, tim skills, danh sach model, lich su phien, theme va dieu huong mobile.

Khong suy rong cac test tren thanh bao dam tat ca project, tat ca model, tat ca skill va moi tinh huong E2E deu pass.

## AI Sau Cai Dat

**VERIFIED_CURRENT cho luong da thu:** gemini-3.1-flash-lite, WebKit, Node/backend/frontend/helper trong app da cai, catalog 345 skills va 5 MCP, read_file va propose_edit thanh cong, nguoi dung duyet ghi tep, tep sinh ra chay thanh cong trong terminal.

Receipt cuoi: omcode-installed-e2e.json, timestamp 2026-09-13T18:11:22.778Z. Da doi mac dinh sang model nay; khong goi day la model thong minh nhat, ma la model nhe hon da kiem chung chay duoc bang tai khoan hien co.

- DeepSeek: danh sach model truy cap duoc, nhung sinh noi dung tra HTTP 402 / Insufficient Balance.
- Cerebras: danh sach model truy cap duoc, nhung hai model da thu tra HTTP 402.
- Google: da co E2E thanh cong; cac lan goi sau xuat hien HTTP 429. Mot yeu cau nho sau thoi gian cho tra HTTP 200, nhung khong du de ket luan luong agent day du da het gioi han.
- Khong thay doi goi dich vu, khong mua quota, khong tu dong chuyen OAuth/subscription cua ung dung khac thanh API key.

## Tools Va Skills

- 345 skill khac nhau da duoc sao chep va luu provenance/hash.
- Day la thu vien huong dan va tai nguyen. Khong co bang chung 345 skill da duoc E2E rieng; mot so con can dich vu/quyen/cong cu tuong ung.
- 7 vai tro: coder, reviewer, planner, debugger, tester, architect, documenter. Day la 7 che do cua agent, khong phai 7 tai khoan AI doc lap.
- Gioi han 1 agent dong thoi va 6 vong tool moi luot de kiem soat tai nguyen.
- 5 MCP da nhap cau hinh. Chi cloudflare-docs hien ket noi duoc; cloudflare, cloudflare-bindings, cloudflare-builds, cloudflare-observability con can ket noi/xac thuc rieng.
- Ban nay chua co luong OAuth day du cho MCP quan tri. Khong sao chep OAuth Codex de gia lap quyen cua OMCODE.

## Audit Cac Ung Dung Khac

| Ung dung/CLI | Da xac minh | Gioi han |
|---|---|---|
| Devin 3.10.23 | Bundle, cau hinh workspace, log gan nhat | Chua E2E tai khoan va thao tac dev trong giao dien |
| OpenCode 1.18.4 | Binary chay; danh sach 17 Copilot model khi bo bien Cloudflare trong tien trinh thu | Chua sua auth/cau hinh ben vung; chua E2E desktop |
| Cursor 3.18.25, VS Code 1.129.1 | Bundle/version | Khong phai bang chung workflow dev hoan chinh |
| Claude 1.52386.0 | Bundle/version | Chua E2E tai khoan |
| Claude Code | npm 2.1.129 va native 2.1.119 cung ton tai | Hai phien ban; chua tu y go ban nao |
| Codex CLI 0.153.4 | Version pass, giu nguyen du lieu host | Chua reset hay don phien dang chay |
| Cursor Agent, Cline, Goose, Grok, OpenClaw | Lenh version pass | Chua xac minh moi provider/tool |
| LM Studio, Docker, Xcode, Developer | Bundle/version | Khong khoi dong/xoa simulator, image, volume, model |

Danh sach day du, duong dan va version nam trong system-inventory.json. Pham vi nay la cac ung dung dev da phat hien o Applications va cac CLI coding da biet, khong phai bang chung quet moi executable tren o dia.

## Vi Sao Nhieu App Cung Loi

Khong co du bang chung de gan moi loi cho mot lan xoa cache. Nhung nguyen nhan da quan sat:

- Documents/FileProvider: mot phep doc package.json goc co gioi han 8 giay van timeout. Mot so tep co co dataless. Chua ket luan chi iCloud la nguyen nhan duy nhat; quyen truy cap va tinh trang FileProvider can xu ly rieng.
- OpenCode: shell export Cloudflare account/gateway nhung provider khong co token tuong ung trong moi truong. Bo hai bien trong dung tien trinh thu thi model listing chay lai. Day la loi cau hinh provider, khong phai binary mat.
- Devin: session/workspace rong co the tang indexing; log gan nhat co ptyHost heartbeat miss. Code 15 khi shutdown khong phai bang chung crash code 5. Anh chup code 5 tu thang 7 khong du de ket luan loi GPU/OOM hien tai.
- OMCODE cu: launcher Documents, cong 3000 va khoi dong dua vao sleep, packaging/terminal cu khong du de xac nhan app san sang.
- AI: danh sach model HTTP 200 khong chung minh tai khoan con tien/quota cho inference. Da gap 402/429 that.
- May chi co 8 GiB RAM. So do cuoi: swap 3118.62/4096 MiB; o Data con khoang 40 GiB. Don o dia khong tu dong giai phong RAM cua cac tien trinh dang chay.

Lenh de xuat chuyen khoa sang OpenCode bi co che xet duyet tu dong tu choi vi thay doi xac thuc ben vung cua app nguoi dung tung khong muon dung. Lenh KHONG chay, va khong thu di vong bang cach khac. Muon tiep tuc thao tac do can phe duyet rieng.

## Du Lieu Va Dung Luong

- Khong xoa ma nguon, .git, .env, lockfile, node_modules cua project, session, auth, database, backup cu hay du lieu ung dung nguoi dung.
- Khong kill hang loat node/Devin/OpenCode; khong git prune/reflog expire; khong Docker prune; khong reset TCC/quyen macOS.
- Khong sua che do ngu/mang/pin trong dot nay.
- App moi khoang 161 MiB; source phuc hoi khoang 29 MiB; skills/du lieu OMCODE khoang 55 MiB.
- Backup ban cai truoc sua Keychain khoang 163 MiB, giu co chu dich.
- Build/test staging do phien nay tao tai /private/tmp/omcode-recovery-20260913 khoang 1.0 GiB. Day khong phai du lieu project goc; chua xoa de giu bang chung va kha nang doi chieu.

Cache tai tao duoc khong co nghia la xoa luc nao cung an toan: browser runtime, MCP dependency va package cache co the dang duoc tien trinh dung. CPU 0% khong chung minh tien trinh da chet. Nhan dinh cu rang xoa pnpm store se pha moi node_modules chi vi hardlink la khong chinh xac; hardlink con lai van giu inode. Tuy vay van can kiem tra layout, symlink va tien trinh dang su dung truoc khi don.

## Phan Chua Hoan Thanh

1. Doc lai va doi chieu cac thay doi chua commit trong Documents khi quyen/FileProvider hoat dong binh thuong.
2. Giai quyet quota/tai khoan provider de AI co the chay on dinh, thay vi chi mot lan E2E thanh cong.
3. Cap OAuth rieng va thuc thi E2E cho 4 MCP quan tri.
4. Kiem chung/port tung skill can su dung; khong coi viec copy file la hoan tat port runtime.
5. Kiem thu thao tac that trong tung ung dung vendor neu van muon giu dung chung.
6. OMCODE hien co command runner 60 giay, khong phai PTY tuong tac hay quan ly dev server dai han; chua co language-server/debugger/extension marketplace day du nhu IDE lon.
7. Ky Developer ID/notarize va kiem thu nang cap/rollback truoc phat hanh rong.

Ket luan pham vi: da khoi phuc va kiem thu mot ban OMCODE local co the van hanh; CHUA du bang chung cho yeu cau "toan bo E2E, khong con bat ky loi gi" tren tat ca ung dung va dich vu.
