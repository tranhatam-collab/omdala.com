# OMDALA COMMITMENT CONTRACT TEMPLATE

## 1. MỤC ĐÍCH

Commitment là đơn vị lõi của hệ thống.

Không phải task.
Không phải booking.

→ Là **cam kết có thể kiểm chứng giữa các node**.

---

## 2. STRUCTURE

### 1. Metadata

- Commitment ID
- Created at
- Status

### 2. Parties

- Initiator
- Counterparty
- Optional third parties

### 3. Objective

- Desired State
- Description

### 4. Conditions

- Preconditions
- Dependencies
- Constraints

### 5. Execution Plan

- Steps
- Timeline
- Milestones

### 6. Resources

- Required resources
- Ownership

### 7. Proof Requirements

- Proof type (document, payment, behavior)
- Validation method

### 8. Outcomes

- Success criteria
- Failure criteria

### 9. Consequences

- Penalties
- Rewards
- Escalation path

### 10. Governance

- Approval required?
- Policy applied
- Override conditions

---

## 3. STATES

- Draft
- Pending Approval
- Active
- Completed
- Failed
- Disputed

---

## 4. EXAMPLE (Zero Overdue)

- Node A: Business
- Node B: Customer

Commitment:
Customer pays invoice within 7 days

Proof:
Payment receipt

Outcome:
Completed → trust increase
Failed → trust decrease

---

## 5. DESIGN PRINCIPLE

- Machine-readable
- Human-readable
- Auditable
- Enforceable
