// To test Queans and identityRegistry, please uncomment update function in Queans smart contract. 
// The tests are not working because identityRegistry address is hardcoded in Queans.
const assert = require('assert'); // npm i assert

const Queans = artifacts.require('Queans');
const identityRegistry = artifacts.require('identityRegistry');

contract('Queans', (accounts) => {
  let idRegistry; // IdentityRegister SC instance
  let queans // Queans SC instance

  let admin = accounts[0];
  let validUser1 = accounts[1];
  let validUser2 = accounts[2];
  let validUser3 = accounts[3];

  let invalidUser1 = accounts[4]; // not verified identity
  let invalidUser2 = accounts[5]; // not added

  let validIdProvider1; 
  let idProvider1Name = "Provider1-name";
  let idProvider1DID = "Provider1-did";

  let validIdProvider2;
  let idProvider2Name = "Provider2-name";
  let idProvider2DID = "Provider2-did";

  before(async () => {
    queans = await Queans.new({from: admin});
    idRegistry = await identityRegistry.new();
    await queans.update(idRegistry.address);
    await web3.eth.accounts.wallet.create(2); // creates accounts for idProviders
    validIdProvider1 = web3.eth.accounts.wallet[0]; 
    validIdProvider2 = web3.eth.accounts.wallet[1];
  });

/* identityRegistry tests */

  it('Add new idProvider', async () => {
    let receipt = await idRegistry.addIdentityProvider(validIdProvider1.address, idProvider1DID, idProvider1Name, {from: admin});

    receipt.receipt.logs.forEach( e => {
        if(e.event !== undefined && e.event == "IdentityProviderAdded") {
            assert(e.args.idprovider == validIdProvider1.address);
        }
    })

    let idpMetadata = await idRegistry.idpMetadata(validIdProvider1.address);
    assert(idpMetadata.name == idProvider1Name);
    assert(idpMetadata.did == idProvider1DID);
    assert(idpMetadata.valid);

    let idps = await idRegistry.getIDPs.call();
    assert(idps.includes(validIdProvider1.address));

    console.log("\t Gas used in addIdentityProvider (1 sig) = ", receipt.receipt.gasUsed);
  });

  it('Add verified user', async () => {
    
    // get provider's signature
    let verifiableCredentials = (validUser1, " is person with legitimate identity at contract address ", idRegistry.address);

    // get ec siganture of verifCredentials
    let signature = web3.eth.accounts.sign(verifiableCredentials, validIdProvider1.privateKey);

    // add user1
    let receipt = await idRegistry.addVerifiedUser(signature.messageHash, validIdProvider1.address, validUser1, signature.v, signature.r, signature.s, {from: admin});

    let registry = await idRegistry.registry(validUser1);
    assert(registry.valid);

    console.log("\t Gas used in addVerifiedUser = ", receipt.receipt.gasUsed);
  });


  it('Add additional idProvider and 3 users', async () => {
    await idRegistry.addIdentityProvider(validIdProvider2.address, idProvider2DID, idProvider2Name, {from: admin})

    let signature = web3.eth.accounts.sign((validUser2, " is person with legitimate identity at contract address ", idRegistry.address), validIdProvider1.privateKey);
    await idRegistry.addVerifiedUser(signature.messageHash, validIdProvider1.address, validUser2, signature.v, signature.r, signature.s, {from: admin});

    signature = web3.eth.accounts.sign((validUser3, " is person with legitimate identity at contract address ", idRegistry.address), validIdProvider2.privateKey);
    await idRegistry.addVerifiedUser(signature.messageHash, validIdProvider2.address, validUser3, signature.v, signature.r, signature.s, {from: admin});

    signature = web3.eth.accounts.sign((invalidUser2, " is person with legitimate identity at contract address ", idRegistry.address), validIdProvider2.privateKey);
    await idRegistry.addVerifiedUser(signature.messageHash, validIdProvider2.address, invalidUser2, signature.v, signature.r, signature.s, {from: admin});
  });
  
/* Queans tests */
   it('addRelation test', async () => {
    await queans.addRelation(1679601600, 1679605200, "TV Nova", false, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});
    await queans.addRelation(1679601600, 1679605200, "TV Nova", true, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});
    await queans.addRelation(1679688000, 1679691600, "ČT 1", false, {from: validUser2, value: web3.utils.toWei('1', 'gwei')});
    await queans.addRelation(1679601600, 1679605200, "TV Nova", false, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});
    await queans.addRelation(1679601600, 1679605200, "TV Nova", true, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});
    await queans.addRelation(1679601600, 1679605200, "TV Nova", false, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});

    await assert.rejects(
      queans.addRelation(1679688000, 1679691600, "ČT 1", false, {from: invalidUser1, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /User does not have verified identity/,
      }
    );

    await assert.rejects(
      queans.addRelation(1679688000, 1679691600, "ČT 1", false, {from: validUser1}), 
      {
          name: "Error",
          message: /You must pay at least 1 gwei to addRelation/,
      }
    );

  });

  it('changeRelationPhase test', async () => {
    await queans.changeRelationPhase(0, {from: validUser1});
  
    let relation = await queans.getRelation(0);
    assert(relation.votePhase == true);

    await assert.rejects(
      queans.changeRelationPhase(0, {from: validUser1}), 
      {
          name: "Error",
          message: /You can change phase only once!/,
      }
    );

    await assert.rejects(
      queans.changeRelationPhase(2, {from: validUser1}), 
      {
          name: "Error",
          message: /You must be creator of relation to change the phase/,
      }
    );
  });

  it('addUsersToRelation test', async () => {
    let list = [validUser1, validUser2, validUser3, invalidUser1, invalidUser2];
    await queans.addUsersToRelation(list, 2, {from: validUser2});

    let relation = await queans.getRelation(2);
    assert(relation.privateList.length == 5);

    await assert.rejects(
      queans.addUsersToRelation(list, 2, {from: validUser1}), 
      {
          name: "Error",
          message: /You must be creator of relation to add users/,
      }
    );

    await assert.rejects(
      queans.addUsersToRelation(list, 1, {from: validUser1}), 
      {
          name: "Error",
          message: /You can add users only to private relation/,
      }
    );

    await assert.rejects(
      queans.addUsersToRelation(list, 0, {from: validUser1}), 
      {
          name: "Error",
          message: /You can not add users in vote phase/,
      }
    );

  });

  it('addQuestion test', async () => {

    await assert.rejects(
      queans.addQuestion("Otázka3", 4, {from: validUser2, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /You can add questions only in votePhase/,
      }
    );

    await queans.changeRelationPhase(4, {from: validUser1});

    await assert.rejects(
      queans.addQuestion("Otázka3", 4, {from: validUser1, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /Relation author can not add questions/,
      }
    );

    await queans.addQuestion("Otázka3", 4, {from: validUser2, value: web3.utils.toWei('1', 'gwei')});

    await assert.rejects(
      queans.addQuestion("Otázka3", 4, {from: validUser2, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /User is already added question to this relation/,
      }
    );

    await assert.rejects(
      queans.addQuestion("Otázka3", 4, {from: validUser3}), 
      {
          name: "Error",
          message: /You must pay at least 1 gwei to addQuestion/,
      }
    );

    await assert.rejects(
      queans.addQuestion("Otázka3", 4, {from: invalidUser1, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /User does not have verified identity/,
      }
    );

    await queans.changeRelationPhase(3, {from: validUser1});  

    await assert.rejects(
      queans.addQuestion("Otázka3", 3, {from: validUser3, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /Relation list of users is empty/,
      }
    );

    let list = [validUser1, validUser2, invalidUser1, invalidUser2];
    await queans.addUsersToRelation(list, 5, {from: validUser1});

    await queans.changeRelationPhase(5, {from: validUser1}); 
    
    await queans.addQuestion("Test", 5, {from: validUser2, value: web3.utils.toWei('1', 'gwei')});

    await assert.rejects(
      queans.addQuestion("Otázka3", 5, {from: validUser3, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /Sender must be added to private relation/,
      }
    );


  });

  it('voteForQuestion test', async () => {

    await assert.rejects(
      queans.voteForQuestion(1, 5, {from: invalidUser1, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /User does not have verified identity/,
      }
    );

    await assert.rejects(
      queans.voteForQuestion(1, 5, {from: validUser2, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /You can not vote for your own question/,
      }
    );

    await assert.rejects(
      queans.voteForQuestion(1, 5, {from: validUser1}), 
      {
          name: "Error",
          message: /You must pay at least 1 gwei to vote/,
      }
    );

    await queans.voteForQuestion(1, 5, {from: validUser1, value: web3.utils.toWei('1', 'gwei')});

    await assert.rejects(
      queans.voteForQuestion(1, 5, {from: validUser1, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /You already voted for this question/,
      }
    );

    await assert.rejects(
      queans.voteForQuestion(1, 5, {from: validUser3, value: web3.utils.toWei('1', 'gwei')}), 
      {
          name: "Error",
          message: /Sender must be added to private relation to vote/,
      }
    );

  });

});
