import { load, wrap } from '../../src/module';

describe('module', () => {

    let url;

    after((done) => {
        // @todo This is a optimistic fix to prevent the famous 'Some of your tests did a full page reload!' error.
        setTimeout(done, 500);
    });

    afterEach(() => {
        Worker.reset();
    });

    beforeEach(() => {
        Worker = ((OriginalWorker) => { // eslint-disable-line no-global-assign
            const instances = [];

            return class ExtendedWorker extends OriginalWorker {

                constructor (url) {
                    super(url);

                    const addEventListener = this.addEventListener;

                    // This is an ugly hack to prevent the broker from handling mirrored events.
                    this.addEventListener = (index, ...args) => {
                        if (typeof index === 'number') {
                            return addEventListener.apply(this, args);
                        }
                    };

                    instances.push(this);
                }

                static addEventListener (index, ...args) {
                    return instances[index].addEventListener(index, ...args);
                }

                static get instances () {
                    return instances;
                }

                static reset () {
                    Worker = OriginalWorker; // eslint-disable-line no-global-assign
                }

            };
        })(Worker);

        const blob = new Blob([
            `self.addEventListener('message', ({ data }) => {
                // The port needs to be send as a Transferable because it can't be cloned.
                if (data.params !== undefined && data.params.port !== undefined) {
                    self.postMessage(data, [ data.params.port ]);
                } else {
                    self.postMessage(data);
                }
            });`
        ], { type: 'application/javascript' });

        url = URL.createObjectURL(blob);
    });

    leche.withData([ 'loaded', 'wrapped' ], (method) => {

        let arrayBufferCache;

        beforeEach(() => {
            if (method === 'loaded') {
                arrayBufferCache = load(url);
            } else {
                const worker = new Worker(url);

                arrayBufferCache = wrap(worker);
            }
        });

        describe('clone()', () => {

            let arrayBufferId;

            beforeEach(() => {
                arrayBufferId = 132;
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'clone',
                        params: { arrayBufferId }
                    });

                    done();
                });

                arrayBufferCache.clone(arrayBufferId);
            });

        });

        describe('connect()', () => {

            let port;

            beforeEach(() => {
                const messageChannel = new MessageChannel();

                port = messageChannel.port1;
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data.params.port).to.be.an.instanceOf(MessagePort);

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'connect',
                        params: {
                            port: data.params.port
                        }
                    });

                    done();
                });

                arrayBufferCache.connect(port);
            });

        });

        describe('disconnect()', () => {

            let port;

            beforeEach(() => {
                const messageChannel = new MessageChannel();

                port = messageChannel.port1;
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data.params.port).to.be.an.instanceOf(MessagePort);

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'disconnect',
                        params: {
                            port: data.params.port
                        }
                    });

                    done();
                });

                arrayBufferCache.disconnect(port);
            });

        });

        describe('purge()', () => {

            let arrayBufferId;

            beforeEach(() => {
                arrayBufferId = 132;
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'purge',
                        params: { arrayBufferId }
                    });

                    done();
                });

                arrayBufferCache.purge(arrayBufferId);
            });

        });

        describe('slice()', () => {

            let arrayBufferId;
            let begin;
            let end;

            beforeEach(() => {
                arrayBufferId = 132;
                begin = 12;
                end = 20;
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'slice',
                        params: { arrayBufferId, begin, end }
                    });

                    done();
                });

                arrayBufferCache.slice(arrayBufferId, begin, end);
            });

        });

        describe('store()', () => {

            let arrayBuffer;

            beforeEach(() => {
                arrayBuffer = new ArrayBuffer(256);
            });

            it('should send the correct message', function (done) {
                this.timeout(4000);

                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data.params.arrayBuffer).to.be.an.instanceOf(ArrayBuffer);
                    expect(data.params.arrayBuffer.byteLength).to.equal(256);

                    expect(data.params.arrayBufferId).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'store',
                        params: {
                            arrayBuffer: data.params.arrayBuffer,
                            arrayBufferId: data.params.arrayBufferId
                        }
                    });

                    done();
                });

                arrayBufferCache.store(arrayBuffer);
            });

        });

    });

});
