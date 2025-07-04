import React from 'react';
import { useApi, configApiRef, ConfigApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

interface Props {
  page: 'docs' | 'visualiser' | 'discover' | 'entity-map';
  id?: string;
  version?: string;
  collection?: string;
}

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

export const EventCatalogDocumentationEntityPage = (props: Props) => {
  const { page = 'docs', id: overrideId, version: overrideVersion, collection: overrideCollection } = props;
  const resource = useEntity();

  const config = useApi(configApiRef);
  const pluginConfig = getConfig(config);

  const eventCatalogResourceId = overrideId || resource.entity.metadata.annotations?.['eventcatalog.dev/id'] || null;
  const eventCatalogResourceVersion = overrideVersion || resource.entity.metadata.annotations?.['eventcatalog.dev/version'] || null;
  const eventCatalogResourceCollection = overrideCollection || resource.entity.metadata.annotations?.['eventcatalog.dev/collection'] || null;

  const collection = eventCatalogResourceCollection || getEventCatalogCollectionFromEntity(resource.entity);

  if (!eventCatalogResourceId) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          Cannot find a mapping for this entity ({resource.entity.metadata.name}) in EventCatalog.
          Please use annotation eventcatalog.dev/id to map the entity to an EventCatalog resource.
        </span>
      </div>
    );
  }

  let url = new URL(
    `/${page}/${collection}/${eventCatalogResourceId}?embed=true`,
    pluginConfig.URL,
  );

  if(eventCatalogResourceVersion) {
    url = new URL(
      `/${page}/${collection}/${eventCatalogResourceId}/${eventCatalogResourceVersion}?embed=true`,
      pluginConfig.URL,
    );
  };

  if(page === 'discover') {
    url = new URL(
      `/${page}/${collection}?embed=true`,
      pluginConfig.URL,
    );
  }

  if(page === 'entity-map') {
    url = new URL(
      `/visualiser/${collection}/${eventCatalogResourceId}/${eventCatalogResourceVersion}/entity-map?embed=true`,
      pluginConfig.URL,
    );
  }

  return (
    <div style={{ background: 'white', height: '100%' }}>
      <iframe title={url.toString()} src={url.toString()} width="100%" height="100%" />
    </div>
  );
}

export const EventCatalogEntityVisualiserCard = () => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="visualiser" />
  </div>);
};
export const EventCatalogEntityEntityMapCard = (props: any) => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="entity-map" {...props} />
  </div>);
};
export const EventCatalogEntityMessageCard = () => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="discover" />
  </div>);
};