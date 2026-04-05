# OMDALA REALITY MAP UI SPEC 2026

## 1. MỤC TIÊU

Reality Map là **giao diện trung tâm của toàn hệ OMDALA**.

Không phải dashboard.
Không phải graph visualization đơn thuần.

→ Đây là **giao diện vận hành thực tại**:

- nhìn thấy trạng thái hiện tại
- định nghĩa trạng thái mong muốn
- xem các transition có thể
- kích hoạt execution
- theo dõi proof + trust

---

## 2. CORE UX PRINCIPLE

1. Visual-first (không bảng số)
2. Node-centric (mọi thứ xoay quanh node)
3. State-aware (mọi node đều có state)
4. Actionable (mọi thứ đều click để hành động)
5. Explainable (mọi AI suggestion phải giải thích được)

---

## 3. LAYOUT TỔNG THỂ

### Canvas chính (center)

- Graph dạng network (giống Figma + Notion + Obsidian)
- Node = entity (person, org, place)
- Edge = relationship / commitment / trust

### Sidebar trái

- Node info panel
- Current state
- Desired state
- Resources

### Sidebar phải

- Suggested transitions (AI)
- Active commitments
- Alerts / risks

### Top bar

- Search
- Global actions
- Notifications
- Profile

---

## 4. NODE VISUAL DESIGN

Node gồm:

- Avatar / Icon
- Name
- Trust score (color ring)
- Status indicator

Click node mở:

- State
- Resources
- Commitments
- Proofs

---

## 5. EDGE TYPES

Edges gồm:

- Relationship (light line)
- Commitment (solid line)
- Active transition (animated)
- Completed transition (green)
- Failed transition (red)

---

## 6. STATE LAYER

Mỗi node có 2 lớp:

- Current State (hiện tại)
- Desired State (mục tiêu)

Hiển thị:

- dạng card overlay
- có progress bar
- có constraint tags

---

## 7. TRANSITION INTERACTION

User flow:

1. Click node
2. Chọn “Set Desired State”
3. System đề xuất transition
4. User chọn hoặc chỉnh sửa
5. Confirm → tạo Commitment

---

## 8. AI SUGGESTION PANEL

Hiển thị:

- Recommended transitions
- Estimated outcome
- Required resources
- Risk level
- Explanation

---

## 9. PROOF VISUAL

Sau khi transition hoàn tất:

- Node highlight
- Edge chuyển màu
- Proof icon attach
- Trust score update animation

---

## 10. ZOOM & NAVIGATION

- Zoom in/out như Figma
- Mini-map góc dưới
- Drag canvas
- Multi-select nodes

---

## 11. MODES

3 chế độ:

1. View Mode (quan sát)
2. Plan Mode (tạo transition)
3. Execute Mode (theo dõi execution)

---

## 12. MOBILE VERSION

- Simplified graph
- Focus từng node
- Swipe giữa states

---

## 13. FUTURE

- Simulation mode
- Time travel (state history)
- Multi-layer overlays (finance, carbon, trust)
