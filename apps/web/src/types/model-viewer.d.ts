// <model-viewer> (web component de @google/model-viewer) dentro de JSX.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        alt?: string;
        [atributo: string]: unknown;
      };
    }
  }
}
