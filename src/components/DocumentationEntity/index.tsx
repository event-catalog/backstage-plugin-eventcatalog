import React from 'react';
import { useApi, configApiRef, ConfigApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import {
  buildEventCatalogEmbedUrl,
  EventCatalogArchitectureGraphDepth,
  EventCatalogEmbedTheme,
  EventCatalogPage,
} from './url';

export { buildEventCatalogEmbedUrl } from './url';
export type { EventCatalogArchitectureGraphDepth, EventCatalogEmbedTheme, EventCatalogPage } from './url';

export interface EventCatalogEmbedThemeProps {
  /** Force the embedded EventCatalog page to use this color theme. */
  theme?: EventCatalogEmbedTheme;
}

export interface EventCatalogDocumentationEntityPageProps extends EventCatalogEmbedThemeProps {
  page: EventCatalogPage;
  id?: string;
  version?: string;
  collection?: string;
  /** Alias for collection. Both singular (service) and plural (services) values are accepted. */
  type?: string;
  /** Relationship hops shown around the focused resource in the Architecture Graph. */
  depth?: EventCatalogArchitectureGraphDepth;
  /** System id to show in a system-specific context map. Omit it for the catalog-wide overview. */
  system?: string;
  /** Flow id to show in the flow visualiser. */
  flow?: string;
}

export type EventCatalogArchitectureGraphEntityPageProps = Omit<
  EventCatalogDocumentationEntityPageProps,
  'page' | 'system' | 'flow'
>;

export type EventCatalogSystemContextMapEntityPageProps = Omit<
  EventCatalogDocumentationEntityPageProps,
  'page' | 'collection' | 'type' | 'depth' | 'flow'
>;

export type EventCatalogFlowEntityPageProps = Omit<
  EventCatalogDocumentationEntityPageProps,
  'page' | 'collection' | 'type' | 'depth' | 'system'
>;

const resourceTypeToCollection: Record<string, string> = {
  agent: 'agents',
  command: 'commands',
  container: 'containers',
  'data-product': 'data-products',
  domain: 'domains',
  entity: 'entities',
  event: 'events',
  flow: 'flows',
  query: 'queries',
  service: 'services',
  system: 'systems',
  team: 'teams',
};

const collectionFromType = (type?: string) => type ? resourceTypeToCollection[type] || type : undefined;

const embedContainerStyle: React.CSSProperties = {
  background: 'white',
  display: 'flex',
  height: '100%',
  minHeight: 0,
  width: '100%',
};

const embedFrameStyle: React.CSSProperties = {
  border: 0,
  display: 'block',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  width: '100%',
};

const isEntityService = (entity: Entity) => {
  return (
    (entity.kind === 'Component' && entity.spec?.type === 'service') ||
    entity.kind === 'API'
  );
};

const isEntityDomain = (entity: Entity) => {
  return entity.kind === 'Domain';
};

const getEventCatalogCollectionFromEntity = (entity: Entity) => {
  if (isEntityService(entity)) {
    return 'services';
  }

  if (isEntityDomain(entity)) {
    return 'domains';
  }

  return null;
};

export function getConfig(config: ConfigApi) {
  const pluginConfig = config.getConfig('eventcatalog');

  return {
    URL: pluginConfig.getString('URL')
  };
}

export const EventCatalogDocumentationEntityPage = (props: EventCatalogDocumentationEntityPageProps) => {
  const {
    page = 'docs',
    id: overrideId,
    version: overrideVersion,
    collection: overrideCollection,
    type: overrideType,
    depth = 2,
    system: overrideSystem,
    flow: overrideFlow,
    theme,
  } = props;
  const resource = useEntity();

  const config = useApi(configApiRef);
  const pluginConfig = getConfig(config);

  const eventCatalogResourceId = overrideId || resource.entity.metadata.annotations?.['eventcatalog.dev/id'] || null;
  const eventCatalogResourceVersion = overrideVersion || resource.entity.metadata.annotations?.['eventcatalog.dev/version'] || null;
  const eventCatalogResourceCollection = overrideCollection || collectionFromType(overrideType) || resource.entity.metadata.annotations?.['eventcatalog.dev/collection'] || null;

  const collection = eventCatalogResourceCollection || getEventCatalogCollectionFromEntity(resource.entity);

  const isSystemContextMap = page === 'system-context-map';
  const isBackstageSystem = resource.entity.kind === 'System';
  const systemId = overrideSystem || overrideId || (isBackstageSystem ? eventCatalogResourceId : null);
  const systemVersion = overrideVersion || (isBackstageSystem ? eventCatalogResourceVersion : null);
  const isFlow = page === 'flow';
  const flowId = isFlow ? overrideFlow || eventCatalogResourceId : null;
  const flowVersion = eventCatalogResourceVersion;

  if (!eventCatalogResourceId && !isSystemContextMap && !flowId) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          Cannot find a mapping for this entity ({resource.entity.metadata.name}) in EventCatalog.
          Please use annotation eventcatalog.dev/id to map the entity to an EventCatalog resource.
        </span>
      </div>
    );
  }

  if (isSystemContextMap && systemId && !systemVersion) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          A version is required to show the context map for system {systemId}.
          Pass the version prop or add the eventcatalog.dev/version annotation.
        </span>
      </div>
    );
  }

  if (isFlow && flowId && !flowVersion) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          A version is required to show the visualiser for flow {flowId}.
          Pass the version prop or add the eventcatalog.dev/version annotation.
        </span>
      </div>
    );
  }

  let embedId = eventCatalogResourceId;
  let embedVersion = eventCatalogResourceVersion;

  if (isSystemContextMap) {
    embedId = systemId;
    embedVersion = systemVersion;
  } else if (isFlow) {
    embedId = flowId;
    embedVersion = flowVersion;
  }

  const url = buildEventCatalogEmbedUrl({
    baseUrl: pluginConfig.URL,
    page,
    id: embedId,
    version: embedVersion,
    collection,
    depth,
    theme,
  });

  return (
    <div style={embedContainerStyle}>
      <iframe title={url.toString()} src={url.toString()} style={embedFrameStyle} />
    </div>
  );
}

export const EventCatalogEntityVisualiserCard = (props: EventCatalogEmbedThemeProps = {}) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="visualiser" {...props} />
  </div>);
};
export const EventCatalogEntityEntityMapCard = (props: any) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="entity-map" {...props} />
  </div>);
};
export const EventCatalogEntitySchemaExplorerCard = (props: EventCatalogEmbedThemeProps = {}) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="schema-explorer" {...props} />
  </div>);
};
export const EventCatalogArchitectureGraphEntityPage = (props: EventCatalogArchitectureGraphEntityPageProps) => {
  return <EventCatalogDocumentationEntityPage page="architecture-graph" {...props} />;
};
export const EventCatalogEntityArchitectureGraphCard = (props: EventCatalogArchitectureGraphEntityPageProps) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogArchitectureGraphEntityPage {...props} />
  </div>);
};
export const EventCatalogSystemContextMapEntityPage = (props: EventCatalogSystemContextMapEntityPageProps) => {
  return <EventCatalogDocumentationEntityPage page="system-context-map" {...props} />;
};
export const EventCatalogEntitySystemContextMapCard = (props: EventCatalogSystemContextMapEntityPageProps) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogSystemContextMapEntityPage {...props} />
  </div>);
};
export const EventCatalogFlowEntityPage = (props: EventCatalogFlowEntityPageProps) => {
  return <EventCatalogDocumentationEntityPage page="flow" {...props} />;
};
export const EventCatalogEntityFlowCard = (props: EventCatalogFlowEntityPageProps) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogFlowEntityPage {...props} />
  </div>);
};
export const EventCatalogEntityMessageCard = (props: EventCatalogEmbedThemeProps = {}) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="discover" {...props} />
  </div>);
};
