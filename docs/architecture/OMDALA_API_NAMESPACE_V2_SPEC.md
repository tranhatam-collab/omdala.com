# OMDALA API NAMESPACE V2 – REALITY LAYER

Base URL:
/v2/reality

---

## 1. SYSTEM ENDPOINTS

GET /health  
GET /status  
GET /version

---

## 2. NODES

GET /nodes  
POST /nodes  
GET /nodes/{id}  
PATCH /nodes/{id}

---

## 3. STATES

GET /nodes/{id}/state  
POST /nodes/{id}/state

---

## 4. RESOURCES

GET /resources  
POST /resources  
GET /resources/{id}

---

## 5. COMMITMENTS

GET /commitments  
POST /commitments  
GET /commitments/{id}  
PATCH /commitments/{id}

---

## 6. TRANSITIONS

POST /transitions/plan  
POST /transitions/execute  
GET /transitions/{id}

---

## 7. PROOFS

POST /proofs  
GET /proofs/{id}  
PATCH /proofs/{id}/verify

---

## 8. TRUST

GET /trust/{node_id}  
GET /trust/{node_id}/history

---

## 9. POLICY & GOVERNANCE

GET /policy  
POST /policy/validate  
POST /governance/audit

---

## 10. AGI SAFETY

POST /agi-safety/audit  
POST /agi-safety/approve

---

## 11. WEBHOOKS

POST /webhooks  
Events:

- commitment.created
- commitment.completed
- proof.verified
- trust.updated

---

## 12. SECURITY

- JWT authentication
- Role-based access control
- Idempotency keys
- Rate limiting
- Signed requests

---

## 13. DESIGN PRINCIPLES

- Event-driven
- Idempotent
- Policy-aware
- Explainable responses
