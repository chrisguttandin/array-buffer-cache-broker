import { IBrokerDefinition } from 'broker-factory';

export interface IArrayBufferCacheBrokerDefinition extends IBrokerDefinition {
    clone(arrayBufferId: number): Promise<ArrayBuffer>;

    purge(arrayBufferId: number): void;

    slice(arrayBufferId: number, begin: number, end?: null | number): Promise<ArrayBuffer>;

    store(arrayBuffer: ArrayBuffer): Promise<number>;
}
