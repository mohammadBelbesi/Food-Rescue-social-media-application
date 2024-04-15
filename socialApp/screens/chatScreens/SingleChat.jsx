import React, { useEffect, useState } from 'react';
import {View, StatusBar,StyleSheet, FlatList, TextInput, Text} from "react-native";
import { useRoute } from '@react-navigation/native';
import {COLORS} from '../../styles/colors';
import {windowHeight, windowWidth} from '../../utils/Dimentions';
import { db, database } from '../../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { ref , set , child, push, update, onValue } from 'firebase/database';
import { useSelector } from 'react-redux';
import  uuid from 'react-native-uuid';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import MsgComponent from "../../components/chat/MsgComponent";


const SingleChat = ({navigation}) => {
    // const route = useRoute();
    // const receiverId = route.params?.receiverId || '';
    const receiverId = 'uNwhQOcidogqWCR5FU2Y6Wo003t1';
    const sender = useSelector(state => state.user.userData);
    const [ receiver, setReceiver] = useState();
    const [ allMessages, setAllMessages ] = useState([]);
    const [ msg, setMsg] = useState('');

    const [ chatData, setChatData] = useState('');
    const [ roomId, setRoomId ] = useState('');
    const [ isLoaded, setIsLoaded ] = useState(false);

    useEffect(() => {
        if(roomId === '') {
            fetchChat();
        }
        try{
            if(roomId !== ''){
            const docRef = ref(db, "messages/" + roomId);
            onValue(docRef, (snapshot) => {
               const data = Object.values(snapshot.val());
               if(!data) return console.log('-No data found');
               setAllMessages((prevState) => [...prevState, ...data]);
               console.log("allMessages: ", data);
            });
            }
        } catch (error){
             console.log('Error fetching document: ', error);
           }  
    }, [roomId, receiverId]);


    const fetchChat = async () => {
        try {     
            const docRef = doc(database, "users", receiverId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                let receiverTemp = docSnap.data();
                receiverTemp.id = receiverId;
                setReceiver(receiverTemp);

                // fetch chat
                const docRef = ref(db, "chatsList/" + sender.id + '/' + receiverTemp.id);
                onValue(docRef, (snapshot) => {
                   const data = snapshot.val();
                   // if chat not created then create new chat
                   if(!data) {
                       createNewChat(receiverTemp);
                       return;
                   };
                //    console.log('data: ', data);
                   setChatData(data);
                   setRoomId(data.roomID);
                });
            } else {
             console.log("No such user!");
            }
        } catch (error) {
             console.error("Error fetching document:", error);
        
        }
    }
    

    const createNewChat = (receiverData) => {
        const roomID = uuid.v4();
        try{      
            set(ref(db, 'chatsList/' + sender.id + '/' + receiverData.id),
            {
                roomID,
                id: receiverData.id,
                sender: sender.firstName + " " + sender.lastName,
                receiver: receiverData.firstName + " " + receiverData.lastName,
                image:receiverData?.image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAiRQwXf9TTpgIOStvwMpdGBeEQecgottZew&usqp=CAU',
                emailId: receiverData.email,
                lastMsg: "",
            })

            set(ref(db, 'chatsList/' +  receiverData.id + '/' + sender.id ),
            {
                roomID,
                id: sender.id,
                sender: receiverData.firstName + ' ' + receiverData.lastName,
                receiver: sender.firstName + ' ' + sender.lastName,
                image: sender?.image || "https://www.elitesingles.co.uk/wp-content/uploads/sites/59/2019/11/2b_en_articleslide_sm2-350x264.jpg",
                emailId: sender.email,
                lastMsg: "",
            });                        
            setRoomId(roomID);
        } catch (error) {
            console.error("Error adding document: ", error);
       }    
    }


    const sendMsg = () => { 
        if(msg === ''){
            return;
        }
        
        let msgData = {
            message: msg,
            from: sender.id,
            to: receiver?.id || chatData.id,
            sentTime: moment().format(),
            msgType: 'text',
        }
        
        const newPostKey = push(child(ref(db), 'messages')).key;
        const updates = {};
        updates['messages/' + roomId + '/' + newPostKey] = msgData;
        update(ref(db), updates).then(() => {
            console.log('Message sent successfully');
            const updateChat = {
                lastMsg: msg,
                sendTime: msgData.sentTime,
            }
            update(ref(db, 'chatsList/' + sender.id + '/' + receiverId),( updateChat))
            update(ref(db, 'chatsList/' +  receiverId + '/' + sender.id ),(updateChat)); 
            setMsg('');
        }).catch((error) => {
            console.error("Error adding document: ", error);
        });
    }
    
    const renderItem = ({  item  }) => {      
       return (
        <View style={styles.msg}>
        <MsgComponent     
          sender={item.from}
          message={item.message}
          sendTime={item.sentTime}
        />
        </View>
      );
    };


    return (
           <View style={styles.container} >
            <FlatList
               keyExtractor={(item, index) => {item.id}}
               data={allMessages}
               renderItem={renderItem}
             />
           
            <View style={styles.containerFooter}>  
                <Octicons name="smiley" size={24} style={styles.smiley}/> 
                <MaterialIcons name="attach-file" size={24} style={styles.attachment}/>            
                    <View style={styles.windowSend} >
                        <TextInput
                        placeholder='Send message...'
                        onChangeText={val => setMsg(val)}
                        >
                        {msg}
                        </TextInput>
                    </View>
                    
                <MaterialCommunityIcons name="send" onPress={sendMsg} size={25} style={styles.send}/>          
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
      marginTop:  5,
      marginLeft: windowWidth/14,
      marginRight: windowWidth/14,
      // delete -80
      height: windowHeight - StatusBar.currentHeight - windowHeight / 11 - windowHeight / 12 - 80,
      backgroundColor: 'blue',
    },
    containerFooter :{
        height: windowHeight /12,
        // height: windowHeight /20,
        flexDirection: 'row',
        padding: 10,
        backgroundColor: COLORS.headerChat,
    },
    attachment:{
        padding: 5,
    },
    smiley:{
        padding: 5,
    },
    windowSend :{
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        width: windowWidth / 1.5,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    send:{
         marginLeft: 10,
         marginTop:5  
      },
  });
  
export default SingleChat;