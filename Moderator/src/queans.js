const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"string","name":"_text","type":"string"},{"internalType":"uint256","name":"relationID","type":"uint256"}],"name":"addQuestion","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_startOfRelation","type":"uint256"},{"internalType":"uint256","name":"_questionCloseTime","type":"uint256"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"bool","name":"_isPublic","type":"bool"}],"name":"addRelation","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address[]","name":"usersList","type":"address[]"},{"internalType":"uint256","name":"relationID","type":"uint256"}],"name":"addUsersToRelation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"relationID","type":"uint256"}],"name":"changeRelationPhase","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"relationID","type":"uint256"}],"name":"getPrivateRelationUserList","outputs":[{"internalType":"address[]","name":"privateList","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getQuestion","outputs":[{"components":[{"internalType":"string","name":"text","type":"string"},{"internalType":"address[]","name":"votes","type":"address[]"},{"internalType":"address","name":"author","type":"address"}],"internalType":"struct Queans.Question","name":"question","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getRelation","outputs":[{"components":[{"internalType":"address","name":"author","type":"address"},{"internalType":"uint256","name":"creationTime","type":"uint256"},{"internalType":"bool","name":"isPublic","type":"bool"},{"internalType":"bool","name":"votePhase","type":"bool"},{"internalType":"address[]","name":"privateList","type":"address[]"},{"internalType":"uint256","name":"ID","type":"uint256"},{"internalType":"uint256","name":"startOfRelation","type":"uint256"},{"internalType":"uint256","name":"questionCloseTime","type":"uint256"},{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256[]","name":"questionsKeys","type":"uint256[]"}],"internalType":"struct Queans.Relation","name":"relation","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"author","type":"address"},{"internalType":"uint256[]","name":"numbers","type":"uint256[]"}],"name":"getRelationQuestionByAuthor","outputs":[{"internalType":"uint256","name":"questionID","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRelationsCount","outputs":[{"internalType":"uint256","name":"relLength","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"idm","outputs":[{"internalType":"contract IIdentityRegistry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"questionKey","type":"uint256"},{"internalType":"uint256","name":"relationID","type":"uint256"}],"name":"voteForQuestion","outputs":[],"stateMutability":"payable","type":"function"}]

const queansContract = web3 => {
    return new web3.eth.Contract(
        abi, 
        "0x8D507d8dc506A34b722F97861600D3870e538Ea4"
        );
}

export default queansContract;