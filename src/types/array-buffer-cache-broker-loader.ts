import { IDefaultBrokerDefinition } from 'broker-factory';
import { IArrayBufferCacheBrokerDefinition } from '../interfaces';

export type TArrayBufferCacheBrokerLoader = (url: string) => IArrayBufferCacheBrokerDefinition & IDefaultBrokerDefinition;
