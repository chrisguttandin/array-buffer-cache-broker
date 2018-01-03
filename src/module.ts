import { TArrayBufferCacheWorkerDefinition } from 'array-buffer-cache-worker';
import { createBroker } from 'broker-factory';
import { addUniqueNumber } from 'fast-unique-numbers';
import { IArrayBufferCacheBrokerDefinition } from './interfaces';
import { TArrayBufferCacheBrokerLoader, TArrayBufferCacheBrokerWrapper } from './types';

export * from './interfaces';
export * from './types';

const arrayBufferIds: Set<number> = new Set();

export const wrap: TArrayBufferCacheBrokerWrapper = createBroker<IArrayBufferCacheBrokerDefinition, TArrayBufferCacheWorkerDefinition>({
    clone: ({ call }) => {
        return async (arrayBufferId: number): Promise<ArrayBuffer> => {
            return call('clone', { arrayBufferId });
        };
    },
    purge: ({ call }) => {
        return async (arrayBufferId: number): Promise<void> => {
            await call('purge', { arrayBufferId });

            arrayBufferIds.delete(arrayBufferId);
        };
    },
    slice: ({ call }) => {
        return (arrayBufferId: number, begin: number, end: null | number = null): Promise<ArrayBuffer> => {
            return call('slice', { arrayBufferId, begin, end });
        };
    },
    store: ({ call }) => {
        return async (arrayBuffer: ArrayBuffer): Promise<number> => {
            const arrayBufferId = addUniqueNumber(arrayBufferIds);

            await call('store', { arrayBuffer, arrayBufferId }, [ arrayBuffer ]);

            return arrayBufferId;
        };
    }
});

export const load: TArrayBufferCacheBrokerLoader = (url: string) => {
    const worker = new Worker(url);

    return wrap(worker);
};
