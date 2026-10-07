import { createHash, randomUUID } from "node:crypto";

export const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function createApprovals() {
  const pending = new Map();
  return {
    prepare(kind, payload, binding) {
      for (const [id, entry] of pending)
        if (entry.expiresAt <= Date.now()) pending.delete(id);
      if (pending.size >= 32) pending.delete(pending.keys().next().value);
      const value = structuredClone({ kind, ...payload, binding });
      const approval = {
        id: randomUUID(),
        digest: digest(value),
        expiresAt: Date.now() + 300000,
      };
      pending.set(approval.id, { ...approval, value });
      return { ...payload, ...approval };
    },
    consume(kind, id, expectedDigest, binding) {
      const entry = pending.get(id);
      pending.delete(id);
      if (
        !entry ||
        entry.expiresAt <= Date.now() ||
        entry.value.kind !== kind ||
        expectedDigest !== entry.digest ||
        digest(binding) !== digest(entry.value.binding)
      )
        throw new Error(
          "Xác nhận thiếu, hết hạn hoặc nội dung/đích gửi đã thay đổi. Xem lại trước khi gửi.",
        );
      return entry.value;
    },
    peek(id) {
      return pending.get(id)?.value;
    },
  };
}
