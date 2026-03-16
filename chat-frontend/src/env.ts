const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "Missing environment variable: VITE_API_BASE_URL\n" +
    "Create a .env file based on .env.example and set the value."
  );
}

export const env = {
  apiBaseUrl: apiBaseUrl as string,
};
