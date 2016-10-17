var should     = require('should'),
    sinon      = require('sinon'),
    events     = require('events'),
    gearmanode = require('../lib/gearmanode'),
    protocol   = require('../lib/gearmanode/protocol'),
    Worker     = gearmanode.Worker,
    Job        = gearmanode.Job,
    JobServer  = require('../lib/gearmanode/job-server').JobServer;


describe('Client/Worker', function() {
    var w, c;

    beforeEach(function() {
        w = gearmanode.worker();
        c = gearmanode.client();
    });
    afterEach(function() {
        w.resetAbilities();
        w.close();
        c.close();
    });


    describe('#submitJob#complete', function() {
        it('should return expected data', function(done) {
            w.addFunction('reverse', function (job) {
                job.payload.should.be.an.instanceof(Buffer);
                job.payload.toString().should.equal('123');
                job.workComplete(job.payload.toString().split("").reverse().join(""))
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', '123');
            job.on('complete', function() {
                job.response.should.be.an.instanceof(Buffer);
                job.response.toString().should.equal('321');
                done();
            });
        })
        it('should return expected data sent as binary', function(done) {
            w.addFunction('reverse', function (job) {
                job.payload.should.be.an.instanceof(Buffer);
                job.payload.toString().should.equal('123');
                job.workComplete(job.payload.toString().split("").reverse().join(""))
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', new Buffer([49, 50, 51]));
            job.on('complete', function() {
                job.response.should.be.an.instanceof(Buffer);
                job.response.toString().should.equal('321');
                done();
            });
        })
        it('should return expected data with diacritic', function(done) {
            w.addFunction('reverse', function (job) {
                job.payload.should.be.an.instanceof(Buffer);
                job.payload.toString().should.equal('žluťoučký kůň');
                job.workComplete(job.payload.toString().split("").reverse().join(""))
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', 'žluťoučký kůň');
            job.on('complete', function() {
                job.response.should.be.an.instanceof(Buffer);
                job.response.toString().should.equal('ňůk ýkčuoťulž');
                done();
            });
        })
        it('should return expected data as String', function(done) {
            w.addFunction('reverse', function (job) {
                job.payload.should.be.an.instanceof(String);
                job.payload.should.equal('123');
                job.workComplete(job.payload.toString().split("").reverse().join(""))
            }, {toStringEncoding: 'ascii'});
	    w.grabJob(1);
            var job = c.submitJob('reverse', Buffer('123', 'ascii'), {toStringEncoding: 'ascii'});
            job.on('complete', function() {
                job.response.should.be.an.instanceof(String);
                job.response.should.equal('321');
                done();
            });
        })
        it('should be Buffer on Client and String on Worker', function(done) {
            w.addFunction('reverse', function (job) {
                job.payload.should.be.an.instanceof(String);
                job.payload.should.equal('123');
                job.workComplete(job.payload.split("").reverse().join(""))
            }, {toStringEncoding: 'ascii'});
	    w.grabJob(1);
            var job = c.submitJob('reverse', new Buffer([49, 50, 51])); // '123'
            job.on('complete', function() {
                job.response.should.be.an.instanceof(Buffer);
                job.response.toString().should.equal('321');
                done();
            });
        })
    })


    describe('#submitJob#workData', function() {
        it('should return expected data', function(done) {
            w.addFunction('dummy', function (job) {
                job.sendWorkData('456');
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('workData', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data sent as Buffer', function(done) {
            w.addFunction('dummy', function (job) {
                job.sendWorkData(new Buffer([52, 53, 54]));
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('workData', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data received as String', function(done) {
            w.addFunction('dummy', function (job) {
                job.sendWorkData(new Buffer([52, 53, 54]));
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123', {toStringEncoding: 'ascii'});
            job.on('workData', function(data) {
                data.should.be.an.instanceof(String);
                data.should.equal('456');
                done();
            });
        })
    })


    describe('#submitJob#warning', function() {
        it('should return expected data', function(done) {
            w.addFunction('dummy', function (job) {
                job.reportWarning('456');
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('warning', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data sent as Buffer', function(done) {
            w.addFunction('dummy', function (job) {
                job.reportWarning(new Buffer([52, 53, 54]));
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('warning', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data received as String', function(done) {
            w.addFunction('dummy', function (job) {
                job.reportWarning(new Buffer([52, 53, 54]));
                job.workComplete()
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123', {toStringEncoding: 'ascii'});
            job.on('warning', function(data) {
                data.should.be.an.instanceof(String);
                data.should.equal('456');
                done();
            });
        })
    })


    describe('#submitJob#exception', function() {
        it('should return expected data', function(done) {
            c.jobServers[0].setOption('exceptions', function(){});
            w.addFunction('dummy', function (job) {
                job.reportException(new Buffer([52, 53, 54]));
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('exception', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data sent as Buffer', function(done) {
            c.jobServers[0].setOption('exceptions', function(){});
            w.addFunction('dummy', function (job) {
                job.reportException(new Buffer([52, 53, 54]));
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123');
            job.on('exception', function(data) {
                data.should.be.an.instanceof(Buffer);
                data.toString().should.equal('456');
                done();
            });
        })
        it('should return expected data received as String', function(done) {
            c.jobServers[0].setOption('exceptions', function(){});
            w.addFunction('dummy', function (job) {
                job.reportException(new Buffer([52, 53, 54]));
            });
	    w.grabJob(1);
            var job = c.submitJob('dummy', '123', {toStringEncoding: 'ascii'});
            job.on('exception', function(data) {
                data.should.be.an.instanceof(String);
                data.should.equal('456');
                done();
            });
        })
    })


    describe('#submitJob#unique', function() {
        it('should propagate unique to worker', function(done) {
            w = gearmanode.worker({withUnique: true});
            w.addFunction('reverse', function (job) {
                job.unique.should.be.an.instanceof(String);
                job.unique.should.equal('foo');
                job.workComplete('ok');
                done();
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', 'alfa', {unique: 'foo'});
        })
        it('should propagate empty unique if not provided by client', function(done) {
            w = gearmanode.worker({withUnique: true});
            w.addFunction('reverse', function (job) {
                job.unique.should.be.an.instanceof(String);
                job.unique.should.equal('');
                job.workComplete('ok');
                done();
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', 'alfa');
        })
        it('should NOT propagate unique to worker', function(done) { // worker with {withUnique: false} by default
            w.addFunction('reverse', function (job) {
                should.not.exist(job.unique);
                job.workComplete('ok');
                done();
            });
	    w.grabJob(1);
            var job = c.submitJob('reverse', 'alfa', {unique: 'foo'});
        })
    })


})
