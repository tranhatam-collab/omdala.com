# OMDALA API Reference

> **Version:** 0.1.0  
> **Base URL:** `https://api.infra.omdala.com`  
> **Authentication:** Bearer token (Keycloak JWT)

---

## Authentication

All endpoints (except `/health`) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

Additionally, every request must include the tenant:

```
X-Tenant-ID: <tenant-slug>
```

---

## Endpoints

### Health

#### GET /health
Returns basic health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-05T10:00:00.000Z",
  "version": "0.1.0",
  "gitCommit": "abc123"
}
```

#### GET /health/deep
Returns health of all dependencies.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-05T10:00:00.000Z",
  "services": {
    "postgresql": { "status": "ok" },
    "valkey": { "status": "ok" },
    "r2": { "status": "ok" }
  }
}
```

---

### Agent Tasks

#### GET /tasks
List tasks for the tenant.

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (default: 20): Max results
- `offset` (default: 0): Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "status": "pending",
    "task_type": "planner",
    "created_at": "2026-06-05T10:00:00.000Z"
  }
]
```

#### GET /tasks/:id
Get a single task.

#### POST /tasks
Create a new task.

**Body:**
```json
{
  "title": "Research AI trends",
  "description": "Find latest AI papers",
  "task_type": "research",
  "priority": "high",
  "input_payload": { "query": "AI safety" },
  "assigned_agent": "PlannerAgent"
}
```

#### PATCH /tasks/:id
Update task status.

**Body:**
```json
{
  "status": "completed",
  "output_payload": { "result": "..." }
}
```

#### DELETE /tasks/:id
Soft delete a task.

---

### Approval Requests

#### GET /approvals
List approval requests.

#### POST /approvals
Create an approval request.

**Body:**
```json
{
  "request_type": "delete_database",
  "title": "Delete old data",
  "description": "Remove data older than 2025",
  "task_id": "uuid",
  "approvers": ["user-uuid-1", "user-uuid-2"]
}
```

#### POST /approvals/:id/approve
Approve a request.

#### POST /approvals/:id/reject
Reject a request.

**Body:**
```json
{
  "reason": "Data retention policy requires keeping this"
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing JWT |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

**Document Version:** 0.1.0  
**Last Updated:** 2026-06-05
