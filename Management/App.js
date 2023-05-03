import { StyleSheet, Text, View, TextInput, FlatList, Pressable, Linking } from 'react-native';
import { useState, useEffect } from 'react';
//import '@ethersproject/shims';
import Web3 from 'web3';
import idRegistryContract from './src/identityRegistry';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

export default function App() {
  const [web3, setWeb3] = useState("");
  const [idRegistry, setIDRegistry] = useState("");
  const [index, setIndex] = useState("");
  const [idps, setIdps] = useState([]);

  const Stack = createNativeStackNavigator();

  useEffect(() => {
    load();
  }, []);

  useEffect (() => {
    getIDPs();
  }, [index]);

  const load = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts"});
        const tmp_web3 = new Web3(window.ethereum);
        const idm = idRegistryContract(tmp_web3);
        setIDRegistry(idm);
        setWeb3(tmp_web3);
        console.log("START DONE");
      } catch (err) {
        alert("Error with wallet connection occured! More info in console.");
        console.log(err.message);
      }
    }
  }


  const addIDP = async (idproviderAddress, did, name) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    try {
      let ret = await idRegistry.methods.addIdentityProvider(idproviderAddress, did, name).send({from: actualAddress[0]});
      console.log(ret);
    } catch (err) {
      console.log(err);
      let reply = "https://sepolia.etherscan.io/tx/" + err.receipt.transactionHash;
      alert(`Transaction was not successful. Open link: ${reply} to get more information!`);
    }
  }

  const addVerifiedUser = async (idpPrivateKey, idpAddress, userAddress) => {
    let actualAddress = await window.ethereum.request({method: "eth_requestAccounts"});
    let userInfo = await idRegistry.methods.registry(userAddress).call();
    if (userInfo.valid == false) {
      try {
        let signature = await web3.eth.accounts.sign((userAddress, " is person with legitimate identity at contract address ", idRegistry.options.address), idpPrivateKey);
        let ret = await idRegistry.methods.addVerifiedUser(signature.messageHash, idpAddress, userAddress, signature.v, signature.r, signature.s).send({from: actualAddress[0]});
        console.log(ret);
      } catch (err) {
        console.log(err.receipt);
        alert("Transaction was not successful. Did you enter right private key and addresses?");
      }
    } else {
      alert("User is already verified");
    }
  }

  const getIDPs = async () => {
    let ret = await idRegistry.methods.getIDPs().call();
    setIdps(ret);
  }

  const HomeScreen = ({navigation}) => {
    return (
      <View>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Add identity provider')}><Text style={styles.text}>Add identity provider</Text></Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Add verified user')}><Text style={styles.text}>Add verified user</Text></Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Get identity providers')}><Text style={styles.text}>Get identity providers</Text></Pressable>
      </View>
    );
  };

  const AddIDPScreen = ({navigation}) => {
    useEffect(() => {
        setIndex(1);
    }, []);

    let idpAddress;
    let did;
    let name;

    return (
      <View>
        <Text style={styles.textWithInput}>Identity provider’s address</Text>
        <TextInput style={styles.input} onChangeText={(text) => {idpAddress = text;}} ></TextInput>
        <Text style={styles.textWithInput}>Identity provider’s digital identity</Text>
        <TextInput style={styles.input} onChangeText={(text) => {did = text;}} ></TextInput>
        <Text style={styles.textWithInput}>Identity provider’s name</Text>
        <TextInput style={styles.input} onChangeText={(text) => {name = text;}} ></TextInput>
        <Pressable style={styles.button} onPress={() => addIDP(idpAddress, did, name)}><Text style={styles.text}>Add IDP</Text></Pressable>
      </View>
    );
  };

  const AddVerifiedUserScreen = ({navigation}) => {
    useEffect(() => {
        setIndex(2);
    }, []);

    let idpProviderPrivateKey
    let idpAddress
    let userAddr;

    return (
      <View>
        <Text style={styles.textWithInput}>Identity provider’s private key</Text>
        <TextInput style={styles.input} onChangeText={(text) => {idpProviderPrivateKey = text;}} ></TextInput>
        <Text style={styles.textWithInput}>Identity provider’s address</Text>
        <TextInput style={styles.input} onChangeText={(text) => {idpAddress = text;}} ></TextInput>
        <Text style={styles.textWithInput}>User’s address</Text>
        <TextInput style={styles.input} onChangeText={(text) => {userAddr = text;}} ></TextInput>
        <Pressable style={styles.button} onPress={() => addVerifiedUser(idpProviderPrivateKey, idpAddress, userAddr)}><Text style={styles.text}>Add verified user</Text></Pressable>
      </View>
    );
  };

  const GetIDPsScreen = ({navigation}) => {
    useEffect(() => {
        setIndex(3);
    }, []);
    return (
      <View>
        <FlatList 
          data={idps} 
          renderItem={(idp) => { 
            return (
              <View key={idp.item}>
                <Text style={styles.relation}>{idp.item}</Text>
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
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'Management app'}} />
        <Stack.Screen name="Add identity provider" component={AddIDPScreen} />
        <Stack.Screen name="Add verified user" component={AddVerifiedUserScreen} />
        <Stack.Screen name="Get identity providers" component={GetIDPsScreen} />
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
