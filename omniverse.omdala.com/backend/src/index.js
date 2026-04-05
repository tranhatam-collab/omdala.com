import { createSessionStore } from "./domain/sessionStore.js";
import { createRoomRepository } from "./domain/roomRepository.js";
import { createLoginService } from "./services/loginService.js";
import { createRoomStateService } from "./services/roomStateService.js";
import { createLoginToRoomStateFlow } from "./flows/loginToRoomStateFlow.js";
import { createOmniverseApi } from "./http/api.js";
import { createSharedCoreClient } from "./shared/sharedCoreClient.js";
import { createDbAdapter } from "./db/createDbAdapter.js";
import { createDeviceService } from "./services/deviceService.js";

export async function createOmniverseRuntime(options = {}) {
  const sharedCoreClient =
    options.sharedCoreClient ||
    createSharedCoreClient({
      baseUrl: options.sharedCoreBaseUrl || options.env?.SHARED_CORE_BASE_URL,
      fetchImpl: options.fetchImpl,
    });

  const sessionStore = createSessionStore();
  const dbAdapter = await createDbAdapter({
    adapter: options.dbAdapter,
    d1: options.d1,
    env: options.env,
    allowInMemoryFallback: options.allowInMemoryFallback,
  });
  const roomRepository = createRoomRepository({ dbAdapter });

  const loginService = createLoginService({ sharedCoreClient, sessionStore });
  const roomStateService = createRoomStateService({
    sessionStore,
    roomRepository,
    sharedCoreClient,
  });
  const loginToRoomStateFlow = createLoginToRoomStateFlow({
    loginService,
    roomStateService,
  });
  const deviceService = createDeviceService({ dbAdapter, roomRepository });
  const api = createOmniverseApi({
    loginService,
    roomStateService,
    loginToRoomStateFlow,
    deviceService,
  });

  return {
    services: {
      loginService,
      roomStateService,
      loginToRoomStateFlow,
      roomRepository,
    },
    api,
  };
}
