Unit Testing and Code Coverage
=================================

Unit Testing Tools
-------------------
RoverCore-S uses the following the libraries:

#. `Mocha <https://mochajs.org/>`_ as a unit testing framework
#. `Chai <http://chaijs.com/>`_ as an assertion library
#. `Sinon <http://sinonjs.org/>`_ as a stubs library.
#. `JSHint <http://jshint.com/>`_ as a JS linter
#. `Istanbul <https://istanbul.js.org/>`_ as the test coverage library.
#. `Grunt <https://gruntjs.com/>`_ to run the tests, linter, and coverage

These libraries are installed when you run the ``./install.sh`` file.

Testing Commands
::::::::::::::::::

To run everything, just use

.. code-block:: bash

	npm test

Run everything except for istanbul code coverage

.. code-block:: bash

	grunt --force

Run unit tests

.. code-block:: bash

	grunt lint

Run just linter

.. code-block:: bash

	grunt unittest

Run a single and specific unit test is the following command

.. code-block:: bash

	mocha --require test/config_chai.js test/modules/<unit test file>.js

To generate a code coverage report, run this in the root of the project

.. code-block:: bash

	bash <(curl -s https://codecov.io/bash)


Creating a Unit Test
::::::::::::::::::::::
