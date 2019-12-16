import { TArrayBufferCacheWorkerDefinition } from 'array-buffer-cache-worker';
import { createBroker } from 'broker-factory';
import { addUniqueNumber } from 'fast-unique-numbers';
import { IArrayBufferCacheBrokerDefinition } from './interfaces';
import { TArrayBufferCacheBrokerLoader, TArrayBufferCacheBrokerWrapper } from './types';

/*
 * @todo Explicitly referencing the barrel file seems to be necessary when enabling the
 * isolatedModules compiler option.
 */
export * from './interfaces/index';
export * from './types/index';

const arrayBufferIds: Set<number> = new Set();

export const wrap: TArrayBufferCacheBrokerWrapper = createBroker<IArrayBufferCacheBrokerDefinition, TArrayBufferCacheWorkerDefinition>({
    clone: ({ call }) => {
        return (arrayBufferId) => {
            return call('clone', { arrayBufferId });
        };
    },
    purge: ({ call }) => {
        return async (arrayBufferId) => {
            await call('purge', { arrayBufferId });

            arrayBufferIds.delete(arrayBufferId);
        };
    },
    slice: ({ call }) => {
        return (arrayBufferId, begin, end = null) => {
            return call('slice', { arrayBufferId, begin, end });
        };
    },
    store: ({ call }) => {
        return async (arrayBuffer) => {
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
