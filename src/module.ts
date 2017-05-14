import {
    ICloneRequest,
    ICloneResponse,
    IPurgeRequest,
    ISliceRequest,
    ISliceResponse,
    IStoreRequest,
    IWorkerEvent
} from 'array-buffer-cache-worker';

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

const generateUniqueId = (set: Set<number>) => {
    let id = Math.round(Math.random() * MAX_SAFE_INTEGER);

    while (set.has(id)) {
        id = Math.round(Math.random() * MAX_SAFE_INTEGER);
    }

    return id;
};

export const load = (url: string) => {
    const worker = new Worker(url);

    const arrayBufferIds: Set<number> = new Set();

    const ongoingRecordingRequests: Set<number> = new Set();

    const clone = (arrayBufferId: number): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const id = generateUniqueId(ongoingRecordingRequests);

            ongoingRecordingRequests.add(id);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

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

    const purge = (arrayBufferId: number): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const id = generateUniqueId(ongoingRecordingRequests);

            ongoingRecordingRequests.add(id);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    ongoingRecordingRequests.delete(arrayBufferId);

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

    const slice = (arrayBufferId: number, begin: number, end: null | number = null): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const id = generateUniqueId(ongoingRecordingRequests);

            ongoingRecordingRequests.add(id);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

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
            const id = generateUniqueId(ongoingRecordingRequests);

            ongoingRecordingRequests.add(id);

            const arrayBufferId = generateUniqueId(arrayBufferIds);

            arrayBufferIds.add(arrayBufferId);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

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
        purge,
        slice,
        store
    };
};
