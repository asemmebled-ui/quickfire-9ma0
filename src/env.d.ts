/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { class?: string; 'math-virtual-keyboard-policy'?: string; 'smart-fence'?: string }
    }
  }
}
