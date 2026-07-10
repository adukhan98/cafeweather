import type { ReactNode } from "react";

import { InvitationNote } from "../brand/InvitationNote";

export function FormNote({ children }: { children: ReactNode }) {
  return (
    <InvitationNote as="div" tilt="left" className="form-note">
      {children}
    </InvitationNote>
  );
}
