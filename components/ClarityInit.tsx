"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {
  const pathname = usePathname();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!projectId || isAdmin) return;
    Clarity.init(projectId);
  }, [projectId, isAdmin]);

  return null;
}
