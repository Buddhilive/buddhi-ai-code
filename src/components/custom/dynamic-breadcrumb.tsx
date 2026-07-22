"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useChatStore } from "@/components/chat/store/use-chat-store";
import { Fragment } from "react";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const { recentChats } = useChatStore();

  // Handle the home route or root chat route
  if (pathname === "/" || pathname === "/chat") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Split pathname into segments, remove empty strings
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink render={<Link href="/chat" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          // Skip the first "chat" segment since "Home" covers it
          if (index === 0 && segment === "chat") return null;

          const isLast = index === segments.length - 1;

          // Determine label
          let label = segment;
          if (segment === "history") {
            label = "Chat History";
          } else if (segments[0] === "chat" && index === 1) {
            // It's a chat ID segment
            const chat = recentChats.find((c) => c.id === segment);
            label = chat?.title || "Chat";
          }

          // Construct the href for this segment
          const href = "/" + segments.slice(0, index + 1).join("/");

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-[200px] md:max-w-[300px]">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
