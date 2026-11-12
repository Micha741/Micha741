declare module 'pako' {
  export function inflate(data: Uint8Array): Uint8Array;
  export function inflateRaw(data: Uint8Array): Uint8Array;
  const pako: { inflate: typeof inflate; inflateRaw: typeof inflateRaw };
  export default pako;
}
