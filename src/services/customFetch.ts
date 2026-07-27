import { useAuthStore } from "../store";

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

  try {
    const clone = response.clone();
    const data = await clone.json();
    if (
      data &&
      typeof data === "object" &&
      typeof data.token === "string" &&
      data.token.trim().length > 0
    ) {
      useAuthStore.getState().setToken(data.token);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {}

  return response;
}
