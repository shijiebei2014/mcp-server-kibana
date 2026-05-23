## ADDED Requirements

### Requirement: Route by Kibana UI URL hostname

When multiple Kibana profiles are configured, the system SHALL select the target profile by extracting the hostname from an optional `kibana_url` argument (e.g. a Discover link `https://kibana-test-hkex.hashxdc.com/app/discover#/`). Hostname comparison SHALL be case-insensitive. The selected profile's `KIBANA_URL` hostname MUST match the extracted hostname.

#### Scenario: Successful match from Discover URL

- **WHEN** two profiles are configured for `kibana-test-hkex.hashxdc.com` and `kibana-global.hashxdc.com` respectively
- **AND** a tool is invoked with `kibana_url` set to `https://kibana-test-hkex.hashxdc.com/app/discover#/`
- **THEN** the tool executes Kibana API calls against the profile whose `KIBANA_URL` hostname is `kibana-test-hkex.hashxdc.com`

#### Scenario: No matching hostname

- **WHEN** multiple profiles are configured
- **AND** `kibana_url` hostname does not match any profile
- **THEN** the tool returns an error indicating no matching Kibana instance and lists available hostnames without secrets

### Requirement: Default profile when only one instance

When exactly one Kibana profile is active (single-env or multi-config with one entry), the system SHALL use that profile when `kibana_url` is omitted.

#### Scenario: Single profile without kibana_url

- **WHEN** only one profile is loaded
- **AND** a tool is invoked without `kibana_url`
- **THEN** the tool uses the sole profile successfully

### Requirement: Require kibana_url when ambiguous

When more than one Kibana profile is active, the system SHALL require `kibana_url` for tools that perform Kibana API calls unless the tool contract explicitly targets a non-Kibana resource.

#### Scenario: Multiple profiles without kibana_url

- **WHEN** two or more profiles are loaded
- **AND** a Kibana API tool is invoked without `kibana_url`
- **THEN** the tool returns an error asking the caller to supply `kibana_url`

### Requirement: Optional parameter on Kibana tools

All MCP tools that invoke the Kibana HTTP API SHALL accept an optional `kibana_url` string parameter in their input schema when multi-instance mode is enabled. In single-instance mode the parameter MAY be omitted and SHALL be ignored if present.

#### Scenario: Tool schema includes kibana_url

- **WHEN** multi-instance mode is active
- **THEN** VL and analysis tools document and accept optional `kibana_url` in their JSON schema
