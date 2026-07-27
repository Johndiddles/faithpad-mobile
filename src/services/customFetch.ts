import { useAuthStore } from "../store";

/**
 * Custom fetch API wrapper with automatic Authorization header injection
 * and a response interceptor that updates the auth store token immediately
 * whenever a `token` key is present in the response body.
 */
export async function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(init?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, modifiedInit);

  // Response Interceptor: check if response body contains a `token` key
  try {
    const clone = response.clone();
    const data = await clone.json();
    if (
      data &&
      typeof data === "object" &&
      typeof data.token === "string" &&
      data.token.trim().length > 0
    ) {
      console.log("Response interceptor caught token in body, updating auth store immediately...");
      useAuthStore.getState().setToken(data.token);
    }
  } catch (err) {
    // Non-JSON responses or parse failures are ignored silently
  }

  return response;
}
