import { z } from "zod";

export const KibanaUrlSchema = z
  .string()
  .url("kibana_url must be a valid URL")
  .optional()
  .describe(
    "Optional Kibana UI URL (e.g. https://kibana-host/app/discover#/). Required when multiple Kibana instances are configured.",
  );
