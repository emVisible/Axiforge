import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export default function PageMeta({ title, description, image, url }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes("Axiforge") ? title : `${title} · Axiforge`;
    document.title = fullTitle;
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:type", "website");
    if (image) setMeta("property", "og:image", image);
    if (url) setMeta("property", "og:url", url);
    return () => {
      document.title = "Axiforge";
    };
  }, [title, description, image, url]);

  return null;
}
