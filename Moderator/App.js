import { StyleSheet, Text, View, TextInput, FlatList, Modal, Linking, Pressable, Switch, Platform} from 'react-native';
import { useState, useEffect} from 'react';
import Web3 from 'web3';
import queansContract from './src/queans';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export default function App() {
  const [web3, setWeb3] = useState("");
  const [queans, setQueans] = useState("");
  const [relations, setRelations] = useState([]);
  const [index, setIndex] = useState("");
  const [modalIsVisible, setModalIsVisible] = useState(false);
  const [privateList, setPrivateList] = useState([]);
  const [today, setToday] = useState("");
  const [time, setTime] = useState("");
  const Stack = createNativeStackNavigator();

  const [inputDate1, setInputDate1] = useState("");
  const [inputDate2, setInputDate2] = useState("");
  const [inputDate3, setInputDate3] = useState("");

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect (() => {
    getAllRelations();
  }, [index]);

  const startRelationHandler = () => {
    setModalIsVisible(true);
  }

  const endRelationHandler = () => {
    setModalIsVisible(false);
  }

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
        timeSet();
        console.log("START DONE");
      } catch (err) {
        alert("Error with wallet connection occured! More info in console.");
        console.log(err.message);
      }
    }
  }
  
  /**
   * Function processes user input and creates blockchain transaction for relation creation.
   */
  const addRelation = async (relationStartTime1, relationStartTime2, relationEndTime1, relationEndTime2, relationName) => {
    endRelationHandler();
    let timeStart = await dateToTimestamp(relationStartTime1, relationStartTime2);
    let timeEnd = await dateToTimestamp(relationEndTime1, relationEndTime2);
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    try {
      let ret = await queans.methods.addRelation(timeStart, timeEnd, relationName, isEnabled).send({
        from: actualAddress[0],
        value: web3.utils.toWei('1', 'gwei'),
      })
      alert("Your transaction was successful!")
      console.log(ret)
      getAllRelations();
    } catch (err) {
      alert("Error with creating relation occured! Check etherscan for detailed information through button on app's main page.");
      console.log(err);
    }
  }

  const timeSet = async () => {
    let todayTmp = new Date();
    let todayTime;
    let dd = String(todayTmp.getDate()).padStart(2, '0');
    let mm = String(todayTmp.getMonth() + 1).padStart(2, '0');
    let yyyy = todayTmp.getFullYear();
    let min = todayTmp.getMinutes();
    let hh = todayTmp.getHours();

    todayTmp = dd + '/' + mm + '/' + yyyy;
    todayTime = hh + ":" + min;
    setToday(todayTmp);
    setTime(todayTime);
  }

  /**
   * Function converts date to timestamp
   */
  const dateToTimestamp = async (dateValue, timeValue) => {
    console.log(dateValue);
    console.log(timeValue);
    let date1 = dateValue.split("/");
    let day = date1[0];
    let month = date1[1];
    let year = date1[2];
    let time1 = timeValue.split(":");
    let hours = parseInt(time1[0]);
    let minutes = parseInt(time1[1]);
    let date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    let timeStamp =  (date.getTime() / 1000) - 7200;
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

  const getAllRelations = async () => {
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
   * Function creates blockchain transaction to relation phase change.
   */
  const changeRelationPhase = async (relationID) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    try {
      let ret = await queans.methods.changeRelationPhase(relationID).send({from: actualAddress[0]});
      console.log(ret);
      alert("Your transaction was successfull!");
      getAllRelations();
    } catch (err) {
      console.log("ERR: " + err.receipt);
      alert("An error occured!");
    }
  } 

  const getRelationPrivateList = async (relationID) => {
    let ret = await queans.methods.getPrivateRelationUserList(relationID).call();
    setPrivateList(ret);
  }

  const open = async () => {
    await Linking.openURL("https://sepolia.etherscan.io/address/0x8D507d8dc506A34b722F97861600D3870e538Ea4");
  }

  const addUsersToRelationPrivateList = async (userList, relationID) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    let real_list = [];
    let splitted = userList.split(",");
    splitted.forEach(element => {
      element = element.trim();
      real_list.push(element);
      console.log(element);
    });
    try {
      let ret = await queans.methods.addUsersToRelation(real_list, relationID).send({from: actualAddress[0]})
      console.log(ret);
      getRelationPrivateList(relationID);
      alert("Your transaction was successfull!");
    } catch (err) {
      console.log(err);
      alert("There was an issue with adding new users to private relation! Check you have correct addresses separated only by comma!");
    }
  }

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
        relationName: ret.name
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

  const RelationsScreen = ({navigation, route}) => {
    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        setIndex(navigation.getState().index);
      });
      return unsubscribe;
    }, [navigation]);

    let name;
    let start1 = today;
    let start2 = time;
    let end1 = today;
    let end2 = time;

    const toggleSwitch = async () => setIsEnabled(previousState => !previousState);

    let enteredText;

    return (
      <View>
        <Pressable style={styles.button} onPress={startRelationHandler}><Text style={styles.text}>Create new relation</Text></Pressable>
        <Text style={styles.textWithInput}>Relation ID</Text>
        <TextInput style={styles.input} onChangeText={(text) => {enteredText = text;}}></TextInput>
        <Pressable style={styles.button} onPress={() => getMyRelation(parseInt(enteredText), navigation)}><Text style={styles.text}>Find relation</Text></Pressable>
        <Modal visible={modalIsVisible}>
        <View style={styles.relationsAddSection}>
          <View style={styles.check}>
          <Text style={styles.textWithInputNew}>Public</Text>
          <Switch onValueChange={toggleSwitch} value={isEnabled}/>
          </View>
          <Text style={styles.textWithInput}>Relation name</Text>
          <TextInput style={styles.input} onChangeText={(text) => {name = text;}}></TextInput>
          <Text style={styles.textWithInput}>Start of relation date (DD/MM/HH)</Text>
          <TextInput style={styles.input} defaultValue={today} onChangeText={(text) => {start1 = text;}} ></TextInput>
          <Text style={styles.textWithInput}>Start of relation time (HH:MM)</Text>
          <TextInput style={styles.input} defaultValue={time} onChangeText={(text) => {start2 = text;}} ></TextInput>
          <Text style={styles.textWithInput}>End of relation voting date (DD/MM/YYYY)</Text>
          <TextInput style={styles.input} defaultValue={today} onChangeText={(text) => {end1 = text;}} ></TextInput>
          <Text style={styles.textWithInput}>End of relation voting time (HH:MM)</Text>
          <TextInput style={styles.input} defaultValue={time} onChangeText={(text) => {end2 = text;}} ></TextInput>
          <Text style={styles.textWithInput}></Text>
          <Pressable style={styles.button} onPress={() => addRelation(start1, start2, end1, end2, name)}><Text style={styles.text}>Create</Text></Pressable>
          <Pressable style={styles.button} onPress={endRelationHandler}><Text style={styles.text}>Cancel</Text></Pressable>
        </View>
        </Modal>
        <View>
          <FlatList 
              data={relations} 
              renderItem={(relation) => { 
                return (
                  <View key={relation.item[5]}>
                    <Text style={styles.relation} TouchableOpacity 
                    onPress={() => navigation.navigate('Relation', {
                      relationAuthor: relation.item[0], 
                      relationCreationTime: relation.item[1], 
                      relationIsPublic: relation.item[2] ? "Yes" : "No", 
                      relationPhase: relation.item[3] ? "Vote" : "Preparation", 
                      relationPrivateList: relation.item[2] ? "Public" : "Private", 
                      relationID: relation.item[5], 
                      relationStart: relation.item[6], 
                      relationEnd: relation.item[7], 
                      relationName: relation.item[8], 
                      })}>
                      Name: {relation.item[8]} {"\n"}
                      Author: {relation.item[0]} {"\n"}
                      Relation ID: {relation.item[5]} {"\n"}
                      Phase: {relation.item[3] ? "Vote" : "Preparation"}
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
      const unsubscribe = navigation.addListener('focus', () => {
        setIndex(navigation.getState().index);
        getRelationPrivateList(route.params.relationID);
        timestampToDate(route.params.relationStart, route.params.relationEnd, route.params.relationCreationTime);
      });
      return unsubscribe;
    }, [navigation]);  

    let seznam;

    return (
      <View>
        <Pressable 
          disabled={(route.params.relationPhase=="Vote") ? true : false} style={(route.params.relationPhase=="Vote") ? styles.buttonFalse : styles.button} 
          onPress={() => changeRelationPhase(route.params.relationID)}>
          <Text style={styles.text}>Change to vote phase</Text>
        </Pressable>
        <Text style={styles.textWithInput}>Insert list of participants{"\n"}(addresses separated by comma)</Text>
        <TextInput 
          editable={(route.params.relationPhase=="Vote" || route.params.relationIsPublic=="Yes") ? false : true} 
          style={styles.input}
          onChangeText={(text) => {seznam = text;}}>
        </TextInput>
        <Pressable 
          disabled={(route.params.relationPhase=="Vote" || route.params.relationIsPublic=="Yes") ? true : false} 
          style={(route.params.relationPhase=="Vote" || route.params.relationIsPublic=="Yes") ? styles.buttonFalse : styles.button} 
          onPress={() => addUsersToRelationPrivateList(seznam, route.params.relationID)}>
          <Text style={styles.text}>Add users to relation list</Text>
        </Pressable>
        <Text style={styles.textView}>Relation ID: {route.params.relationID}</Text>
        <Text style={styles.textView}>Relation name: {route.params.relationName}</Text>
        <Text style={styles.textView}>Author: {route.params.relationAuthor}</Text>
        <Text style={styles.textView}>Relation start: {inputDate1}</Text>
        <Text style={styles.textView}>End of voting: {inputDate2}</Text>
        <Text style={styles.textView}>Created: {inputDate3}</Text>
        <Text style={styles.textView}>Phase: {route.params.relationPhase}</Text>
        <Text style={styles.textView}>Public: {route.params.relationIsPublic}</Text>
        <View>
          <Text style={(route.params.relationIsPublic=="No") ? styles.textView : ""}>{(route.params.relationIsPublic=="No") ? "List of invited people to current relation:" : ""}</Text>
          <FlatList
            data={privateList}
            renderItem={(adrs) => { 
              return (
                <View>
                  <Text style={styles.relation}>{adrs.item}</Text>
                </View>
              );
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{title: 'Moderator app!'}} />
        <Stack.Screen name="Relations" component={RelationsScreen} />
        <Stack.Screen name="Relation" component={RelationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

}
const styles = StyleSheet.create({
  relation: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.25,
    margin: 8,
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
    marginTop: 8,
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
  textWithInputNew: {
    marginLeft: 12,
    marginTop: 12,
    marginRight: 12,
    fontSize: 18,
  },
});