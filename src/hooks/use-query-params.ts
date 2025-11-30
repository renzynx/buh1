import { useCallback, useMemo } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  folderId?: string;
  status?: string;
}

export function useQueryParams() {
  const { urlParsed, urlPathname } = usePageContext();

  const params = useMemo(() => {
    const raw = urlParsed.searchOriginal || "";
    let urlParams: URLSearchParams;

    try {
      if (typeof raw === "string") {
        const s = raw.startsWith("?") ? raw.slice(1) : raw;
        urlParams = new URLSearchParams(s);
      } else if (raw && typeof raw === "object") {
        urlParams = new URLSearchParams();
        for (const k of Object.keys(raw)) {
          const v = (raw as Record<string, unknown>)[k];
          if (v != null) urlParams.set(k, String(v));
        }
      } else {
        urlParams = new URLSearchParams();
      }
    } catch {
      urlParams = new URLSearchParams();
    }

    const page = Number(urlParams.get("page") ?? NaN);
    const pageSize = Number(urlParams.get("pageSize") ?? NaN);
    const search = urlParams.get("search") || urlParams.get("q") || "";
    const sortBy = urlParams.get("sortBy") || undefined;
    const sortDir = (urlParams.get("sortDir") as "asc" | "desc") || undefined;
    const folderId = urlParams.get("folderId") || undefined;
    const status = urlParams.get("status") || undefined;

    return {
      page: !Number.isNaN(page) ? page : undefined,
      pageSize: !Number.isNaN(pageSize) ? pageSize : undefined,
      search: search || undefined,
      sortBy,
      sortDir,
      folderId,
      status,
    } as QueryParams;
  }, [urlParsed.searchOriginal]);

  const setQueryParams = useCallback(
    (newParams: QueryParams, replace = false) => {
      const searchParams = new URLSearchParams();

      // Only set non-default values to keep URL clean
      // Defaults: page=1, pageSize=10, sortBy=createdAt, sortDir=desc

      if (newParams.page && newParams.page !== 1) {
        searchParams.set("page", String(newParams.page));
      }

      if (newParams.pageSize && newParams.pageSize !== 10) {
        searchParams.set("pageSize", String(newParams.pageSize));
      }

      if (newParams.search) {
        searchParams.set("search", newParams.search);
      }

      // Only include sort params if they're not the default (createdAt desc)
      if (newParams.sortBy && newParams.sortBy !== "createdAt") {
        searchParams.set("sortBy", newParams.sortBy);
        if (newParams.sortDir) searchParams.set("sortDir", newParams.sortDir);
      } else if (
        newParams.sortBy === "createdAt" &&
        newParams.sortDir === "asc"
      ) {
        // If sorting by createdAt but ascending (not default), include it
        searchParams.set("sortBy", "createdAt");
        searchParams.set("sortDir", "asc");
      }

      if (newParams.folderId) {
        searchParams.set("folderId", newParams.folderId);
      }

      if (newParams.status && newParams.status !== "all") {
        searchParams.set("status", newParams.status);
      }

      const newHref = searchParams.toString()
        ? `${urlPathname}?${searchParams.toString()}`
        : urlPathname;
      const currentHref = `${urlPathname}${urlParsed.searchOriginal || ""}`;

      // Only navigate if the URL is actually different
      if (newHref !== currentHref) {
        navigate(newHref, { keepScrollPosition: replace });
      }
    },
    [urlPathname, urlParsed.searchOriginal],
  );

  return { params, setQueryParams };
}
