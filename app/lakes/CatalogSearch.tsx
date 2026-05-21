"use client";

import { useCallback, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface CatalogSearchProps {
  currentQ: string;
  hasFilters?: boolean;
}

export default function CatalogSearch({ currentQ, hasFilters = false }: CatalogSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      const nextUrl = params.toString() ? `/lakes?${params.toString()}` : "/lakes";
      router.push(nextUrl);
    },
    [router, searchParams],
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update(inputRef.current?.value.trim() ?? "");
  };

  return (
    <form className="dk-catalog-search" onSubmit={submitSearch}>
      <div className="dk-catalog-search__field">
        <span className="dk-catalog-search__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          defaultValue={currentQ}
          placeholder="Пошук за назвою озера, містом або областю"
          aria-label="Пошук за назвою озера, містом або областю"
          className="dk-search-input dk-search-input--hero"
          onBlur={(e) => update(e.target.value.trim())}
        />
      </div>

      {hasFilters && (
        <button type="button" className="dk-filter-reset dk-filter-reset--inline" onClick={() => router.push("/lakes")}>
          Скинути фільтри
        </button>
      )}
    </form>
  );
}
