import { type A11yConfig, a11yScript } from "torch-a11y";

/**
 * The before-paint script, for <head>. Inline on purpose: a deferred or
 * `next/script` script runs after first paint, so the page would flash at
 * the default size and contrast first.
 *
 * On the client it renders as text/plain, which React doesn't warn about
 * and the browser won't run a second time. Pass `nonce` under a strict CSP.
 */
export function A11yScript({ config, nonce }: { config?: Partial<A11yConfig>; nonce?: string }) {
  return (
    <script
      nonce={nonce}
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: a11yScript(config) }}
    />
  );
}
