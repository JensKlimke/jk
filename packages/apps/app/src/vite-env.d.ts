/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_API_URL?: string;
    readonly VITE_WHOIS_URL?: string;
    [key: string]: string | undefined;
  };
}
