export type EventCatalogArchitectureGraphDepth = 1 | 2 | 3;
export type EventCatalogEmbedTheme = 'light' | 'dark';
export type EventCatalogPage =
  | 'docs'
  | 'visualiser'
  | 'discover'
  | 'entity-map'
  | 'schema-explorer'
  | 'architecture-graph'
  | 'system-context-map'
  | 'flow';

interface EventCatalogEmbedUrlOptions {
  baseUrl: string;
  page: EventCatalogPage;
  id?: string | null;
  version?: string | null;
  collection: string | null;
  depth?: EventCatalogArchitectureGraphDepth;
  theme?: EventCatalogEmbedTheme;
}

export const buildEventCatalogEmbedUrl = ({
  baseUrl,
  page,
  id,
  version,
  collection,
  depth = 2,
  theme,
}: EventCatalogEmbedUrlOptions) => {
  const applyTheme = (url: URL) => {
    if (theme) {
      url.searchParams.set('theme', theme);
    }
    return url;
  };

  if (page === 'architecture-graph') {
    const url = new URL('/visualiser/graph', baseUrl);
    url.searchParams.set('embed', 'true');
    url.searchParams.set('focus', `${collection}/${id}`);
    url.searchParams.set('depth', String(depth));
    return applyTheme(url);
  }

  if (page === 'system-context-map') {
    const path = id && version
      ? `/visualiser/systems/${id}/${version}/context`
      : '/visualiser/system-context-map';
    return applyTheme(new URL(`${path}?embed=true`, baseUrl));
  }

  if (page === 'flow') {
    if (!id || !version) {
      throw new Error('An EventCatalog flow id and version are required for the flow embed');
    }

    return applyTheme(new URL(`/visualiser/flows/${id}/${version}?embed=true`, baseUrl));
  }

  if (page === 'discover') {
    return applyTheme(new URL(`/discover/${collection}?embed=true`, baseUrl));
  }

  if (page === 'entity-map') {
    return applyTheme(new URL(`/visualiser/${collection}/${id}/${version}/entity-map?embed=true`, baseUrl));
  }

  if (page === 'schema-explorer') {
    return applyTheme(new URL('/schemas/explorer?embed=true', baseUrl));
  }

  if (!id) {
    throw new Error(`An EventCatalog resource id is required for the ${page} embed`);
  }

  const versionPath = version ? `/${version}` : '';
  return applyTheme(new URL(`/${page}/${collection}/${id}${versionPath}?embed=true`, baseUrl));
};
