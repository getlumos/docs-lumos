/* tslint:disable */
/* eslint-disable */
/**
 * Generate Rust and TypeScript code from a LUMOS schema
 *
 * # Arguments
 *
 * * `source` - The .lumos schema source code
 *
 * # Returns
 *
 * A `GeneratedCode` struct containing both Rust and TypeScript outputs,
 * or a JavaScript Error if parsing/generation fails
 *
 * # Example (JavaScript)
 *
 * ```js
 * import { generateCode } from 'lumos-wasm';
 *
 * const schema = `
 * #[solana]
 * #[account]
 * struct PlayerAccount {
 *     wallet: PublicKey,
 *     level: u16,
 * }
 * `;
 *
 * try {
 *     const result = generateCode(schema);
 *     console.log('Rust:', result.rust);
 *     console.log('TypeScript:', result.typescript);
 * } catch (error) {
 *     console.error('Generation failed:', error.message);
 * }
 * ```
 */
export function generateCode(source: string): GeneratedCode;
/**
 * Validate a LUMOS schema without generating code
 *
 * Useful for providing real-time feedback in the editor without
 * the overhead of full code generation.
 *
 * # Arguments
 *
 * * `source` - The .lumos schema source code
 *
 * # Returns
 *
 * `Ok(())` if the schema is valid, or a JavaScript Error with the validation message
 */
export function validateSchema(source: string): void;
/**
 * Result of code generation containing both Rust and TypeScript outputs
 */
export class GeneratedCode {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Generated Rust code
   */
  rust: string;
  /**
   * Generated TypeScript code
   */
  typescript: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_generatedcode_free: (a: number, b: number) => void;
  readonly __wbg_get_generatedcode_rust: (a: number, b: number) => void;
  readonly __wbg_set_generatedcode_rust: (a: number, b: number, c: number) => void;
  readonly __wbg_get_generatedcode_typescript: (a: number, b: number) => void;
  readonly __wbg_set_generatedcode_typescript: (a: number, b: number, c: number) => void;
  readonly generateCode: (a: number, b: number, c: number) => void;
  readonly validateSchema: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export2: (a: number, b: number) => number;
  readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
