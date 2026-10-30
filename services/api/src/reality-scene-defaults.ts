// Default scene catalog. Kept in its own module so both the in-memory seed in
// index.ts and the per-tenant PostgreSQL seeding in db/reality-repository.ts use
// one definition (and so tests that mock the repository module still see it).
export type RealitySceneAction = { device: string; command: string; value: string | number };

export type RealitySceneDefault = {
  scene_id: string;
  display_name: string;
  safety_class: string;
  actions: RealitySceneAction[];
};

export const DEFAULT_REALITY_SCENES: readonly RealitySceneDefault[] = [
  {
    scene_id: "scene_sleep_child",
    display_name: "Sleep – Child's Room",
    safety_class: "safe",
    actions: [
      { device: "smart_bulb_child", command: "set_brightness", value: 0 },
      { device: "air_purifier_child", command: "set_mode", value: "sleep" },
    ],
  },
];
