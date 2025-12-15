// Fixed: Removed vite/client reference to resolve "Cannot find type definition file" error.
// Added process.env.API_KEY definition as per guidelines.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

export {};
