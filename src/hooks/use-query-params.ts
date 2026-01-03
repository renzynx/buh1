"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const params = useMemo(() => {
    const page = Number(searchParams.get("page") ?? NaN);
    const pageSize = Number(searchParams.get("pageSize") ?? NaN);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortDir =
      (searchParams.get("sortDir") as "asc" | "desc") || undefined;
    const folderId = searchParams.get("folderId") || undefined;
    const status = searchParams.get("status") || undefined;

    return {
      page: !Number.isNaN(page) ? page : undefined,
      pageSize: !Number.isNaN(pageSize) ? pageSize : undefined,
      search: search || undefined,
      sortBy,
      sortDir,
      folderId,
      status,
    } as QueryParams;
  }, [searchParams]);

  const setQueryParams = useCallback(
    (newParams: QueryParams, replace = false) => {
      const newSearchParams = new URLSearchParams();

      if (newParams.page && newParams.page !== 1) {
        newSearchParams.set("page", String(newParams.page));
      }

      if (newParams.pageSize && newParams.pageSize !== 10) {
        newSearchParams.set("pageSize", String(newParams.pageSize));
      }

      if (newParams.search) {
        newSearchParams.set("search", newParams.search);
      }

      if (newParams.sortBy && newParams.sortBy !== "createdAt") {
        newSearchParams.set("sortBy", newParams.sortBy);
        if (newParams.sortDir)
          newSearchParams.set("sortDir", newParams.sortDir);
      } else if (
        newParams.sortBy === "createdAt" &&
        newParams.sortDir === "asc"
      ) {
        newSearchParams.set("sortBy", "createdAt");
        newSearchParams.set("sortDir", "asc");
      }

      if (newParams.folderId) {
        newSearchParams.set("folderId", newParams.folderId);
      }

      if (newParams.status && newParams.status !== "all") {
        newSearchParams.set("status", newParams.status);
      }

      const queryString = newSearchParams.toString();
      const newHref = queryString ? `${pathname}?${queryString}` : pathname;
      const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

      if (newHref !== currentHref) {
        if (replace) {
          router.replace(newHref, { scroll: false });
        } else {
          router.push(newHref, { scroll: false });
        }
      }
    },
    [pathname, searchParams, router],
  );

  return { params, setQueryParams };
}
