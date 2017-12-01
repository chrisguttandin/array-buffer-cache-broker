import {
    ICloneRequest,
    ICloneResponse,
    IConnectRequest,
    IDisconnectRequest,
    IPurgeRequest,
    ISliceRequest,
    ISliceResponse,
    IStoreRequest,
    IWorkerEvent
} from 'array-buffer-cache-worker';
import { addUniqueNumber } from 'fast-unique-numbers';

export const wrap = (worker: MessagePort | Worker) => {
    const arrayBufferIds: Set<number> = new Set();

    const ongoingRequests: Set<number> = new Set();

    const clone = (arrayBufferId: number): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<ICloneResponse> data).result.arrayBuffer);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<ICloneRequest> { id, method: 'clone', params: { arrayBufferId } });
        });
    };

    const connect = (port: MessagePort): Promise<void> => {
        return new Promise((resolve, reject) => {
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve();
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IConnectRequest> { id, method: 'connect', params: { port } }, [ port ]);
        });
    };

    const disconnect = (port: MessagePort): Promise<void> => {
        return new Promise((resolve, reject) => {
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve();
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IDisconnectRequest> { id, method: 'disconnect', params: { port } }, [ port ]);
        });
    };

    const purge = (arrayBufferId: number): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    arrayBufferIds.delete(arrayBufferId);

                    if (data.error === null) {
                        resolve();
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IPurgeRequest> { id, method: 'purge', params: { arrayBufferId } });
        });
    };

    const slice = (arrayBufferId: number, begin: number, end: null | number = null): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<ISliceResponse> data).result.arrayBuffer);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<ISliceRequest> { id, method: 'slice', params: { arrayBufferId, begin, end } });
        });
    };

    const store = (arrayBuffer: ArrayBuffer): Promise<number> => {
        return new Promise((resolve, reject) => {
            const arrayBufferId = addUniqueNumber(arrayBufferIds);
            const id = addUniqueNumber(ongoingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve(arrayBufferId);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IStoreRequest> { id, method: 'store', params: { arrayBuffer, arrayBufferId } }, [ arrayBuffer ]);
        });
    };

    return {
        clone,
        connect,
        disconnect,
        purge,
        slice,
        store
    };
};

export const load = (url: string) => {
    const worker = new Worker(url);

    return wrap(worker);
};
