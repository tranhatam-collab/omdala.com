# OMCODE Beta Test Plan — v0.1

## Objective
Thu thập feedback thực tế từ 2-3 developers dùng OMCODE 1 tuần để cải thiện trước khi production.

## Timeline
- **Day 1-2**: Onboarding + cài đặt API key
- **Day 3-5**: Daily use — code, refactor, test, debug
- **Day 6-7**: Feedback collection + wrap-up

## Participants
- **Target**: 2-3 dev full-stack, làm việc với React/TypeScript/Node.js
- **Recruitment**: Discord dev community, LinkedIn, internal team
- **Incentive**: Free OMCODE Pro lifetime (khi có subscription)

## Test Scenarios

### 1. Onboarding Flow (Day 1)
- [ ] Mở app → Welcome Screen hiện rõ
- [ ] Click "Mở dự án" → chọn folder → File Explorer load đúng
- [ ] ⚙️ Settings → nhập API key → indicator chuyển 🟢
- [ ] Chọn model → chat → AI trả lời trong 10s

### 2. Core Features (Day 2-3)
- [ ] Streaming response — text chạy từng từ
- [ ] Slash commands — `/explain`, `/test`, `/refactor`, `/fix`
- [ ] @-mentions — `@package.json` thêm context
- [ ] Apply code — click "✓ Apply" → file update
- [ ] Ctrl+I — chọn code → hỏi AI → auto-fill chat

### 3. Workspace Management (Day 4-5)
- [ ] Multi-file editing — mở 3+ files, switch tab
- [ ] Git panel — stage, commit, push
- [ ] Terminal — chạy npm install, npm test
- [ ] Status bar — git branch, changes, file count hiện đúng

### 4. Edge Cases (Day 6)
- [ ] Large file (>1000 lines) — performance
- [ ] No API key — error message rõ ràng
- [ ] Offline — graceful degradation
- [ ] Multiple workspaces — recent projects lưu đúng

## Feedback Form

### UX (1-5)
- Welcome Screen dễ hiểu?
- Chat UI intuitive?
- Settings dễ config?

### Performance (1-5)
- Load time folder?
- AI response latency?
- Editor smoothness?

### Bugs
- [ ] Crash / freeze?
- [ ] Incorrect file content?
- [ ] Git sync fail?
- [ ] Model routing wrong?

### Wishlist
- Feature nào còn thiếu?
- Tool nào muốn integrate? (ESLint, Prettier, Docker...)

## Success Criteria
- 0 critical bugs
- Average UX score ≥ 4.0/5
- Average Performance score ≥ 3.5/5
- ≥ 3 features được request thêm

## Next Steps After Beta
1. Fix critical bugs (P0)
2. Polish UX theo feedback (P1)
3. Thêm features wishlist (P2)
4. Production release v0.2
