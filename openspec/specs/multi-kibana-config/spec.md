## ADDED Requirements

### Requirement: Multi-instance configuration from file path

The system SHALL treat `MULTI_KIBANA_CONFIG` as a configuration file path when it is set and non-empty. The system SHALL read that file and parse YAML with a top-level `kibana` array. Each array element SHALL supply at least `KIBANA_URL` and SHALL be mappable to the existing single-instance configuration model (url, authentication fields, optional caCert, timeout, maxRetries, defaultSpace).

#### Scenario: Valid multi-instance config file at startup

- **WHEN** `MULTI_KIBANA_CONFIG` points to a readable YAML file with two `kibana` entries each having `KIBANA_URL` and valid credentials
- **THEN** the server starts successfully and registers two Kibana clients without logging secrets

#### Scenario: Config file path does not exist

- **WHEN** `MULTI_KIBANA_CONFIG` points to a non-existent file
- **THEN** the server SHALL fail startup with a non-zero exit code and an error message that identifies file load failure without leaking credential values

#### Scenario: Invalid YAML in config file

- **WHEN** `MULTI_KIBANA_CONFIG` points to a readable file that is not valid YAML
- **THEN** the server SHALL fail startup with a non-zero exit code and an error message that does not include credential values

#### Scenario: Missing KIBANA_URL in an entry

- **WHEN** a `kibana` list entry omits `KIBANA_URL`
- **THEN** the server SHALL fail startup with a validation error identifying the entry index

### Requirement: Single-instance backward compatibility

When `MULTI_KIBANA_CONFIG` is unset or empty, the system SHALL continue to use `KIBANA_URL` and related `KIBANA_*` environment variables to configure exactly one Kibana profile, preserving existing behavior.

#### Scenario: Legacy env-only configuration

- **WHEN** only `KIBANA_URL`, `KIBANA_USERNAME`, and `KIBANA_PASSWORD` are set and `MULTI_KIBANA_CONFIG` is unset
- **THEN** the server behaves as today with a single Kibana backend and no required `kibana_url` tool parameter

### Requirement: Profile identity for operators

The system SHALL expose the list of configured instance hostnames (derived from each profile's URL) for diagnostics, without exposing passwords, API keys, or cookies.

#### Scenario: Startup diagnostic listing

- **WHEN** multi-instance config loads successfully with N profiles
- **THEN** stderr logs indicate N profiles and their hostnames only
