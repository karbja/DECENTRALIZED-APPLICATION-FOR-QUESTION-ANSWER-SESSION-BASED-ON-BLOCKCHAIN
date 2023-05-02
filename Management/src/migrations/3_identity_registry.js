const identityRegistry = artifacts.require("identityRegistry");

module.exports = function(deployer) {
  deployer.deploy(identityRegistry);
};