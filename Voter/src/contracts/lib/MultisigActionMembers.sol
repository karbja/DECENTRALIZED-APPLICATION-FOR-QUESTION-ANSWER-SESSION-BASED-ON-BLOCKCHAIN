// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
/*
Copyright (C) 2023 by Ivan Homoliak

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without l> imitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./MultisigMembers.sol";


/**
 * The role object encapsulating multiple users, enabling to vote on arbitrary actions (represented by their hash).
 *
 * The main method of this contract (approveAction) cannot be called directly by members but
 * requires a call through the owner contract (relying one).
 *
 * Clean-up method for stale approvals can be called directly by members.
 */
contract MultisigActionMembers is MultisigMembers {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;


    // Encapsulation of actions and their approval state
    mapping(bytes32 => EnumerableSet.AddressSet) actionApprovals; // maps hashes (of actions with parameters) to signature sets made by members
    EnumerableSet.Bytes32Set actionHashes; // hashes of actions being approved (required for easier iteration by DAPPs)
    mapping(bytes32 => bytes) public actionParams; // maps hashes to parameters of actions encoded as bytes[] (hashes can be taken from the previous)

    // Serves for clean-up of stale unapproved actions.
    mapping(bytes32 => EnumerableSet.AddressSet) cleanupActionApprovals;

    event ActionApproved(bytes32 actionHash);
    event SignatureAdded(bytes32 actionHash);
    event StaleActionApprovalDeleted(bytes32 actionHash);

    ////////////////////

    constructor (address[] memory _members, string memory _roleName)
        MultisigMembers(_members, _roleName)
    {}

    /**
     * Method for approving actions by members.
     *
     * Note: we check the ownership by a contract utilizing this functionality by msg.sender
     * since we want to avoid using tx.origin for the multisig signer (sender) due to security concerns (such as delegated calls).
     */
    function approveAction(bytes calldata _actionParams, address sender) external
        onlyOwner() // must be called through Relying contract
        returns (bool)
    {
        require(isMember(sender), "Can be called only by a member of the role.");

        bytes32 action_hash = keccak256(_actionParams);
        if(0 == actionApprovals[action_hash].length()) { // the 1st approval request creates aux objects representing the action (parsable by DAPPs)
            actionHashes.add(action_hash);
            actionParams[action_hash] = _actionParams;
        }

        // add the signer and execute action if we have enough signatures
        actionApprovals[action_hash].add(sender);
        emit SignatureAdded(action_hash);
        
        if (_thresholdOfSignersMet(uint16(actionApprovals[action_hash].length()))){
            _deleteAction(action_hash);
            emit ActionApproved(action_hash);
            return true;
        }
        return false;
    }


    ////////////////////////////
    ///// Public Getters   /////
    ////////////////////////////    

    function getActionApprovals(bytes32 actionHash) external view returns (address [] memory) {
        address[] memory approvals = new address[](actionApprovals[actionHash].length());
        for (uint256 i = 0; i < actionApprovals[actionHash].length(); i++) {
            approvals[i] = actionApprovals[actionHash].at(i);
        }
        return approvals;
    }

    function getActionsInProgress() external view returns (bytes32 [] memory) {
        bytes32[] memory allHashes = new bytes32[](actionHashes.length());
        for (uint256 i = 0; i < actionHashes.length(); i++) {
            allHashes[i] = actionHashes.at(i);
        }
        return allHashes;
    }

    function getCleanupActionApprovals(bytes32 actionHash) external view returns (address [] memory) {
        address[] memory approvals = new address[](cleanupActionApprovals[actionHash].length());
        for (uint256 i = 0; i < cleanupActionApprovals[actionHash].length(); i++) {
            approvals[i] = cleanupActionApprovals[actionHash].at(i);
        }
        return approvals;
    }

    ////////////////////////////
    ///// Clean Up Methods /////
    ////////////////////////////

    /**
     * Clearing method for actionApprovals.
     * It might be useful to drop unapproved stale actions since the number of members might decrease
     * and such actions might become eligible for execution later (should be handled by DAPP + timeouts).
     *
     * Should be called directly by a member of the role.
     */
    function delStaleActionApproval(bytes32 action_hash) public returns (bool){
        require(isMember(msg.sender), "Can be called only by a member of the role.");

        cleanupActionApprovals[action_hash].add(msg.sender);
        if (_thresholdOfSignersMet(uint16(cleanupActionApprovals[action_hash].length()))){
            _deleteAction(action_hash);
                        
            deleteEnumerableAddrSet(cleanupActionApprovals[action_hash]);            
            emit StaleActionApprovalDeleted(action_hash);
            return true;
        }
        return false;
    }

    ////////////////////////////////////////////////////
    /////////// Private & internal functions ///////////
    ////////////////////////////////////////////////////

    function _deleteAction(bytes32 action_hash) internal {

        deleteEnumerableAddrSet(actionApprovals[action_hash]);                
        delete actionParams[action_hash];
        actionHashes.remove(action_hash);
    }
}
