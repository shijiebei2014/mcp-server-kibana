## Context

The MCP server is a TypeScript Node process (`index.ts`) that builds one `KibanaClient` from `KIBANA_*` env vars and passes it into all tool modules at registration time. Tools perform Elasticsearch/Kibana API calls through that single axios-backed client. Operators already run multiple MCP server entries in Cursor (one per Kibana host); the product goal is one process with multiple backends, selected by hostname from a user-provided Kibana URL.

Constraints:
- Backward compatibility: existing single-instance `KIBANA_URL` / `KIBANA_USERNAME` / `KIBANA_PASSWORD` setup must keep working without `MULTI_KIBANA_CONFIG`.
- `js-yaml` is already a project dependency (used in `base-tools.ts`).
- Credentials must not appear in logs or tool responses.

## Goals / Non-Goals

**Goals:**
- Load N Kibana profiles from a YAML config file, where `MULTI_KIBANA_CONFIG` stores the file path.
- Resolve the active profile by matching the hostname of an optional `kibana_url` tool argument against each profile's `KIBANA_URL` hostname.
- Route all Kibana API calls for that invocation to the resolved client.
- Clear errors when no profile matches or config is invalid.

**Non-Goals:**
- Per-request dynamic reload of config (restart required).
- Automatic discovery of Kibana instances (no network probing).
- Replacing multiple Cursor MCP entries—users may still prefer separate servers; this adds an in-process option.
- Space-level routing beyond existing `defaultSpace` per profile.

## Decisions

### 1. Config file path and precedence

**Decision:** `MULTI_KIBANA_CONFIG` stores a file path. The server reads that file and parses YAML with structure:

```yaml
kibana:
  - KIBANA_URL: "https://host1/_plugin/kibana"
    KIBANA_USERNAME: "user1"
    KIBANA_PASSWORD: "pass1"
  - KIBANA_URL: "https://host2:5601"
    KIBANA_API_KEY: "..."
```

Map each list item to the existing `KibanaConfig` shape (`url`, `username`, `password`, `apiKey`, `cookies`, `caCert`, `timeout`, `maxRetries`, `defaultSpace`) using the same field names as env vars for consistency.

**Precedence:** If `MULTI_KIBANA_CONFIG` is set and non-empty, treat it as a required readable file path and use multi-mode. Else fall back to current single `KIBANA_*` env block (one implicit profile).

**Alternatives considered:**
- YAML inline string env var — rejected; requirement clarified that env var represents file path.
- JSON config file — rejected; YAML matches the requirement doc and existing `js-yaml` usage.
- Separate env vars per index (`KIBANA_URL_0`) — rejected; does not scale and is hard to maintain in MCP client JSON.

### 2. Hostname matching for routing

**Decision:** Normalize both the incoming `kibana_url` and each profile URL with `new URL()`; compare `hostname` (case-insensitive). First exact hostname match wins. If `kibana_url` is omitted and exactly one profile exists, use that profile. If omitted and multiple profiles exist, return a tool error asking for `kibana_url`.

**Alternatives considered:**
- Full URL prefix match — rejected; paths/spaces in Discover URLs vary; hostname is stable per deployment.
- Longest suffix match — deferred; exact hostname is sufficient for distinct deployments.

### 3. Client resolver abstraction

**Decision:** Introduce `KibanaClientResolver` with `resolve(kibanaUrl?: string): KibanaClient` and `listProfiles(): { hostname: string }[]` (no secrets). Tool handlers receive the resolver instead of a bare `KibanaClient`. Internal helper `resolveClientForTool(args)` reads optional `kibana_url` from zod schemas.

**Alternatives considered:**
- One MCP server instance per Kibana in code — rejected; duplicates tool registration and increases memory.
- Global mutable “current client” — rejected; not safe for concurrent HTTP sessions.

### 4. Tool schema changes

**Decision:** Add optional `kibana_url: z.string().url().optional()` to tool input schemas that perform Kibana API calls (VL search/get/create/update/delete, analysis, base execute/search tools, resources that hit Kibana). Document in tool descriptions that users should pass the Discover or Kibana app URL when multiple instances are configured.

Single-profile mode: parameter is ignored if only one client exists (no breaking behavior).

### 5. Startup validation

**Decision:** At startup, read the file specified by `MULTI_KIBANA_CONFIG`, parse YAML, validate each entry with `KibanaConfigSchema`, build clients eagerly, and log profile count and hostnames to stderr (not credentials). Fail startup on missing file, read permission errors, parse errors, or validation errors.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hostname collision (two profiles same host, different paths) | Document that URLs must differ by hostname; optional future `matchHostAndPath` flag |
| Invalid path or unreadable config file | Fail fast with clear startup error and document required deployment mount/permission |
| HTTP mode concurrent sessions hitting different Kibanas | Resolver is stateless per call; each tool invocation passes `kibana_url` |
| Credential leakage in errors | Wrap errors; never include password/apiKey in messages |
| Breaking tool schemas | Optional field only; existing clients unchanged |

## Migration Plan

1. Ship with backward-compatible defaults (no `MULTI_KIBANA_CONFIG` → current behavior).
2. Update `README` / `docs/multi-kibana.md` with example `MULTI_KIBANA_CONFIG` file path and YAML file template for Cursor `mcp.json`.
3. Operators can consolidate N MCP entries into one entry gradually.
4. Rollback: remove `MULTI_KIBANA_CONFIG` and restore per-instance MCP blocks.

## Open Questions

- Port in hostname: treat `host:5601` vs `host` as distinct URLs — document that `KIBANA_URL` in config must match what users paste in Discover links.
