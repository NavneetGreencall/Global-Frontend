/// <reference types="vite/client" />

// Let TypeScript accept style and image imports, e.g.
//   import "./audit-trail.css";
//   import logo from "../assets/sapling-logo.png";
// (Vite's own types cover these too; these lines keep editors happy even
//  before `npm install` or when the editor uses a different TypeScript version.)
declare module "*.css";

declare module "*.png" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TENANT_CODE: string;
  readonly VITE_USE_SAMPLE_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
