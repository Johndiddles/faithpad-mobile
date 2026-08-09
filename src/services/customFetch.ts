import { Alert } from "react-native";
import { useAuthStore } from "../store";
import {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  create,
  InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@/constants/env";
import { router } from "expo-router";
import { createMMKV } from "react-native-mmkv";

const Storage = createMMKV({
  id: "auth-store",
  // encryptionKey: "faithpad-auth-encryption-key",
});

const getTokens = () => {
  const access_token = Storage.getString("access_token");
  const refresh_token = Storage.getString("refresh_token");
  const username = Storage.getString("username");
  return { access_token, refresh_token, username };
};

const setAccessToken = (access_token: string) => {
  Storage.set("access_token", access_token);
};

export const clearTokensAndRedirect = () => {
  Storage.remove("access_token");
  Storage.remove("refresh_token");
  router.canDismiss() && router.dismissAll();
  router.replace("/");
};

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  encryption?: "encrypt" | "do-not-encrypt";
}

export const apiClient: AxiosInstance = create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    const { access_token } = getTokens();

    if (access_token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const response = error?.response;
    const errData = response as object;
    console.log(JSON.stringify({ errData }, null, 2));
    // const originalRequest = error.config as CustomAxiosRequestConfig;

    if (response?.status === 401) {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        useAuthStore.getState().signOut();
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again to sync your notes.",
        );
      }

      if (apiClient.defaults.headers.common["Authorization"]) {
        delete apiClient.defaults.headers.common["Authorization"];
      }
    }

    return Promise.reject(error);
  },
);

export interface TResponse {
  success: boolean;
  data: any;
}

// Final fetcher function
export const customFetch = async <T = TResponse>(
  url: string,
  config: AxiosRequestConfig,
): Promise<T> => {
  try {
    const response = await apiClient(url, config);

    const data = response?.data;
    if (data?.data?.token) {
      const token = data.data.token as string;
      setAccessToken(token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return data as T;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err?.response?.data) {
        const response = err?.response?.data;
        let error: Record<string, any> & { status: number } = {
          status: err.status as number,
        };

        const errData = response as object;
        error = { ...error, ...errData };

        throw error as T;
      }
    }
    throw err;
  }
};
