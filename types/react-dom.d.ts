/* `@types/react-dom` cannot be installed alongside this dependency tree; this is the one call the app makes. */
declare module "react-dom" {
  import type { ReactNode, ReactPortal } from "react";

  export function createPortal(children: ReactNode, container: Element | DocumentFragment): ReactPortal;
}
