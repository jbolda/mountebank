'use strict';

const assert = require('assert'),
    Repo = require('../../src/models/filesystemBackedImpostersRepository'),
    rimraf = require('rimraf'),
    cwd = require('process').cwd();

describe('filesystemBackedImpostersRepository', function () {
    afterEach(function () {
        rimraf.sync('.mbtest');
    });

    describe('#add', function () {
        it('should create a header file for imposter', function () {
            const repo = Repo.create({ datadir: '.mbtest' });
            repo.add({ port: 1000, protocol: 'test', customField: true, stubs: [], requests: [] });

            const saved = require(`${cwd}/.mbtest/1000`);
            assert.deepEqual(saved, { port: 1000, protocol: 'test', customField: true });
        });

        it('should save stub predicates in batch and responses individually', function () {
            const repo = Repo.create({ datadir: '.mbtest' });
            repo.add({
                port: 1000,
                protocol: 'test',
                stubs: [{
                    predicates: [
                        { equals: { key: 'value' } },
                        { exists: { first: true } }
                    ],
                    responses: [
                        { is: { field: 'one' } },
                        { is: { field: 'two' } }
                    ]
                }]
            });

            const stubs = require(`${cwd}/.mbtest/1000/stubs/0-99`);
            assert.deepEqual(stubs, [{
                predicates: [
                    { equals: { key: 'value' } },
                    { exists: { first: true } }
                ],
                responseDir: '1000/stubs/0'
            }]);

            const responseIndex = require(`${cwd}/.mbtest/1000/stubs/0/index`);
            assert.deepEqual(responseIndex, {
                next: 0,
                order: [0, 1]
            });

            const firstResponse = require(`${cwd}/.mbtest/1000/stubs/0/0`);
            assert.deepEqual(firstResponse, { is: { field: 'one' } });
            const secondResponse = require(`${cwd}/.mbtest/1000/stubs/0/1`);
            assert.deepEqual(secondResponse, { is: { field: 'two' } });
        });
    });
});
