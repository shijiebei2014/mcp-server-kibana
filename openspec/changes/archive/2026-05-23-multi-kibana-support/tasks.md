## 1. Configuration module

- [x] 1.1 Add `src/multi-kibana-config.ts` to read the file pointed by `MULTI_KIBANA_CONFIG` and parse YAML into `KibanaConfig[]` (map `KIBANA_URL` → `url`, etc.)
- [x] 1.2 Validate each profile with `KibanaConfigSchema`; fail startup with clear errors (no secrets in messages)
- [x] 1.3 Implement `loadKibanaProfiles()` with precedence: multi-config file path if set, else single `KIBANA_*` env block

## 2. Client resolver

- [x] 2.1 Add `KibanaClientResolver` type in `src/types.ts` (`resolve`, `listHostnames`, `profileCount`)
- [x] 2.2 Implement `createKibanaClientResolver(profiles)` in `src/kibana-resolver.ts` using existing `createKibanaClient`
- [x] 2.3 Implement hostname extraction and case-insensitive match from optional `kibana_url`
- [x] 2.4 Log profile count and hostnames on startup (stderr only, no credentials)

## 3. Server wiring

- [x] 3.1 Refactor `createKibanaMcpServer` to accept `KibanaClientResolver` instead of a single `KibanaClient`
- [x] 3.2 Update `main()` in `index.ts` to load profiles and pass resolver into server creation
- [x] 3.3 Ensure HTTP and stdio modes both use the same resolver instance per server process

## 4. Tool integration

- [x] 4.1 Add shared zod field `kibana_url: z.string().url().optional()` helper for tool schemas
- [x] 4.2 Update `registerBaseTools` to resolve client per invocation from `args.kibana_url`
- [x] 4.3 Update VL tools (`vl_search`, `vl_get`, `vl_create`, `vl_update`, `vl_delete`) to use resolver
- [x] 4.4 Update `registerAnalysisTools` and `registerResources` to use resolver
- [x] 4.5 Return actionable errors when multiple profiles exist and `kibana_url` is missing or unmatched (include hostname list)

## 5. Documentation and packaging

- [x] 5.1 Expand `docs/multi-kibana.md` with config file path usage, YAML file example, Cursor `mcp.json` snippet, and routing behavior
- [x] 5.2 Update `README.md` / `README_zh.md` env var table for `MULTI_KIBANA_CONFIG`
- [x] 5.3 Update `server.json` if MCP registry metadata should document multi-instance env

## 6. Verification

- [x] 6.1 Manual test: single `KIBANA_*` env — existing tools work without `kibana_url`
- [x] 6.2 Manual test: two profiles + Discover URL — query routes to correct hostname
- [x] 6.3 Manual test: missing/invalid `kibana_url` with multiple profiles — clear error, no credential leakage in logs
