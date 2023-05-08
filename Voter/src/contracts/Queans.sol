// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./lib/IIdentityRegistry.sol";
import "./identityRegistry.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Queans {

    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet users;

    mapping(uint=>Question) questions;
    uint numQuestions;

    mapping(uint=>Relation) relations;
    uint numRelations;

    IIdentityRegistry public idm; 

    constructor() {  
        idm = IdentityRegistry(address(0x73520BE39804D6E9De9415bc3CA86E8cFC9f8EDB));
    }

    /**
     * Only for test purposes, otherwise keep commented!
    
    function update(address addr) public {
        idm = IdentityRegistry(address(addr));
    }
     */

    struct Question {
        string text;
        address[] votes;
        address author;
    }

    struct Relation {
        address author;
        uint creationTime; 
        bool isPublic; 
        bool votePhase; 
        address[] privateList; 
        uint ID;
        uint startOfRelation; 
        uint questionCloseTime; 
        string name; 
        uint[] questionsKeys;
    }

    /**
     * Creates new relation based on moderator specification. Array of invited people and array of questions are added through addUsersToRelation and addQuestion functions.
     */
    function addRelation(uint _startOfRelation, uint _questionCloseTime, string memory _name, bool _isPublic) payable public { //create relation?
        require(idm.verifyIdentity(msg.sender) == true, "User does not have verified identity");
        if(users.contains(msg.sender) == false) {
            users.add(msg.sender);
        }
        require(users.contains(msg.sender) == true, "User is not added to contract list");
        require(msg.value >= 1 gwei, "You must pay at least 1 gwei to addRelation");
        Relation storage r = relations[numRelations];
        r.author = msg.sender;
        r.creationTime = block.timestamp;
        r.isPublic = _isPublic;
        r.ID = numRelations;
        r.votePhase = false;
        r.startOfRelation = _startOfRelation;
        r.questionCloseTime = _questionCloseTime;
        r.name = _name;
        numRelations++;
    }

    /**
     * Adds new users (addresses) to private relation. 
     */
    function addUsersToRelation(address[] memory usersList, uint relationID) public {
        require(msg.sender == getRelation(relationID).author, "You must be creator of relation to add users");
        require(false == getRelation(relationID).isPublic, "You can add users only to private relation");
        require(getRelation(relationID).votePhase == false, "You can not add users in vote phase");
        for(uint i = 0; i < usersList.length; i++) {
            relations[relationID].privateList.push(usersList[i]);
        }
    }

    /**
     * Changes relation phase from preparation to vote. 
     */
    function changeRelationPhase(uint relationID) public {
        require(msg.sender == getRelation(relationID).author, "You must be creator of relation to change the phase");
        require(getRelation(relationID).votePhase == false, "You can change phase only once!");
        relations[relationID].votePhase = true;
    }

    /**
     * Adds new question to specified relation. 
     */
    function addQuestion(string memory _text, uint relationID) payable public {
        require(idm.verifyIdentity(msg.sender) == true, "User does not have verified identity");
        if(users.contains(msg.sender) == false) {
            users.add(msg.sender);
        }
        require(users.contains(msg.sender) == true, "User is not added to contract list");
        require(relations[relationID].author != msg.sender, "Relation author can not add questions to his/her own relations");
        require(checkUserQuestion(msg.sender, getRelation(relationID)) == false, "User is already added question to this relation");
        require(relations[relationID].votePhase == true, "You can add questions only in votePhase");
        require(msg.value >= 1 gwei, "You must pay at least 1 gwei to addQuestion");
        if(relations[relationID].isPublic == false) {
                require(relations[relationID].privateList.length > 0, "Relation list of users is empty");
                bool inList = false;
                for(uint i = 0; i < getRelation(relationID).privateList.length; i++) {
                    if (relations[relationID].privateList[i] == msg.sender) {
                        inList = true;
                    }
                }
                require(inList == true, "Sender must be added to private relation");
        }
        address[] memory questionVotes;
        Question memory que;
        que.text = _text;
        que.votes = questionVotes;
        que.author = msg.sender;
        questions[numQuestions] = que;
        relations[relationID].questionsKeys.push(numQuestions);
        numQuestions += 1;
    }

    /**
     * Upvotes specied question.
     */
    function voteForQuestion(uint questionKey, uint relationID) payable public {
        require(idm.verifyIdentity(msg.sender) == true, "User does not have verified identity");
        if(users.contains(msg.sender) == false) {
            users.add(msg.sender);
        }
        require(users.contains(msg.sender) == true, "User is not added to contract list");
        require(msg.sender != getQuestion(questionKey).author, "You can not vote for your own question");
        require(msg.value >= 1 gwei, "You must pay at least 1 gwei to vote");
        require(getVoter(msg.sender, questionKey) == false, "You already voted for this question");
        if(relations[relationID].isPublic == false) {
        require(relations[relationID].privateList.length > 0, "Relation list of users is empty");
                bool inList = false;
                for(uint i = 0; i < getRelation(relationID).privateList.length; i++) {
                    if (relations[relationID].privateList[i] == msg.sender) {
                        inList = true;
                    }
                }
                require(inList == true, "Sender must be added to private relation to vote");
        }
        questions[questionKey].votes.push(msg.sender);
    }

    /**
     * Returns true if user voted for specified question, otherwise false.
     */
    function getVoter(address voter, uint questionKey) private view returns(bool response){
        for(uint i = 0; i < getQuestion(questionKey).votes.length; i++) {
            if (getQuestion(questionKey).votes[i] == voter) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns relation with specified ID.
     */
    function getRelation(uint id) public view returns(Relation memory relation) {
        return relations[id];
    }

    /**
     * Returns true if user already sent question to specified relation, otherwise false.
     */
    function checkUserQuestion(address userAddr, Relation memory relation) private view returns(bool) {
        for(uint i = 0; i < relation.questionsKeys.length; i++) {
            if (getQuestion(relation.questionsKeys[i]).author == userAddr)
                return true;
        }
        return false;
    }

    /**
     * Returns question id if user added question to specific relation.
     */
    function getRelationQuestionByAuthor(address author, uint [] memory numbers) public view returns(uint questionID) {
        for(uint i = 0; i < numbers.length; i++) { 
            if(getQuestion(numbers[i]).author == author) {
                return numbers[i];
            }
        }
    }

    /**
     * Returns question based on its ID.
     */
    function getQuestion(uint id) public view returns(Question memory question) {
        return questions[id];
    }

    /**
     * Returns number of relations.
     */
    function getRelationsCount() public view returns(uint relLength) {
        return numRelations;
    }

    /**
     * Returns list of invited people to specified relation. 
     */
    function getPrivateRelationUserList(uint relationID) public view returns(address[] memory privateList) {
        return relations[relationID].privateList;
    }
}
