import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { chatblogMarkup } from "@/lib/chatblog-markup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chat Blog — Chat na Wageni, Pata Malipo" },
      { name: "description", content: "Chat Kiswahili na wageni wanaojifunza lugha na ugundue Chat Blog." },
      { property: "og:title", content: "Chat Blog — Chat na Wageni, Pata Malipo" },
      { property: "og:description", content: "Chat Kiswahili na wageni wanaojifunza lugha na ugundue Chat Blog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: "/chatblog.css" }],
  }),
  component: Index,
});

function Index() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The reference's original behavior depends on DOMContentLoaded; mount it
    // only after the complete reference DOM is present in the client.
    const script = document.createElement("script");
    script.src = "/chatblog.js";
    script.async = false;
    document.body.appendChild(script);
    const initialize = () => document.dispatchEvent(new Event("DOMContentLoaded"));
    script.addEventListener("load", initialize);
    return () => {
      script.removeEventListener("load", initialize);
      script.remove();
      root.current?.querySelectorAll(".modal-overlay").forEach((modal) => {
        (modal as HTMLElement).style.display = "none";
      });
    };
  }, []);

  return <div ref={root} dangerouslySetInnerHTML={{ __html: chatblogMarkup }} />;
}
