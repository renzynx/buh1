"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import superjson from "superjson";

export interface FilterItem {
  field: string;
  value: string | number | boolean | Date;
  operator?: "eq" | "contains" | "gt" | "lt" | "gte" | "lte";
}

export interface SortState {
  field: string;
  order: "asc" | "desc";
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  filter?: FilterItem[];
  sort?: SortState;
  folderId?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT: SortState = { field: "createdAt", order: "desc" };

function parseSuperjson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return superjson.parse<T>(value);
  } catch {
    return fallback;
  }
}

function isDefaultSort(sort: SortState | undefined): boolean {
  if (!sort) return true;
  return sort.field === DEFAULT_SORT.field && sort.order === DEFAULT_SORT.order;
}

function isEmptyFilter(filter: FilterItem[] | undefined): boolean {
  return !filter || filter.length === 0;
}

export function useQueryParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const params = useMemo((): QueryParams => {
    const page = Number(searchParams.get("page") ?? NaN);
    const pageSize = Number(searchParams.get("pageSize") ?? NaN);
    const filter = parseSuperjson<FilterItem[]>(searchParams.get("filter"), []);
    const sort = parseSuperjson<SortState | undefined>(
      searchParams.get("sort"),
      undefined,
    );
    const folderId = searchParams.get("folderId") || undefined;

    return {
      page: !Number.isNaN(page) ? page : DEFAULT_PAGE,
      pageSize: !Number.isNaN(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
      filter: filter.length > 0 ? filter : undefined,
      sort: sort ?? DEFAULT_SORT,
      folderId,
    };
  }, [searchParams]);

  const setQueryParams = useCallback(
    (newParams: QueryParams, replace = false) => {
      const newSearchParams = new URLSearchParams();

      if (newParams.page && newParams.page !== DEFAULT_PAGE) {
        newSearchParams.set("page", String(newParams.page));
      }

      if (newParams.pageSize && newParams.pageSize !== DEFAULT_PAGE_SIZE) {
        newSearchParams.set("pageSize", String(newParams.pageSize));
      }

      if (!isEmptyFilter(newParams.filter)) {
        newSearchParams.set("filter", superjson.stringify(newParams.filter));
      }

      if (!isDefaultSort(newParams.sort)) {
        newSearchParams.set("sort", superjson.stringify(newParams.sort));
      }

      if (newParams.folderId) {
        newSearchParams.set("folderId", newParams.folderId);
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

  const getSearchFilter = useCallback((): string => {
    const searchFilter = params.filter?.find((f) => f.field === "search");
    return searchFilter ? String(searchFilter.value) : "";
  }, [params.filter]);

  const setSearchFilter = useCallback(
    (search: string) => {
      const otherFilters =
        params.filter?.filter((f) => f.field !== "search") ?? [];
      const newFilter = search
        ? [
            ...otherFilters,
            { field: "search", value: search, operator: "contains" as const },
          ]
        : otherFilters;

      setQueryParams({
        ...params,
        page: DEFAULT_PAGE,
        filter: newFilter.length > 0 ? newFilter : undefined,
      });
    },
    [params, setQueryParams],
  );

  const getFilterValue = useCallback(
    (field: string): string | number | boolean | Date | undefined => {
      const filterItem = params.filter?.find((f) => f.field === field);
      return filterItem?.value;
    },
    [params.filter],
  );

  const setFilterValue = useCallback(
    (
      field: string,
      value: string | number | boolean | Date | undefined,
      operator: FilterItem["operator"] = "eq",
    ) => {
      const otherFilters =
        params.filter?.filter((f) => f.field !== field) ?? [];
      const newFilter =
        value !== undefined
          ? [...otherFilters, { field, value, operator }]
          : otherFilters;

      setQueryParams({
        ...params,
        page: DEFAULT_PAGE,
        filter: newFilter.length > 0 ? newFilter : undefined,
      });
    },
    [params, setQueryParams],
  );

  return {
    params,
    setQueryParams,
    getSearchFilter,
    setSearchFilter,
    getFilterValue,
    setFilterValue,
  };
}
