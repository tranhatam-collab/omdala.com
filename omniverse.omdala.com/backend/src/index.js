import { createSessionStore } from "./domain/sessionStore.js";
import { createRoomRepository } from "./domain/roomRepository.js";
import { createLoginService } from "./services/loginService.js";
import { createRoomStateService } from "./services/roomStateService.js";
import { createLoginToRoomStateFlow } from "./flows/loginToRoomStateFlow.js";
import { createOmniverseApi } from "./http/api.js";
import { createSharedCoreClient } from "./shared/sharedCoreClient.js";
import { createDbAdapter } from "./db/createDbAdapter.js";
import { createDeviceService } from "./services/deviceService.js";
import { createSceneService } from "./services/sceneService.js";
import { createAutomationService } from "./services/automationService.js";
import { createScheduleService } from "./services/scheduleService.js";
import { createGatewayService } from "./services/gatewayService.js";
import { createMultiRoomService } from "./services/multiRoomService.js";
import { createStateGraphService } from "./services/stateGraphService.js";
import { createDeviceCapabilityService } from "./services/deviceCapabilityService.js";
import { createPropertyService } from "./services/propertyService.js";
import { createObservabilityService } from "./services/observabilityService.js";

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

  // ── O4 services ────────────────────────────────────────────────────────────
  const stateGraphService = createStateGraphService({ dbAdapter });
  const deviceCapabilityService = createDeviceCapabilityService({ dbAdapter });
  const observabilityService = createObservabilityService({ dbAdapter });
  const propertyService = createPropertyService({ dbAdapter });

  const deviceService = createDeviceService({
    dbAdapter,
    roomRepository,
    stateGraphService,
    deviceCapabilityService,
    observabilityService,
  });
  const sceneService = createSceneService({ dbAdapter, roomRepository });
  const automationService = createAutomationService({
    dbAdapter,
    deviceService,
  });
  const scheduleService = createScheduleService({
    dbAdapter,
    automationService,
  });
  const gatewayService = createGatewayService({ dbAdapter });
  const multiRoomService = createMultiRoomService({
    dbAdapter,
    roomRepository,
  });

  const api = createOmniverseApi({
    loginService,
    roomStateService,
    loginToRoomStateFlow,
    deviceService,
    sceneService,
    automationService,
    scheduleService,
    gatewayService,
    multiRoomService,
    stateGraphService,
    deviceCapabilityService,
    propertyService,
    observabilityService,
  });

  return {
    services: {
      loginService,
      roomStateService,
      loginToRoomStateFlow,
      roomRepository,
      deviceService,
      sceneService,
      automationService,
      scheduleService,
      gatewayService,
      multiRoomService,
      stateGraphService,
      deviceCapabilityService,
      propertyService,
      observabilityService,
    },
    api,
  };
}
