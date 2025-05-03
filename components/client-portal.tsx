"use client"

import { ClientPortal as ClientPortalImplementation } from "./client-portal/index"

export function ClientPortal(props: any) {
  return <ClientPortalImplementation {...props} />
}
