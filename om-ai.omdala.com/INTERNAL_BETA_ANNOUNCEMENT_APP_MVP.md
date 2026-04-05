# Internal Beta Announcement / Thong Bao Beta Noi Bo - App MVP RC

Date / Ngay: 2026-04-05
Audience / Doi tuong: Internal beta testers / Nhom kiem thu noi bo
Status / Trang thai: Ready to send / San sang gui

## Announcement Draft / Noi dung thong bao

Team / Cac ban,

The Om AI App MVP release candidate is now ready for internal beta. / Ban release candidate App MVP cua Om AI da san sang cho beta noi bo.

- Web and app API contracts are locked on `shared/api-contracts.ts` version `1.0.0`. / Hop dong API cho web va app da duoc khoa o phien ban `1.0.0`.
- App core flow is complete: sign in (magic link), timeline, run detail, scenes run, and settings/logout. / Luong chuc nang cot loi da hoan tat: dang nhap, timeline, chi tiet run, chay scene, settings/dang xuat.
- Launch strict gate is now green in production (`/v2/reality/scenes` and `/v2/reality/runs` return 200). / Cong strict launch da xanh tren production.
- Production deploy verification is complete for `https://app.omdala.com` and `https://api.omdala.com`. / Xac minh deploy production da hoan tat cho hai mien.

Please run normal usage and edge-case checks over timeline, scenes run initiation, and session persistence/logout. / Vui long test ca tinh huong thong thuong va bien tren timeline, kich hoat scene, va luu phien/dang xuat.

## Tester Focus Areas / Trong tam kiem thu

- magic-link callback reliability (cold start and resume) / do on dinh callback magic-link (mo nguoi dung moi va quay lai app)
- timeline load and run detail consistency / tinh nhat quan khi tai timeline va chi tiet run
- scene trigger UX and API response handling / trai nghiem bam chay scene va xu ly phan hoi API
- logout/session expiry behavior / hanh vi dang xuat va het han phien
- request-id diagnostics visibility in web shell / kha nang hien thi request-id trong web shell

## Known Limitations / Gioi han hien tai

- Strict app smoke currently validates API availability and MVP route behavior; it is not a full device farm matrix. / Bai strict smoke hien chi xac minh API va route MVP, chua thay the ma tran thiet bi day du.
- Mobile automated coverage uses the current scripted smoke path and does not replace manual exploratory beta testing. / Bao phu tu dong mobile hien dua tren script smoke va khong thay the test thu cong kham pha.

## Ops References / Tai lieu van hanh

- Release candidate summary / Tom tat RC: `RELEASE_CANDIDATE_APP_MVP.md`
- Beta gate checklist / Checklist cong beta: `APP_BETA_ROLLOUT_CHECKLIST.md`
- Strict launch runbook / Runbook strict launch: `STRICT_LAUNCH_RUNBOOK_API.md`
- Latest release snapshot / Snapshot release moi nhat: `release-snapshots/20260405T144812Z-v2026.04.05-app-rc.md`
- Rollback command / Lenh rollback: `scripts/rollback-home-prod.sh`
