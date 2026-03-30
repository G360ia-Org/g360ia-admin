"use client";
import dynamic from "next/dynamic";
const MCPModule = dynamic(() => import("@/components/modules/mcp"), { ssr: false });
export default function MCPPage() { return <MCPModule />; }
