export function createSessionStore() {
  const sessions = new Map();

  return {
    create({ user, sharedSessionToken, accountProfile }) {
      const omniverseSessionToken = `omni_${crypto.randomUUID()}`;
      const record = {
        user,
        sharedSessionToken,
        accountProfile,
        omniverseSessionToken,
        createdAt: new Date().toISOString(),
      };

      sessions.set(omniverseSessionToken, record);
      return record;
    },

    getByToken(token) {
      return sessions.get(token) || null;
    },
  };
}
