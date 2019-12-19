'use strict';

const assert = require('assert'),
    StubRepository = require('../../src/models/inMemoryStubRepository'),
    promiseIt = require('../testHelpers').promiseIt;

describe('inMemoryStubRepository', function () {
    function jsonWithoutFunctions (obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    describe('#overwriteAll', function () {
        promiseIt('should overwrite entire list', function () {
            const stubs = StubRepository.create(),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                thirdStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.overwriteAll([thirdStub]))
                .then(() => {
                    return stubs.all().then(all => {
                        const responses = all.map(stub => stub.responses);

                        assert.deepEqual(responses, [
                            [{ is: 'fifth' }, { is: 'sixth' }]
                        ]);
                    });
                });
        });
    });

    describe('#overwriteAtIndex', function () {
        promiseIt('should overwrite single stub', function () {
            const stubs = StubRepository.create(),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                thirdStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.overwriteAtIndex(thirdStub, 1))
                .then(() => stubs.all())
                .then(all => {
                    const responses = all.map(stub => stub.responses);

                    assert.deepEqual(responses, [
                        [{ is: 'first' }, { is: 'second' }],
                        [{ is: 'fifth' }, { is: 'sixth' }]
                    ]);
                });
        });
    });

    describe('#deleteAtIndex', function () {
        promiseIt('should overwrite single stub', function () {
            const stubs = StubRepository.create('utf8'),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                thirdStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.add(thirdStub))
                .then(() => stubs.deleteAtIndex(0))
                .then(() => stubs.all())
                .then(all => {
                    const responses = all.map(stub => stub.responses);

                    assert.deepEqual(responses, [
                        [{ is: 'third' }, { is: 'fourth' }],
                        [{ is: 'fifth' }, { is: 'sixth' }]
                    ]);
                });
        });
    });

    describe('#insertAtIndex', function () {
        promiseIt('should add single stub at given index', function () {
            const stubs = StubRepository.create('utf8'),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                insertedStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.insertAtIndex(insertedStub, 0))
                .then(() => stubs.all())
                .then(all => {
                    const responses = all.map(stub => stub.responses);

                    assert.deepEqual(responses, [
                        [{ is: 'fifth' }, { is: 'sixth' }],
                        [{ is: 'first' }, { is: 'second' }],
                        [{ is: 'third' }, { is: 'fourth' }]
                    ]);
                });
        });
    });

    describe('#all', function () {
        promiseIt('should not allow changing state in stubRepository', function () {
            const stubs = StubRepository.create(),
                stub = { responses: [] };

            return stubs.add(stub)
                .then(() => stubs.all())
                .then(all => {
                    all[0].responses.push('RESPONSE');
                    return stubs.all();
                }).then(all => {
                    assert.deepEqual(jsonWithoutFunctions(all), [{ responses: [] }]);
                });
        });

        promiseIt('should support adding responses', function () {
            const stubs = StubRepository.create(),
                stub = { responses: [] };

            return stubs.add(stub)
                .then(() => stubs.all())
                .then(all => {
                    all[0].addResponse('RESPONSE');
                    return stubs.all();
                }).then(all => {
                    assert.deepEqual(jsonWithoutFunctions(all), [{ responses: ['RESPONSE'] }]);
                });
        });
    });

    describe('#first', function () {
        promiseIt('should return default stub if no match', function () {
            const stubs = StubRepository.create();

            return stubs.first(stub => stub.responses.length === 1).then(match => {
                assert.deepEqual(jsonWithoutFunctions(match),
                    { success: false, index: -1, stub: { responses: [{ is: {} }] } });
            });
        });

        promiseIt('should return default response on nextResponse() if no match', function () {
            const stubs = StubRepository.create();

            return stubs.first(stub => stub.responses.length === 1).then(match => {
                const response = jsonWithoutFunctions(match.stub.nextResponse());
                assert.deepEqual(response, { is: {} });
            });
        });

        promiseIt('should return match with index', function () {
            const stubs = StubRepository.create(),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                thirdStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.add(thirdStub))
                .then(() => stubs.first(stub => stub.responses[0].is === 'third'))
                .then(match => {
                    assert.deepEqual(jsonWithoutFunctions(match),
                        { success: true, index: 1, stub: secondStub });
                });
        });

        promiseIt('should loop through responses on nextResponse()', function () {
            const stubs = StubRepository.create(),
                firstStub = { responses: [{ is: 'first' }, { is: 'second' }] },
                secondStub = { responses: [{ is: 'third' }, { is: 'fourth' }] },
                thirdStub = { responses: [{ is: 'fifth' }, { is: 'sixth' }] };
            let matchedStub;

            return stubs.add(firstStub)
                .then(() => stubs.add(secondStub))
                .then(() => stubs.add(thirdStub))
                .then(() => stubs.first(stub => stub.responses[0].is === 'third'))
                .then(match => {
                    matchedStub = match.stub;
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(jsonWithoutFunctions(response), { is: 'third' });
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(jsonWithoutFunctions(response), { is: 'fourth' });
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(jsonWithoutFunctions(response), { is: 'third' });
                });
        });

        promiseIt('should handle repeat behavior on nextResponse()', function () {
            const stubs = StubRepository.create(),
                stub = { responses: [{ is: 'first', _behaviors: { repeat: 2 } }, { is: 'second' }] };
            let matchedStub;

            return stubs.add(stub)
                .then(() => stubs.first(() => true))
                .then(match => {
                    matchedStub = match.stub;
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(response.is, 'first');
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(response.is, 'first');
                    return matchedStub.nextResponse();
                }).then(response => {
                    assert.deepEqual(response.is, 'second');
                });
        });
    });
});
