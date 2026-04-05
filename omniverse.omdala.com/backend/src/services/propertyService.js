import { HttpError } from "../core/errors.js";

export function createPropertyService({ dbAdapter }) {
  return {
    async createProperty({ ownerUserId, name, address, type, meta }) {
      if (!ownerUserId || !name) {
        throw new HttpError(
          400,
          "INVALID_PARAMS",
          "ownerUserId and name are required",
        );
      }
      const property = {
        property_id: crypto.randomUUID(),
        owner_user_id: ownerUserId,
        name,
        address: address || null,
        type: type || "residential",
        meta_json: meta || {},
        created_at: new Date().toISOString(),
      };
      return dbAdapter.createProperty(property);
    },

    async listProperties({ ownerUserId }) {
      if (!ownerUserId) {
        throw new HttpError(400, "INVALID_PARAMS", "ownerUserId is required");
      }
      return dbAdapter.listProperties(ownerUserId);
    },

    async getProperty({ propertyId }) {
      if (!propertyId) {
        throw new HttpError(400, "INVALID_PARAMS", "propertyId is required");
      }
      const property = await dbAdapter.getProperty(propertyId);
      if (!property) {
        throw new HttpError(
          404,
          "PROPERTY_NOT_FOUND",
          `Property ${propertyId} not found`,
        );
      }
      return property;
    },

    async addWorkspaceToProperty({ propertyId, workspaceId }) {
      if (!propertyId || !workspaceId) {
        throw new HttpError(
          400,
          "INVALID_PARAMS",
          "propertyId and workspaceId are required",
        );
      }
      const property = await dbAdapter.getProperty(propertyId);
      if (!property) {
        throw new HttpError(
          404,
          "PROPERTY_NOT_FOUND",
          `Property ${propertyId} not found`,
        );
      }
      return dbAdapter.addPropertyWorkspace(propertyId, workspaceId);
    },

    async listPropertyWorkspaces({ propertyId }) {
      if (!propertyId) {
        throw new HttpError(400, "INVALID_PARAMS", "propertyId is required");
      }
      return dbAdapter.listPropertyWorkspaces(propertyId);
    },

    async deleteProperty({ propertyId }) {
      if (!propertyId) {
        throw new HttpError(400, "INVALID_PARAMS", "propertyId is required");
      }
      const removed = await dbAdapter.deleteProperty(propertyId);
      if (!removed) {
        throw new HttpError(
          404,
          "PROPERTY_NOT_FOUND",
          `Property ${propertyId} not found`,
        );
      }
      return { success: true, propertyId };
    },
  };
}
