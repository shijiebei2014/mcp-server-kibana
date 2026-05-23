## Why

The Kibana MCP server currently binds to a single Kibana instance via `KIBANA_URL` and related env vars. Operators run multiple Kibana deployments (e.g. HK QA, Global prod, CA prod) and need one MCP process to query the correct instance based on context—typically a Kibana Discover URL pasted by the user—without maintaining separate MCP server configs per environment.

## What Changes

- Add `MULTI_KIBANA_CONFIG` environment variable as a config file path. The server loads YAML content from that file (`kibana` list with `KIBANA_URL`, credentials, and optional fields aligned with existing single-instance config).
- Parse and validate multi-instance config file at startup; fail fast with a clear error if the file is missing, unreadable, invalid YAML, or defines no instances when multi-mode is enabled.
- Introduce domain-based routing: when a tool receives a Kibana UI URL (e.g. `https://kibana-test-hkex.hashxdc.com/app/discover#/...`), extract the hostname and select the matching configured instance.
- Extend MCP tools with an optional `kibana_url` (or equivalent) parameter so callers can steer queries to the right instance; default to single-instance behavior when only `KIBANA_*` env vars are set (backward compatible).
- Update documentation (`README`, `docs/multi-kibana.md`, `server.json`) for multi-instance setup and Cursor/MCP client configuration patterns.

## Capabilities

### New Capabilities

- `multi-kibana-config`: Load, validate, and expose multiple Kibana connection profiles from the file path provided by `MULTI_KIBANA_CONFIG`.
- `kibana-instance-routing`: Resolve the target Kibana client from a user-supplied Kibana UI URL via hostname/domain matching.

### Modified Capabilities

<!-- No existing openspec/specs baseline in this repo -->

## Impact

- **Core**: `index.ts` (config loading, `createKibanaMcpServer`, `main`), `src/types.ts` (schemas for multi-config).
- **Tools**: All tool registration modules that use `KibanaClient` (`base-tools`, `vl_*`, `analysis-tools`, `resources`)—handlers need access to a client resolver instead of a single injected client.
- **Dependencies**: Likely `js-yaml` (already used in `base-tools.ts`) for parsing `MULTI_KIBANA_CONFIG`.
- **Deployment**: MCP clients configure `MULTI_KIBANA_CONFIG` as a filesystem path mounted on the runtime host; existing single-env setups remain unchanged.
- **Security**: Credentials live in env/config only; logs must not print passwords or full config objects.
