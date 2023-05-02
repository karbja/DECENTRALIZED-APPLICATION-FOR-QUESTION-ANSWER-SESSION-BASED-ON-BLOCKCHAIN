// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
/*
Copyright (C) 2023 by Ivan Homoliak

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without l> imitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * The role object encapsulating multiple users.
 * The management of users (adding, removing) is made through threshold-based multisig.
 *
 * All methods of this contract can be called directly by members (not through other contract).
 */
contract MultisigMembers is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet members; // all members of the current role
    string public roleName;

    mapping(address => EnumerableSet.AddressSet) addApprovals; // Approvals for addition of new members (i.e., address in the key)
    mapping(address => EnumerableSet.AddressSet) delApprovals; // Approvals for deletion of existing members (i.e., address in the key)

    // Serves for clean-up of stale unapproved member additions/deletions.
    mapping(address => EnumerableSet.AddressSet) cleanupMemberApprovals;

    event MemberAdded(address account);
    event MemberRemoved(address account);
    event MemberNotAdded(address existingAccount);
    event MemberNotRemoved(address nonExistingAccount);
    event StaleApprovalCleaned(address member);

    ////////////////////

    /**
     * Create a role contract with the initial set of members.
     */
    constructor (address[] memory _members, string memory _roleName) {
        roleName = _roleName;

        for(uint i = 0; i < _members.length; i++){
            require(address(0x0) != _members[i], "Zero address passed.");
            members.add(_members[i]);
        }
    }

    function isMember(address account) public view returns (bool) {
        return members.contains(account);
    }

    function addMember(address account) public {
        require(isMember(msg.sender), "Can be called only by a member of the role.");

        addApprovals[account].add(msg.sender);
        if (_thresholdOfSignersMet(addApprovals[account].length())) {
            if(members.add(account)){
                emit MemberAdded(account);
            }else{
                emit MemberNotAdded(account);
            }
            deleteEnumerableAddrSet(addApprovals[account]);
        }
    }

    function removeMember(address account) public {
        require(isMember(msg.sender), "Can be called only by a member of the role.");

        delApprovals[account].add(msg.sender);
        if (_thresholdOfSignersMet(delApprovals[account].length())){
            if(members.remove(account)){
                emit MemberRemoved(account);
            } else {
                emit MemberNotRemoved(account);
            }
            deleteEnumerableAddrSet(delApprovals[account]);
        }
    }

    ////////////////////////////
    ///// Public Getters   /////
    ////////////////////////////

    function getMembers() external view returns (address [] memory) {
        address[] memory allMembers = new address[](members.length());
        for (uint256 i = 0; i < members.length(); i++) {
            allMembers[i] = members.at(i);
        }
        return allMembers;
    }

    function getAddApprovals(address member) external view returns (address [] memory) {
        address[] memory approvals = new address[](addApprovals[member].length());
        for (uint256 i = 0; i < addApprovals[member].length(); i++) {
            approvals[i] = addApprovals[member].at(i);
        }
        return approvals;
    }
    
    function getDelApprovals(address member) external view returns (address [] memory) {
        address[] memory approvals = new address[](delApprovals[member].length());
        for (uint256 i = 0; i < delApprovals[member].length(); i++) {
            approvals[i] = delApprovals[member].at(i);
        }
        return approvals;
    }

    function getCleanupApprovals(address member) external view returns (address [] memory) {
        address[] memory approvals = new address[](cleanupMemberApprovals[member].length());
        for (uint256 i = 0; i < cleanupMemberApprovals[member].length(); i++) {
            approvals[i] = cleanupMemberApprovals[member].at(i);
        }
        return approvals;
    }

    ////////////////////////////
    ///// Clean Up Methods /////
    ////////////////////////////

    /**
     * Should be called from time to time to clean up not approved members.
     * NOTE: the number of members might decrease and previously unapproved additions/deletions of members
     * might become eligible.
     */
    function delStaleMemberApproval(address account) public returns (bool) {
        require(isMember(msg.sender), "Can be called only by a member of the role.");

        cleanupMemberApprovals[account].add(msg.sender);
        if (_thresholdOfSignersMet(uint16(cleanupMemberApprovals[account].length()))){
            deleteEnumerableAddrSet(delApprovals[account]);
            deleteEnumerableAddrSet(addApprovals[account]);
            deleteEnumerableAddrSet(cleanupMemberApprovals[account]);
            emit StaleApprovalCleaned(account);
            return true;
        }
        return false;
    }

    ////////////////////////////////////////////////////
    /////////// Private & internal functions ///////////
    ////////////////////////////////////////////////////

    function _thresholdOfSignersMet(uint256 obtained) internal view returns (bool){
        uint256 total = members.length();
        if(total == 1 && obtained >= 1) // >= is for situations where the number of members was decreased and actions did not finish
            return true;
        else if(total == 2 && obtained >= 2) // >= is for situations where the number of members was decreased and actions did not finish
                return true;
        else if(total > 2 && obtained >= total / 2 + 1)
            return true;
        else
            return false;
    }

    /**
     * Delete of non-atomic type EnumerableSet.AddressSet
     */
    function deleteEnumerableAddrSet(EnumerableSet.AddressSet storage s) internal {
        while(0 != s.length()){ 
            s.remove(s.at(0));
        }
    }
}
