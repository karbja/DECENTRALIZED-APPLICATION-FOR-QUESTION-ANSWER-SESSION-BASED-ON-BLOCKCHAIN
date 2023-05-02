import { StyleSheet, Text, View, TextInput, FlatList, Linking, Pressable} from 'react-native';
import { useState, useEffect} from 'react';
import Web3 from 'web3';
import queansContract from './src/queans';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

export default function App() {
  const [web3, setWeb3] = useState("");
  const [queans, setQueans] = useState("");
  const [relations, setRelations] = useState([]);
  const [questionNumbers, setQuestionNumbers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState("");
  const [votes, setVotes] = useState([]);
  const [inputDate1, setInputDate1] = useState("");
  const [inputDate2, setInputDate2] = useState("");
  const [inputDate3, setInputDate3] = useState("");
  const [currentTimeStamp, setCurrentTimeStamp] = useState("");
  const Stack = createNativeStackNavigator();

  useEffect(() => {
    load();
  }, []);

  useEffect (() => {
    getAllRelations();
    getAllQuestions();
  }, [index]);

  /**
   * Function sets provider and Queans contract access
   */
  const load = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({method: "eth_requestAccounts"});
        const tmp_web3 = new Web3(window.ethereum);
        const que = queansContract(tmp_web3);
        setQueans(que);
        setWeb3(tmp_web3);
        console.log("START DONE");
      } catch (err) {
        alert("Error with wallet connection occured! More info in console.");
        console.log(err.message);
      }
    }
  }

  /**
   * Function votes for specified question. 
   */
  const vote = async (author, relationID) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    let questionID;
    try {
      questionID = await queans.methods.getRelationQuestionByAuthor(author, questionNumbers).call();
    } catch (err) {
      console.log()
      console.log(err.receipt);
    }
    try {
      let ret = await queans.methods.voteForQuestion(questionID, relationID).send({
        from: actualAddress[0],
        value: web3.utils.toWei('1', 'gwei')
      });
      alert("Your transaction was successful!")
      console.log(ret);
    } catch (err) {
      alert("Error with voting occured! You might already voted for this question. Check etherscan for detailed information through button on app's main page.");
      console.log(err);
    }
  }

  /**
   * Function add new question to specified relation.
   */
  const addQuestion = async (text, relationID) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    try {
      let ret = await queans.methods.addQuestion(text, relationID).send({
        from: actualAddress[0],
        value: web3.utils.toWei('1', 'gwei')
      })
      getAllQuestions();
      getAllRelations();
      console.log(ret);
      alert("Your transaction was successful!")
    } catch (err) {
      alert("Error with adding question occured! Did you fill box above with your question? You might already created question in this relation. Check etherscan for detailed information through button on app's main page.");
      console.log(err);
    }
  }

  /**
   * Function converts date to timestamp
   */
  const dateToTimestamp = async (dateValue, timeValue) => {
    let date1 = dateValue.split("/");
    let day = date1[0];
    let month = date1[1];
    let year = date1[2];
    let time1 = timeValue.split(":");
    let hours = parseInt(time1[0]);
    let minutes = parseInt(time1[1]);
    let date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    let timeStamp =  (date.getTime() / 1000) - 3600;
    return timeStamp;
  }

  /**
   * Function converts timestamp to date, helps with text presentation.
   */
  const timestampToDate = async (timeStamp1, timeStamp2, timeStamp3) => {
    var utcSeconds = timeStamp1;
    var d = new Date(0); 
    let timestamp1 = d.setUTCSeconds(utcSeconds);
    var date1 = new Date(timestamp1);

    utcSeconds = timeStamp2;
    d = new Date(0); 
    let timestamp2 = d.setUTCSeconds(utcSeconds);
    var date2 = new Date(timestamp2);

    utcSeconds = timeStamp3;
    d = new Date(0); 
    let timestamp3 = d.setUTCSeconds(utcSeconds);
    var date3 = new Date(timestamp3);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',  };
    let dateFormat1 = date1.toLocaleDateString("en-GB", options) + " " + date1.toLocaleTimeString("en-GB");
    let dateFormat2 = date2.toLocaleDateString("en-GB", options) + " " + date2.toLocaleTimeString("en-GB");
    let dateFormat3 = date3.toLocaleDateString("en-GB", options) + " " + date3.toLocaleTimeString("en-GB");
    setInputDate1(dateFormat1);
    setInputDate2(dateFormat2);
    setInputDate3(dateFormat3);
  }

  const open = async () => {
    await Linking.openURL("https://sepolia.etherscan.io/address/0x8D507d8dc506A34b722F97861600D3870e538Ea4");
  }

  /**
   * Loads actual time and all relations.
   */
  const getAllRelations = async () => {
    const date = new Date();
    let currentDay= String(date.getDate()).padStart(2, '0');
    let currentMonth = String(date.getMonth()+1).padStart(2,"0");
    let currentYear = date.getFullYear();
    let currentDate = `${currentDay}/${currentMonth}/${currentYear}`;
    let currentTime = date.getHours() + ":" + date.getMinutes();
    let currentTS = await dateToTimestamp(currentDate, currentTime);
    setCurrentTimeStamp(currentTS);
    try {
      let num = await queans.methods.getRelationsCount().call();
      let list = [];
      for(let i = 0; i < num; i++) {
        list[i] = await queans.methods.getRelation(i).call();
      }
      setRelations(list);
    } catch (err) {
      console.log("ERR: " + err.receipt);
    }
  }

  /**
   * Loads all questions.
   */
  const getAllQuestions = async () => {
    const questionList = [];
    if (questionNumbers.length > 0) {
      for(let i = 0; i < questionNumbers.length; i++) {
        try {
          let ret = await queans.methods.getQuestion(questionNumbers[i]).call();
          questionList.push(ret);
        } catch (err) {
          console.log("ERR: " + err.receipt);
        }
      }
    }
    questionList.sort(function(a, b) {
      if(a[1].length > b[1].length) {
        return 1;
      }
      else if(a[1].length < b[1].length) {
        return -1;
      }
      return 0;
    });
    questionList.reverse();
    setQuestions(questionList);
  }

  /**
   * Loads actual time and all relations.
   */
  const getMyRelation = async (idcko, nav) => {
    try {
    let ret = await queans.methods.getRelation(idcko).call();
    return nav.navigate('Relation', {
      relationAuthor: ret.author, 
      relationCreationTime: ret.creationTime, 
      relationIsPublic: ret.isPublic ? "Yes" : "No", 
      relationPhase: ret.votePhase ? "Vote" : "Preparation", 
      relationPrivateList: ret.isPublic ? ret.privateList : "", 
      relationID: ret.ID, 
      relationStart: ret.startOfRelation, 
      relationEnd: ret.questionCloseTime, 
      relationName: ret.name, 
      relationQuestions: ret.questionsKeys
      });
    } catch (err) {
      alert("You have to enter right relation ID!");
    }
  }
  
  const LoginScreen = ({navigation}) => {
    return (
      <View>
        <Pressable style={styles.button} onPress={open}><Text style={styles.text}>Open contract in etherscan</Text></Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Relations')}><Text style={styles.text}>Go to relations</Text></Pressable>
      </View>
    );
  };

  const RelationsScreen = ({navigation}) => {
    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        setIndex(navigation.getState().index);
        setQuestionNumbers('');
      });
      return unsubscribe;
    }, [navigation]);

    let enteredText;

    return (
      <View>
        <View>
        <Text style={styles.textWithInput}>Relation ID</Text>
        <TextInput style={styles.input} onChangeText={(text) => {enteredText = text;}}></TextInput>
        <Pressable style={styles.button} onPress={() => getMyRelation(parseInt(enteredText), navigation)}><Text style={styles.text}>Find relation</Text></Pressable>
        <FlatList 
              data={relations} 
              renderItem={(relation) => { 
                return ( 
                  <View key={relation.item[5]}>
                    <Text style={(currentTimeStamp > relation.item[7]) ? styles.relationFalse : styles.relation} TouchableOpacity 
                    onPress={() => navigation.navigate('Relation', {
                      relationAuthor: relation.item[0], 
                      relationCreationTime: relation.item[1], 
                      relationIsPublic: relation.item[2] ? "Yes" : "No", 
                      relationPhase: relation.item[3] ? "Vote" : "Preparation", 
                      relationPrivateList: relation.item[2] ? "" : relation.item[4], 
                      relationID: relation.item[5], 
                      relationStart: relation.item[6], 
                      relationEnd: relation.item[7], 
                      relationName: relation.item[8], 
                      relationQuestions: relation.item[9]
                      })}>
                      Name: {relation.item[8]} {"\n"}
                      Author: {relation.item[0]} {"\n"}
                      Relation ID: {relation.item[5]} {"\n"}
                      Phase: {relation.item[3] ? "Vote" : "Preparation"} {"\n"}
                      Number of questions: {relation.item[9].length}
                    </Text>
                  </View>
                );
              }} 
          />
        </View>
      </View>
    );
  };

  const RelationScreen = ({navigation, route}) => {
    useEffect(() => {
      setIndex(navigation.getState().index);
      setQuestionNumbers(route.params.relationQuestions);
      timestampToDate(route.params.relationStart, route.params.relationEnd, route.params.relationCreationTime);
    }, []);

    let enteredText;

    return (
      <View>
        <View>
          <Text style={styles.textWithInput}>Enter your question (max. 200 characters)</Text>
          <TextInput style={styles.input} maxLength={200} onChangeText={(text) => {enteredText = text;}} ></TextInput>
          <Pressable 
            disabled={(currentTimeStamp > route.params.relationEnd || route.params.relationPhase =="Preparation") ? true : false} 
            style={(currentTimeStamp > route.params.relationEnd || route.params.relationPhase =="Preparation") ? styles.buttonFalse : styles.button} 
            onPress={() => addQuestion(enteredText, route.params.relationID)}>
            <Text style={styles.text}>Add question</Text>
          </Pressable>
          <Text style={styles.textView}>Relation ID: {route.params.relationID}</Text>
          <Text style={styles.textView}>Relation name: {route.params.relationName}</Text>
          <Text style={styles.textView}>Author: {route.params.relationAuthor}</Text>
          <Text style={styles.textView}>Start: {inputDate1}</Text>
          <Text style={styles.textView}>End: {inputDate2}</Text>
          <Text style={styles.textView}>Created: {inputDate3}</Text>
          <Text style={styles.textView}>Phase: {route.params.relationPhase}</Text>
          <Text style={styles.textView}>Public: {route.params.relationIsPublic}</Text>
        </View>
        <View >
          <Text style={(route.params.relationIsPublic=="No") ? styles.textView : ""}>{(route.params.relationIsPublic=="No") ? "List of invited people to current relation:" : ""}</Text>
          <FlatList 
            data={route.params.relationPrivateList}
            renderItem={(addr) => { 
              return (
                <View key={addr.item}>
                  <Text style={styles.relation}>{addr.item}</Text>
                </View>
              );
            }}
          />
        </View>
        <View>
          <Text style={styles.textView}>List of questions:</Text>
          <FlatList 
            data={questions}
            renderItem={(question) => { 
              return (
                <View key={question.item[2]}>
                  <Text 
                  style={styles.relation} TouchableOpacity 
                  onPress={() => navigation.navigate('Question', {relationEnd: route.params.relationEnd, relationID: route.params.relationID, questionText: question.item[0], questionVotes: question.item[1], questionAuthor: question.item[2]})}>
                  Question: {question.item[0]}{"\n"}
                  Number of votes: {question.item[1].length}{"\n"}
                  Author: {question.item[2]}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      </View>
    );
  };

  const QuestionScreen = ({navigation, route}) => {
    useEffect(() => {
      setIndex(navigation.getState().index);
      setVotes(route.params.questionVotes);
    }, []);
    return (
      <View>
        <Pressable 
          disabled={(currentTimeStamp > route.params.relationEnd || route.params.relationPhase =="Preparation") ? true : false} 
          style={(currentTimeStamp > route.params.relationEnd || route.params.relationPhase =="Preparation") ? styles.buttonFalse : styles.button} 
          onPress={() => vote(route.params.questionAuthor, route.params.relationID)}>
          <Text style={styles.text}>Vote for question</Text>
        </Pressable>
        <Text style={styles.textView}>Relation ID: {route.params.relationID}</Text>
        <Text style={styles.textView}>Question: {route.params.questionText}</Text>
        <Text style={styles.textView}>Author: {route.params.questionAuthor}</Text>
        <Text style={styles.textView}>Number of votes: {route.params.questionVotes.length}</Text>
        <Text style={styles.textView}>List of voters:</Text>
        <FlatList 
            data={votes}
            renderItem={(vote) => { 
              return (
                <View key={vote.item}>
                  <Text style={styles.relation}>{vote.item}</Text>
                </View>
              );
            }}
          />
      </View>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{title: 'Welcome to VOTERS APP!'}} />
        <Stack.Screen name="Relations" component={RelationsScreen} />
        <Stack.Screen name="Relation" component={RelationScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

}

const styles = StyleSheet.create({
  relation: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.25,
    margin: 4,
    padding: 8,
    color: 'black',
    backgroundColor: "lightblue",
    borderWidth: 1,
  },
  relationFalse: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.25,
    margin: 4,
    padding: 8,
    color: 'black',
    backgroundColor: "lightgrey",
    borderWidth: 1,
  },
  check: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: 44,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 2,
    borderWidth: 1,
    padding: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#3366cc',
  },
  buttonFalse: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    margin: 4,
    borderRadius: 12,
    backgroundColor: 'grey',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  flatlist: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.25,
    margin: 2,
    color: 'black',
  },
  textView: {
    fontSize: 15,
    borderBottomWidth: 1,
    margin: 2,
    padding: 2,
  },
  textWithInput: {
    marginLeft: 12,
    marginTop: 12,
    fontSize: 18,
  },
});