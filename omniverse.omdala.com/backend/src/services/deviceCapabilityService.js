import { HttpError } from "../core/errors.js";

export function createDeviceCapabilityService({ dbAdapter }) {
  return {
    async registerCapability({
      deviceType,
      capability,
      valueType,
      minValue,
      maxValue,
      allowed,
    }) {
      if (!deviceType || !capability || !valueType) {
        throw new HttpError(
          400,
          "INVALID_PARAMS",
          "deviceType, capability and valueType are required",
        );
      }
      const record = {
        device_type: deviceType,
        capability,
        value_type: valueType,
        min_value: minValue ?? null,
        max_value: maxValue ?? null,
        allowed_json: allowed ?? null,
        created_at: new Date().toISOString(),
      };
      return dbAdapter.registerCapability(record);
    },

    async listCapabilities({ deviceType }) {
      if (!deviceType) {
        throw new HttpError(400, "INVALID_PARAMS", "deviceType is required");
      }
      return dbAdapter.listCapabilities(deviceType);
    },

    /**
     * Validate that every key in statePayload is a registered capability for
     * deviceType.  Throws HttpError(422) on first violation.
     * If no capabilities are registered for deviceType, passes through (open policy).
     */
    async validateStateUpdate(deviceType, statePayload) {
      if (!statePayload || typeof statePayload !== "object") return;
      const caps = await dbAdapter.listCapabilities(deviceType);
      if (!caps || caps.length === 0) return; // no constraints registered

      const capMap = new Map(caps.map((c) => [c.capability, c]));

      for (const [key, value] of Object.entries(statePayload)) {
        const cap = capMap.get(key);
        if (!cap) {
          throw new HttpError(
            422,
            "CAPABILITY_VIOLATION",
            `Unknown capability '${key}' for device type '${deviceType}'`,
          );
        }
        if (cap.value_type === "number") {
          const num = Number(value);
          if (Number.isNaN(num)) {
            throw new HttpError(
              422,
              "CAPABILITY_VIOLATION",
              `Capability '${key}' expects a number`,
            );
          }
          if (cap.min_value !== null && num < cap.min_value) {
            throw new HttpError(
              422,
              "CAPABILITY_VIOLATION",
              `Capability '${key}' value ${num} is below minimum ${cap.min_value}`,
            );
          }
          if (cap.max_value !== null && num > cap.max_value) {
            throw new HttpError(
              422,
              "CAPABILITY_VIOLATION",
              `Capability '${key}' value ${num} exceeds maximum ${cap.max_value}`,
            );
          }
        }
        if (cap.value_type === "enum") {
          const allowed =
            typeof cap.allowed_json === "string"
              ? JSON.parse(cap.allowed_json)
              : cap.allowed_json;
          if (Array.isArray(allowed) && !allowed.includes(value)) {
            throw new HttpError(
              422,
              "CAPABILITY_VIOLATION",
              `Capability '${key}' value '${value}' is not in allowed list: ${allowed.join(", ")}`,
            );
          }
        }
      }
    },
  };
}
