import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';
import {} from '../..';
import { EventCatalogConfig, getConfig, ResourceMap } from '../../config';

interface Props {
  page: 'docs' | 'visualiser' | 'discover';
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

  if(isEntityDomain(entity)) {
    return 'domains';
  }

  return null;
};

const getEventCatalogValuesFromEntity = (entity: Entity, map: ResourceMap[]) => {

    const data = map.find(
        item => item['backstage-name'] === entity.metadata.name,
    );
    
    if (!data) return null;

    let version = data['eventcatalog-version'] || '';
    version = version === 'latest' ? '' : version;
    
    return { id: data['eventcatalog-id'], version, discoverFilter: data['eventcatalog-page-discovery-default-filter'] };

}

const backstageToCatalogResourceName = (
  entity: Entity,
  pluginConfig: EventCatalogConfig,
): { id: string; version?: string, discoverFilter?: string  } | null => {
  const { services = [], apis = [] } = pluginConfig;

  if (isEntityService(entity)) {
    return getEventCatalogValuesFromEntity(entity, [...services, ...apis]);
  }

  return null;
};

export const EventCatalogDocumentationEntityPage = ({
  page = 'docs',
}: Props) => {
  const { entity } = useEntity();
  const config = useApi(configApiRef);
  const pluginConfig = getConfig(config);

  const collection = getEventCatalogCollectionFromEntity(entity);

  if (!collection) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          This entity kind "{entity.kind}" is not supported by the EventCatalog
          plugin.{' '}
        </span>
        <span style={{ display: 'block' }}>
          Please raise an issue on the plugin if you would like to support it.{' '}
        </span>
      </div>
    );
  }

  // Try and see if there is mapping for the entity name to EventCatalog
  const eventCatalogResource = backstageToCatalogResourceName(
    entity,
    pluginConfig,
  );

  if (!eventCatalogResource) {
    return (
      <div style={{ fontStyle: 'italic', opacity: '0.5' }}>
        <span style={{ display: 'block' }}>
          Cannot find a mapping for this entity ({entity.metadata.name}) in
          EventCatalog.
        </span>
        <span style={{ display: 'block' }}>
          Please provide a <a style={{ textDecoration: "underline", color: "#fff"}} target="_blank" href="https://www.eventcatalog.dev/docs/development/plugins/backstage/api">mapping from the entity name to the EventCatalog ID </a>
          in the plugin config.
        </span>
      </div>
    );
  }

  const baseUrlObj = new URL(pluginConfig.URL);

  let url = new URL(
    `${baseUrlObj.pathname}/${page}/${collection}/${eventCatalogResource.id}/${eventCatalogResource.version}?embed=true`,
    pluginConfig.URL,
  ).toString();

  if(page === 'discover') {
    const filter = eventCatalogResource.discoverFilter || eventCatalogResource.id;
    url = new URL(
      `${baseUrlObj.pathname}/${page}/${collection}?embed=true&id=${filter}`,
      pluginConfig.URL,
    ).toString();
  }

  return (
    <div style={{ background: 'white', height: '100%' }}>
      <iframe title={url} src={url} width="100%" height="100%" />
    </div>
  );
};

export const EventCatalogEntityVisualiserCard = () => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="visualiser" />
  </div>);
};
export const EventCatalogEntityMessageCard = () => {
  return (<div style={{ height: '100%'}}>
    <EventCatalogDocumentationEntityPage page="discover" />
  </div>);
};

