// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
/*
Copyright (C) 2023 by Ivan Homoliak

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without l> imitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import "./lib/MultisigActionMembers.sol";
import "./lib/IIdentityRegistry.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract IdentityRegistry is IIdentityRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Identity management admins - can be validators, maintainers, etc
    MultisigActionMembers public idmAdmins;

    // Possible multisig actions for Idm admins
    enum ActionsIdm { ADD_IDP, DEL_IDP,  UPDATE_IDP, UPDATE_EXPIRATION, REVOKE_USER, REACTIVATE_USER, RENEW_EXPIRED_USER }

    // All valid external identity providers who provide signed minimal verifiable credentials of users (did + GEN address).
    EnumerableSet.AddressSet idProviders;

    struct ProviderMeta {
        string name;
        string did;     // DID registered in Identity Management blockchain - i.e., Hyperledger Indy
        uint timestamp; // of inserting the first request for inclusion
        bool valid;
    }
    mapping(address => ProviderMeta) public idpMetadata; // Note that this contains also yet unapproved identity providers

    // Registry of users with verified identities
    struct UserMeta {
        uint timestamp; // of inserting
        bool valid;
    }
    mapping(address => UserMeta) public registry; // mapping of user blockchain addresses to metadata
    uint public expirationDays = 36500; // default expiration in days (100 years)

    // event UserIsInvalidated(address userAddr);
    // event UserIsExpired(address userAddr);
    event IdentityProviderAdded(address idprovider);
    event IdentityProviderRemoved(address idprovider);
    event IdentityProviderUpdated(address idprovider);

    /**
     * Initializes identity registry contract with the sender as the first member of idmAdmins role.
     */
    constructor() {
        address[] memory _idmAdmins = new address[](1);
        _idmAdmins[0] = msg.sender; // add the sender as the first member of the role
        idmAdmins  = new MultisigActionMembers(_idmAdmins, "Identity Management Admins");
    }

    /**
     * Called by other contracts to verify identity of users.
     */
    function verifyIdentity(address userAddr) external override view returns(bool){

        if(0 != registry[userAddr].timestamp){
            UserMeta storage u = registry[userAddr];
            if(!u.valid){
                // emit UserIsInvalidated(userAddr);
                return false;
            }
            if(u.timestamp / 1 days + expirationDays < block.timestamp / 1 days){
                // emit UserIsExpired(userAddr);
                return false;
            }
            return true;
        }
        return false;
    }


    ////////////////////////////
    ///// Public Getters   /////
    ////////////////////////////   

    function getIDPs() external view returns (address [] memory) {
        address[] memory idps = new address[](idProviders.length());
        for (uint i = 0; i < idProviders.length(); i++) {
            idps[i] = idProviders.at(i);
        }
        return idps;
    }

    //////////////////////////////////////////////////////////////////////////////////
    /////////////// Management of IDPs and Expiration by Multisig Admins /////////////
    //////////////////////////////////////////////////////////////////////////////////

    /**
     * Called by idmAdmins to insert/delete/update identity providers.
     */
    function addIdentityProvider(address idprovider, string calldata did, string calldata name) public returns(bool) {
        require(!idProviders.contains(idprovider), "Identity provider already exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.ADD_IDP, idprovider, did, name);
        
        if(0 == idpMetadata[idprovider].timestamp){ // create meta entry for easier parsing by DAPPs
                idpMetadata[idprovider] = ProviderMeta(name, did, block.timestamp, false);
        }
        
        if(false == idmAdmins.approveAction(action_params, msg.sender)){            
            return false; // we do not have enough signatures yet
        }

        idProviders.add(idprovider); // we have enough signatures, so add the new valid identity provider
        idpMetadata[idprovider].valid = true;
        emit IdentityProviderAdded(idprovider);
        return true;
    }

    function delIdentityProvider(address idprovider) public returns(bool) {
        require(idProviders.contains(idprovider), "Identity provider does not exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.DEL_IDP, idprovider);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        idProviders.remove(idprovider); // we have enough signatures, so remove the provider
        idpMetadata[idprovider].valid = false;
        emit IdentityProviderRemoved(idprovider);
        return true;
    }

    function updateIdentityProvider(address idprovider, string calldata did, string calldata name) public returns(bool) {
        require(idProviders.contains(idprovider), "Identity provider does not exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.UPDATE_IDP, idprovider, did, name);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        // we have enough signatures, so update the provider
        idpMetadata[idprovider].did = did;
        idpMetadata[idprovider].name = name;
        emit IdentityProviderUpdated(idprovider);
        return true;
    }

    /**
     * Update the global expiration interval in days.
     */
    function updateExpiration(uint256 newExpiration) public returns(bool) {

        bytes memory action_params = abi.encodePacked(ActionsIdm.UPDATE_EXPIRATION, expirationDays, newExpiration);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        // we have enough signatures, so adjust new expiration interval
        expirationDays = newExpiration;
        return true;
    }

    function revokeUser(address userAddr) public returns(bool) {
        require(0 != registry[userAddr].timestamp, "The user does not exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.REVOKE_USER, userAddr);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        // we have enough signatures, so invalidate the user
        registry[userAddr].valid = false;
        return true;
    }

    /**
     * It reactivates an already revoked user, e.g., by accident.
     */
    function reactivateUser(address userAddr) public returns(bool) {
        require(0 != registry[userAddr].timestamp, "The user does not exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.REACTIVATE_USER, userAddr);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        // we have enough signatures, so reactivate the user
        registry[userAddr].valid = true;
        return true;
    }

    function renewExpiredUser(address userAddr) public returns(bool) {
        require(0 != registry[userAddr].timestamp, "The user does not exist.");

        bytes memory action_params = abi.encodePacked(ActionsIdm.RENEW_EXPIRED_USER, userAddr);
        if(false == idmAdmins.approveAction(action_params, msg.sender)){
            return false; // we do not have enough signatures yet
        }

        // we have enough signatures, so renew the user
        registry[userAddr].timestamp = block.timestamp;
        return true;
    }

    /////////////////////////////////////////////////////////////
    /////////// Management of User Identities by IDPs ///////////
    /////////////////////////////////////////////////////////////

    /**
     * This method is called by anybody who provides a signed minimal verifiable credentials (userAddr + " person with legitimate identity") of a user
     * by a valid identity provider (represented by idpAddress).
     * Note that identity provider does not call this contract, she only signs VCs and relays them to anybody who will call this method.
     *
     * IH: I think that only idmAdmins should call this method and they might also request some larger than minimal VCs to verify off-chain name and others.
     */
    function addVerifiedUser(bytes32 hash, address idpAddress, address userAddr, uint8 sig_v, bytes32 sig_r, bytes32 sig_s) public {

        require(idProviders.contains(idpAddress), "Passed address of non-existing identity provider.");
        require(0 == registry[userAddr].timestamp, "The user already exists.");
        //bytes memory data = abi.encodePacked(userAddr, " is person with legitimate identity at contract address ", address(this));
        require(_validSignature(hash, idpAddress, sig_v, sig_r, sig_s), "Ecrecover: signature of identity provider is not correct.");

        // add the user with verified identity
        registry[userAddr] = UserMeta(block.timestamp, true);
    }

    ////////////////////////////////////////////////////
    /////////// Private & internal functions ///////////
    ////////////////////////////////////////////////////

    function _validSignature(bytes32 hash, address PK, uint8 sig_v, bytes32 sig_r, bytes32 sig_s) private pure returns (bool) {
        //bytes32 hash = keccak256(abi.encodePacked(data));
        if(PK == ecrecover(hash, sig_v, sig_r, sig_s)){
          return true;
        }else{
          return false;
        }
    }
    
}