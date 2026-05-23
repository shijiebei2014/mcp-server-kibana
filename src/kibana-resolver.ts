import type { KibanaClientResolver, KibanaConfig } from "./types.js";
import { KibanaError } from "./types.js";
import { createKibanaClient } from "./kibana-client.js";

interface ProfileRuntime {
  hostname: string;
  client: ReturnType<typeof createKibanaClient>;
}

function extractHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    throw new KibanaError(`Invalid kibana_url '${rawUrl}'. Expected full URL like https://host/app/discover#/`);
  }
}

export function createKibanaClientResolver(profiles: KibanaConfig[]): KibanaClientResolver {
  if (!profiles.length) {
    throw new KibanaError("No Kibana profiles configured");
  }

  const runtimes: ProfileRuntime[] = profiles.map((config) => ({
    hostname: new URL(config.url).hostname.toLowerCase(),
    client: createKibanaClient(config),
  }));

  const hostnames = runtimes.map((runtime) => runtime.hostname);

  return {
    profileCount: runtimes.length,
    listHostnames: () => hostnames,
    resolve: (kibanaUrl?: string) => {
      if (runtimes.length === 1) {
        return runtimes[0].client;
      }

      if (!kibanaUrl) {
        throw new KibanaError(
          `Multiple Kibana instances configured. Please provide 'kibana_url'. Available hostnames: ${hostnames.join(", ")}`,
        );
      }

      const requestedHostname = extractHostname(kibanaUrl);
      const matched = runtimes.find((runtime) => runtime.hostname === requestedHostname);
      if (!matched) {
        throw new KibanaError(
          `No Kibana instance matched hostname '${requestedHostname}'. Available hostnames: ${hostnames.join(", ")}`,
        );
      }

      return matched.client;
    },
  };
}
