import axios, { AxiosError } from "axios";
import fs from "fs";
import https from "https";
import type { KibanaClient, KibanaConfig } from "./types.js";
import { KibanaError } from "./types.js";

export function createKibanaClient(config: KibanaConfig): KibanaClient {
  const parsedUrl = new URL(config.url);
  const basePath = parsedUrl.pathname.replace(/\/$/, "");
  const axiosConfig: any = {
    baseURL: parsedUrl.origin,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
      "kbn-xsrf": "true",
      "x-elastic-internal-origin": "kibana",
    },
  };

  if (config.apiKey) {
    axiosConfig.headers.Authorization = `ApiKey ${config.apiKey}`;
  } else if (config.username && config.password) {
    axiosConfig.auth = {
      username: config.username,
      password: config.password,
    };
  } else if (config.cookies) {
    axiosConfig.headers.Cookie = config.cookies;
  }

  if (config.caCert) {
    try {
      axiosConfig.httpsAgent = new https.Agent({
        ca: fs.readFileSync(config.caCert),
      });
    } catch (error) {
      throw new KibanaError("Failed to load CA certificate", undefined, error);
    }
  }

  const buildSpaceAwareUrl = (url: string, space?: string): string => {
    const targetSpace = space || config.defaultSpace;
    if (targetSpace && targetSpace !== "default" && url.startsWith("/api/")) {
      return `${basePath}/s/${targetSpace}${url}`;
    }
    return `${basePath}${url}`;
  };

  const axiosInstance = axios.create(axiosConfig);

  axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error),
  );

  return {
    get: async (url: string, options?: { params?: any; headers?: any; space?: string }) => {
      const spaceAwareUrl = buildSpaceAwareUrl(url, options?.space);
      try {
        const response = await axiosInstance.get(spaceAwareUrl, {
          params: options?.params,
          headers: { ...axiosConfig.headers, ...options?.headers },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        throw new KibanaError(
          `GET request failed: ${axiosError.message}`,
          axiosError.response?.status,
          axiosError.response?.data,
        );
      }
    },
    post: async (url: string, data?: any, options?: { headers?: any; space?: string }) => {
      const spaceAwareUrl = buildSpaceAwareUrl(url, options?.space);
      try {
        const response = await axiosInstance.post(spaceAwareUrl, data, {
          headers: { ...axiosConfig.headers, ...options?.headers },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        throw new KibanaError(
          `POST request failed: ${axiosError.message}`,
          axiosError.response?.status,
          axiosError.response?.data,
        );
      }
    },
    put: async (url: string, data?: any, options?: { headers?: any; space?: string }) => {
      const spaceAwareUrl = buildSpaceAwareUrl(url, options?.space);
      try {
        const response = await axiosInstance.put(spaceAwareUrl, data, {
          headers: { ...axiosConfig.headers, ...options?.headers },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        throw new KibanaError(
          `PUT request failed: ${axiosError.message}`,
          axiosError.response?.status,
          axiosError.response?.data,
        );
      }
    },
    delete: async (url: string, options?: { headers?: any; space?: string }) => {
      const spaceAwareUrl = buildSpaceAwareUrl(url, options?.space);
      try {
        const response = await axiosInstance.delete(spaceAwareUrl, {
          headers: { ...axiosConfig.headers, ...options?.headers },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        throw new KibanaError(
          `DELETE request failed: ${axiosError.message}`,
          axiosError.response?.status,
          axiosError.response?.data,
        );
      }
    },
    patch: async (url: string, data?: any, options?: { headers?: any; space?: string }) => {
      const spaceAwareUrl = buildSpaceAwareUrl(url, options?.space);
      try {
        const response = await axiosInstance.patch(spaceAwareUrl, data, {
          headers: { ...axiosConfig.headers, ...options?.headers },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        throw new KibanaError(
          `PATCH request failed: ${axiosError.message}`,
          axiosError.response?.status,
          axiosError.response?.data,
        );
      }
    },
  };
}
