# API Strict Blocker Status

- checked_at_utc: 2026-04-05T15:36:26Z
- api_base_url: https://api.omdala.com

## Launch blockers

- [x] `GET /v2/reality/scenes` endpoint available on production
- [x] `GET /v2/reality/runs` endpoint available on production

## Raw endpoint diagnostics

- /v2/reality/scenes: status=200
- /v2/reality/runs?page=1&limit=10: status=200

### scenes_response


{"ok":true,"data":{"scenes":[{"scene_id":"scene_sleep_child","display_name":"Sleep – Child's Room","safety_class":"safe","actions":[{"device":"smart_bulb_child","command":"set_brightness","value":0},{"device":"air_purifier_child","command":"set_mode","value":"sleep"}],"created_at":"1970-01-01T00:00:00.000Z"}],"total":1},"meta":{"requestId":"37d9e95d-e5de-4b79-9484-bb853e51b811"}}

### runs_response


{"ok":true,"data":{"runs":[],"meta_pagination":{"page":1,"limit":10,"total":0}},"meta":{"requestId":"cd637247-a333-4360-ac4d-5b0478d77060"}}
