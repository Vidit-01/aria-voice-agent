import { useEffect } from "react";

const DEFAULT_TITLE = "Fateh voice agent";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [title]);
}

export { DEFAULT_TITLE };
