// =====================================
// Adding Folders to Node JS Paths
// =====================================
var module_path = require("app-module-path");

module_path.addPath(__dirname + "/core");
module_path.addPath(__dirname + "/modules");
module_path.addPath(__dirname + "/utilities");
module_path.addPath(__dirname + "/test");

var chai = require("chai");
chai.config.includeStack = true;

global.sinon = require("sinon");

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
