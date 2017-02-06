"use strict";

var sinon = require('sinon');

describe('Testing BluetoothSerial Class', function ()
{
	// =====================================
	// Loading Libraries
	// =====================================
	var BluetoothSerial = require('../../utilities/extended/BluetoothSerial');
	var Log = require('../../utilities/Log');
	var log = new Log("BluetoothSerial", "blue");
	// =====================================
	// Unit test global variables
	// =====================================
	var connection, unit_test, spark;

	var device = 1;

	var write, log, output = '';
	var fs = require('fs');

	describe('BluetoothSerial#constructor', function ()
	{
		it('Should initialize without failure', function()
		{
			unit_test = new BluetoothSerial({
				mac: "00:21:13:00:71:A1",
				baud: 38400,
				log: log,
				dev: device
			});
			expect(unit_test).to.exist;
			expect(unit_test).to.be.a('object');
		});
		it('RFCOMM should exist ', function(done)
		{
			fs.access(`/dev/rfcomm${device}`, fs.constants.R_OK | fs.constants.W_OK, (err) =>
			{
				expect(err).to.not.exist;
				done();
			});
		});
	});

	describe('BluetoothSerial#setupRFComm', function ()
	{
		var stub_fs;
		var stub_bind;
		var stub_exec;
		before(function()
		{
			stub_fs = sinon.stub(unit_test.fs, "existsSync");
			stub_fs.onFirstCall().returns(false);
			stub_fs.returns(true);

			stub_bind = sinon.stub(unit_test, "bind");
			stub_exec = sinon.stub(unit_test, "exec");
		});
		it('Should execute bind if fs.existsSync returns false', function()
		{
			//// 1st call
			unit_test.setupRFComm();
			expect(stub_bind.called).to.be.true;
			expect(stub_exec.called).to.be.false;
		});
		it('Should execute exec if fs.existsSync returns true', function()
		{
			//// 2nd call
			unit_test.setupRFComm();
			//// Bind does not get called this case because spy 'exec' callback does not exist.
			expect(stub_bind.called).to.be.false;
			expect(stub_exec.called).to.be.true;
		});
		afterEach(function() {
			stub_bind.reset();
			stub_exec.reset();
		});
		after(function()
		{
			stub_fs.restore();
			stub_bind.restore();
			stub_exec.restore();
		});
	});

	describe('BluetoothSerial#bind', function () {
		//// TODO: MAKE A TEST FOR THIS!s
	});

	describe('BluetoothSerial#onPortOpen', function ()
	{
		it('Should set ready flag to true after being called"', function()
		{
			unit_test.ready = false;
			unit_test.onPortOpen();
			expect(unit_test.ready).to.be.true;
		});
	});

	describe('BluetoothSerial#onPortData', function ()
	{
		var store_callback_map;
		var Aflag, Avalue, Bflag, Bvalue;
		before(function()
		{
			store_callback_map = unit_test.callback_map;
			unit_test.callback_map = {
				"A": function(value) { Aflag = true; Avalue = value; },
				"B": function(value) { Bflag = true; Bvalue = value; }
			}
		});
		beforeEach(function() {
			Aflag = false;
			Avalue = 0;
			Bflag = false;
			Bvalue = 0;
		})
		it('Should call A and B function in map given complete single message', function()
		{
			unit_test.onPortData("@A,512\r\n");
			unit_test.onPortData("@B,1024\r\n");

			expect(Aflag).to.be.true;
			expect(Avalue).to.equal(512);

			expect(Bflag).to.be.true;
			expect(Bvalue).to.equal(1024);
		});
		it('Should call A and B function in map given combined message', function()
		{
			unit_test.onPortData("@A,123\r\n@B,1024\r\n@B,200\r\n");
			expect(Aflag).to.be.true;
			expect(Avalue).to.equal(123);
			expect(Bflag).to.be.true;
			//// BValue should contain the last value sent.
			expect(Bvalue).to.equal(200);
		});
		it('Should call A and B function in map given fragmented combined message', function()
		{

			unit_test.onPortData("@");
			unit_test.onPortData("A");
			unit_test.onPortData(",123");
			unit_test.onPortData("\r\n@B,");

			expect(Aflag).to.be.true;
			expect(Avalue).to.equal(123);

			expect(Bflag).to.be.false;
			expect(Bvalue).to.equal(0);

			unit_test.onPortData("321");
			unit_test.onPortData("\r\n");

			//// should not change value
			expect(Aflag).to.be.true;
			expect(Avalue).to.equal(123);

			expect(Bflag).to.be.true;
			expect(Bvalue).to.equal(321);
		});
		after(function()
		{
			unit_test.callback_map = store_callback_map;
		});
	});

	describe('BluetoothSerial#onPortError', function ()
	{
		var error_message = "";
		var stub;
		before(function()
		{
			stub = sinon.stub(unit_test.log, "output", function(string)
			{
				error_message = string;
			});
		});
		it('Should log error message', function()
		{
			unit_test.onPortError("COULDN'T DO THE THING!!");

			expect(stub.calledWith("COULDN'T DO THE THING!!")).to.be.true;
			expect(error_message).to.equal("COULDN'T DO THE THING!!");
		});
		after(function()
		{
			stub.restore();
		});
	});

	describe('BluetoothSerial#sendraw And #send', function ()
	{
		const PORT_MESSAGE = "SENDRAW-TEST";
		var stub_write;
		var previous_port;
		before(function()
		{
			previous_port = unit_test.port;
			unit_test.port = { 'write': function() {} };
			stub_write = sinon.stub(unit_test.port, "write");
		});
		it('Should write raw string with this.ready = true', function()
		{
			unit_test.sendraw(PORT_MESSAGE);
			expect(stub_write.calledWith(PORT_MESSAGE)).to.be.true;
		});
		it('Should NOT write raw string with this.ready = false', function()
		{
			unit_test.ready = false;
			unit_test.sendraw("SENDRAW-TEST");
			expect(stub_write.calledWith(PORT_MESSAGE)).to.be.false;
		});
		it('Should write formated string', function()
		{
			unit_test.send('A', 100);
			unit_test.send('B', 34.24);
			unit_test.send('C', -1234);
			expect(stub_write.calledWith('@A,100\r\n')).to.be.true;
			expect(stub_write.calledWith('@B,34.24\r\n')).to.be.true;
			expect(stub_write.calledWith('@C,-1234\r\n')).to.be.true;
		});
		afterEach(function()
		{
			unit_test.ready = true;
			stub_write.reset();
		});
		after(function()
		{
			unit_test.ready = true;
			stub_write.restore();
			unit_test.port = previous_port;
		});
	});

	describe('BluetoothSerial#attachListener', function ()
	{
		var EXPECTED_A_VALUE = 100.02;
		var EXPECTED_B_VALUE = -142341;
		var EXPECTED_C_VALUE = 7847;
		var EXPECTED_S_VALUE = 9999.8765;

		it('Should create callback function map', function(done)
		{
			//// Create Spy Map
			var spy = {
				'A': sinon.spy(function(value)
				{
					expect(value).to.equal(EXPECTED_A_VALUE);
				}),
				'B': sinon.spy(function(value)
				{
					expect(value).to.equal(EXPECTED_B_VALUE);
				}),
				'C': sinon.spy(function(value)
				{
					expect(value).to.equal(EXPECTED_C_VALUE);
				}),
				'S': sinon.spy(function(value)
				{
					expect(value).to.equal(EXPECTED_S_VALUE);
				})
			};

			unit_test.attachListener('A', spy['A']);
			unit_test.attachListener('B', spy['B']);
			unit_test.attachListener('C', spy['C']);
			unit_test.attachListener('S', spy['S']);

			//// Check that attachListener created a callback function map
			expect(unit_test.callback_map['A']).to.be.a('function');
			expect(unit_test.callback_map['B']).to.be.a('function');
			expect(unit_test.callback_map['C']).to.be.a('function');
			expect(unit_test.callback_map['S']).to.be.a('function');

			//// Run callback map functions
			unit_test.callback_map['A'](EXPECTED_A_VALUE);
			unit_test.callback_map['B'](EXPECTED_B_VALUE);
			unit_test.callback_map['C'](EXPECTED_C_VALUE);
			unit_test.callback_map['S'](EXPECTED_S_VALUE);

			setTimeout(function()
			{
				//// Check if spy's were placed in map by checking if they were called
				expect(spy['A'].called).to.be.true;
				expect(spy['B'].called).to.be.true;
				expect(spy['C'].called).to.be.true;
				expect(spy['S'].called).to.be.true;
				done();
			}, 250);
		});
	});
});
