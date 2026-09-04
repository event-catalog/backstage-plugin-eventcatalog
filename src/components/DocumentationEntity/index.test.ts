import { buildEventCatalogEmbedUrl } from './url';

describe('buildEventCatalogEmbedUrl', () => {
  it('builds an embedded Architecture Graph URL focused on an entity', () => {
    const url = buildEventCatalogEmbedUrl({
      baseUrl: 'http://localhost:3002',
      page: 'architecture-graph',
      id: 'order-service',
      version: '1.0.0',
      collection: 'services',
      depth: 3,
    });

    expect(url.pathname).toBe('/visualiser/graph');
    expect(url.searchParams.get('embed')).toBe('true');
    expect(url.searchParams.get('focus')).toBe('services/order-service');
    expect(url.searchParams.get('depth')).toBe('3');
  });

  it('builds the catalog-wide System Context Map URL by default', () => {
    const url = buildEventCatalogEmbedUrl({
      baseUrl: 'http://localhost:3002',
      page: 'system-context-map',
      collection: null,
    });

    expect(url.toString()).toBe('http://localhost:3002/visualiser/system-context-map?embed=true');
  });

  it('builds a system-specific context map URL when id and version are supplied', () => {
    const url = buildEventCatalogEmbedUrl({
      baseUrl: 'http://localhost:3002',
      page: 'system-context-map',
      id: 'order-management-system',
      version: '1.0.0',
      collection: null,
    });

    expect(url.toString()).toBe(
      'http://localhost:3002/visualiser/systems/order-management-system/1.0.0/context?embed=true',
    );
  });

  it('builds an embedded flow visualiser URL', () => {
    const url = buildEventCatalogEmbedUrl({
      baseUrl: 'http://localhost:3002',
      page: 'flow',
      id: 'checkout-saga',
      version: '1.0.0',
      collection: null,
      theme: 'dark',
    });

    expect(url.toString()).toBe(
      'http://localhost:3002/visualiser/flows/checkout-saga/1.0.0?embed=true&theme=dark',
    );
    expect(url.searchParams.get('theme')).toBe('dark');
  });
});
