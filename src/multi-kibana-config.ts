import fs from "fs";
import yaml from "js-yaml";
import { KibanaConfigSchema, type KibanaConfig } from "./types.js";

interface MultiKibanaConfigFile {
  kibana?: Array<Record<string, unknown>>;
}

function parseIntWithDefault(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function mapEntryToKibanaConfig(entry: Record<string, unknown>): KibanaConfig {
  return {
    url: String(entry.KIBANA_URL ?? ""),
    username: entry.KIBANA_USERNAME ? String(entry.KIBANA_USERNAME) : undefined,
    password: entry.KIBANA_PASSWORD ? String(entry.KIBANA_PASSWORD) : undefined,
    cookies: entry.KIBANA_COOKIES ? String(entry.KIBANA_COOKIES) : undefined,
    apiKey: entry.KIBANA_API_KEY ? String(entry.KIBANA_API_KEY) : undefined,
    caCert: entry.KIBANA_CA_CERT ? String(entry.KIBANA_CA_CERT) : undefined,
    timeout: parseIntWithDefault(entry.KIBANA_TIMEOUT, 30000),
    maxRetries: parseIntWithDefault(entry.KIBANA_MAX_RETRIES, 3),
    defaultSpace: entry.KIBANA_DEFAULT_SPACE ? String(entry.KIBANA_DEFAULT_SPACE) : "default",
  };
}

export function loadKibanaProfiles(): KibanaConfig[] {
  const configPath = process.env.MULTI_KIBANA_CONFIG?.trim();
  if (configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Failed to load MULTI_KIBANA_CONFIG file: not found at '${configPath}'`);
    }

    let rawContent: string;
    try {
      rawContent = fs.readFileSync(configPath, "utf8");
    } catch (error) {
      throw new Error(
        `Failed to load MULTI_KIBANA_CONFIG file '${configPath}': ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let parsedYaml: unknown;
    try {
      parsedYaml = yaml.load(rawContent);
    } catch (error) {
      throw new Error(
        `Invalid YAML in MULTI_KIBANA_CONFIG file '${configPath}': ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const data = parsedYaml as MultiKibanaConfigFile;
    if (!data || !Array.isArray(data.kibana) || data.kibana.length === 0) {
      throw new Error(
        `Invalid MULTI_KIBANA_CONFIG file '${configPath}': top-level 'kibana' must be a non-empty array`,
      );
    }

    return data.kibana.map((entry, index) => {
      try {
        return KibanaConfigSchema.parse(mapEntryToKibanaConfig(entry));
      } catch (error) {
        throw new Error(
          `Invalid Kibana config entry at index ${index} in '${configPath}': ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    });
  }

  return [
    KibanaConfigSchema.parse({
      url: process.env.KIBANA_URL || "http://localhost:5601",
      username: process.env.KIBANA_USERNAME || undefined,
      password: process.env.KIBANA_PASSWORD || undefined,
      cookies: process.env.KIBANA_COOKIES,
      apiKey: process.env.KIBANA_API_KEY,
      caCert: process.env.KIBANA_CA_CERT,
      timeout: parseIntWithDefault(process.env.KIBANA_TIMEOUT, 30000),
      maxRetries: parseIntWithDefault(process.env.KIBANA_MAX_RETRIES, 3),
      defaultSpace: process.env.KIBANA_DEFAULT_SPACE || "default",
    }),
  ];
}
