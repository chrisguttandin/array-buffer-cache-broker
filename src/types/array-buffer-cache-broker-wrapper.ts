import { IDefaultBrokerDefinition } from 'broker-factory';
import { IArrayBufferCacheBrokerDefinition } from '../interfaces';

export type TArrayBufferCacheBrokerWrapper = (sender: MessagePort | Worker) => IArrayBufferCacheBrokerDefinition & IDefaultBrokerDefinition;
