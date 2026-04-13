export type CatalogRow = {
  icon: string;
  subtitleHtml: string;
  clickHandler: string;
};

export function filterEntriesBySearch<T>(
  entries: Array<[string, T]>,
  normalizedFilter: string,
  getHaystack: (name: string, item: T) => string,
  normalize: (value: string) => string
): Array<[string, T]> {
  if (!normalizedFilter) return entries;
  return entries.filter(([name, item]) =>
    normalize(getHaystack(name, item)).includes(normalizedFilter)
  );
}

export function renderCatalogRows<T>(
  entries: Array<[string, T]>,
  getRow: (name: string, item: T) => CatalogRow,
  escapeHtml: (value: string | number | boolean | null | undefined) => string,
  encodeInlineValue: (value: string) => string
): string {
  return entries.map(([name, item]) => {
    const encodedName = encodeInlineValue(name);
    const row = getRow(name, item);
    return `<button type="button" class="cfg-row cfg-guide-row" onclick='${row.clickHandler}(decodeURIComponent("${encodedName}"))'>
      <span class="cfg-ic" style="background:var(--accent-dim)">${escapeHtml(row.icon)}</span>
      <span class="cfg-info"><span class="cfg-ttl">${escapeHtml(name)}</span><span class="cfg-sub cfg-guide-sub">${row.subtitleHtml}</span></span>
      <span class="cfg-arr">›</span>
    </button>`;
  }).join('');
}
