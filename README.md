PPUnit is a test framework that supports parallelization and promises, inspired by Mocha.

Currently only supporting a BDD interface but PPUnit can be extended to include more.

# Parallelization

By default all tests are run in series and all suites are run in parallel. Test and suite parallelism can
be changed on a case by case basis. You can also specifiy a test or suites level of exclusivity, limiting what the test
or suite can run with.

* Non exclusive - Execution is not restricted at all
* Locally exclusive -  These items may not execute alongside any of its siblings.
* Globally exclusive - These items are the only things allowed to run during their execution.

There is a single rule that can not be changed:

**Children suites can not run until their parents tests have completed**

# Basic Usage

A simple non asynchronous, non paralellized test case

    describe('Suite', function () {
        it('1 should equal 1', function () {
            assert(1 === 1, '1 did not equal 1?!')
        })
    })

# Promises

TODO: Fill in this section
Return a promise, it works as you would expect

# Async tests

If the test takes an argument it will be considered async and will only be completed once that argument is executed

    it('Should do things', function (done) {
        setTimeout(done, 1000)
    })

# Marking a test as failed

You can throw, return an error, return a promise and fail it, or call done with a value

    it('test1', function () {
        throw new Error('Failed')
    })

    it('test2', function () {
        return new Error('Failed')
    })

    it('test3', function () {
        var promise = new Promise()

        setTimeout(function () {
            promise.fail(new Error('Because'))
        }, 1000)

        return promise
    })

    it('test4', function (done) {
        done(new Error('Failed'))
    })

    it('test5', function (done) {
        done('ermmm')
    })

# Setting exclusivity

Exclusivity is what controls an items paralellism

On a test (before/each, after/each, and test)

    it('Should do something').nonExclusive()
    it('Should do something').locallyExclusive()
    it('Should do something').globallyExclusive()

On a suite

    describe('suite', function () {...} ).nonExclusive()
    describe('suite', function () {...} ).locallyExclusive()
    describe('suite', function () {...} ).globallyExclusive()

Suites can also set the default exclusivity of all tests within its ancestry (includes child suites)

    describe('suite', function () {
        //All three tests would execute in parallel
        it('test1', function () {...})
        it('test2', function () {...})
        it('test3', function () {...})
    }).nonExclusiveTests()

    describe('suite', function () {
        //All three tests would execute in series and other suites tests may be running as well, this is the default
        it('test1', function () {...})
        it('test2', function () {...})
        it('test3', function () {...})
    }).locallyExclusiveTests()

    describe('suite', function () {
        //All three tests would execute in series and no other tests would be running, this should be avoided
        it('test1', function () {...})
        it('test2', function () {...})
        it('test3', function () {...})
    }).globallyExclusiveTests()

# Skip and Only

A test or suite can be marked as skip, which causes everything within that items ancestry to be skipped,
unless it is marked as only

    describe.skip('suite', function () {
        //This test would be skipped
        it('test1', function () {...})

        //This test would run
        it.only('test2', function () {...})
    })

Multiple items can be marked as only, and only those items would be run

    describe('suite', function () {
        //test1 and test2 will run, test3 will be skipped
        it.only('test1', function () {...})
        it.only('test2', function () {...})
        it('test3', function () {...})
    })

TODO: Explain before/each and after/each only handling

TODO: Explain suite methods

TODO: Explain test methods

TODO: Explain hooks in general

TODO: Explain cli runner

TODO: Explain graphviz stuff
