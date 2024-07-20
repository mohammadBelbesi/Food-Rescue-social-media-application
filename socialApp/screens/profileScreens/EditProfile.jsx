import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, TextInput, StyleSheet, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../navigation/AuthProvider';
import { useTheme } from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../styles/colors';
import { database } from '../../firebase';
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { uploadImages } from '../../FirebaseFunctions/firestore/UplaodImges';
import { openGalleryAndSelectImage } from '../../hooks/OperationComponents/OpeningComponentsInPhone';
import { useDarkMode } from '../../styles/DarkModeContext';
import { useTranslation } from 'react-i18next';

const EditProfile = ({ navigation, route }) => {
    const { userData } = route.params;
    const { user } = useContext(AuthContext);
    const { isDarkMode, theme } = useDarkMode();
    const [userProfileCover, setUserProfileCover] = useState(userData?.profileCover || '');
    const [userProfileImage, setUserProfileImage] = useState(userData?.profileImg || '');
    const [firstName, setFirstName] = useState(userData?.firstName || '');
    const [lastName, setLastName] = useState(userData?.lastName || '');
    const [phone, setPhone] = useState(userData?.phoneNumber || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [userName, setUserName] = useState(userData?.userName || '');
    const [bio, setUserBio] = useState(userData?.bio || '');
    const { t } = useTranslation();

    const handleAddUserProfileCover = async () => {
        await openGalleryAndSelectImage(setUserProfileCover, false, false, true);
    }

    const handleAddUserProfileImage = async () => {
        await openGalleryAndSelectImage(setUserProfileImage, false, false, true);
    }

    const updateUserProfile = async () => {
        try {
            const profileURL = await uploadImages(userProfileImage, 'usersImages/', 'image');
            const coverURL = await uploadImages(userProfileCover, 'usersCoverImages/', 'image');

            const userDocRef = doc(database, "users", user.uid);
            await updateDoc(userDocRef, {
                ...userData,
                firstName,
                lastName,
                phoneNumber: phone,
                email,
                userName: `${firstName} ${lastName}`,
                profileCover: coverURL,
                profileImg: profileURL,
                bio
            });

            // Retrieve all posts by this user
            const userPostsQuery = query(collection(database, "posts"), where("userId", "==", user.uid));
            const userPostsSnapshot = await getDocs(userPostsQuery);
            
            userPostsSnapshot.forEach(async (postDoc) => {
                await updateDoc(postDoc.ref, {
                    userName: `${firstName} ${lastName}`,
                    userImg: profileURL,
                    firstName,
                    lastName
                });
            });

            navigation.navigate('Profile', {
                postUserId: user.uid,
                userData: {
                    ...userData,
                    firstName,
                    lastName,
                    userName: `${firstName} ${lastName}`,
                    userImg: profileURL,
                    bio
                }
            });

            console.log("User profile and posts updated successfully");
        } catch (error) {
            console.error("Error updating user profile and posts:", error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.appBackGroundColor }]}>
            <ScrollView>
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleAddUserProfileCover}>
                        <View
                            style={{
                                height: 150,
                                width: 300,
                                borderRadius: 15,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <ImageBackground
                                source={
                                    userProfileCover && typeof userProfileCover === 'string'
                                    ? { uri: userProfileCover }
                                    : require('../../assets/Images/cover.png')
                                }
                                style={{ height: 150, width: 300 }}
                                imageStyle={{ borderRadius: 15 }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <Icon
                                        name="camera"
                                        size={35}
                                        color={COLORS.white}
                                        style={{
                                            opacity: 0.7,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: COLORS.white,
                                            borderRadius: 10,
                                        }}
                                    />
                                </View>
                            </ImageBackground>
                        </View>
                    </TouchableOpacity>
                    <Text></Text>
                    <TouchableOpacity onPress={handleAddUserProfileImage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                borderRadius: 15,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <ImageBackground
                                source={
                                    userProfileImage && typeof userProfileImage === 'string'
                                    ? { uri: userProfileImage }
                                    : require('../../assets/Images/emptyProfieImage.png')
                                }
                                style={{ height: 100, width: 100 }}
                                imageStyle={{ borderRadius: 15 }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <Icon
                                        name="camera"
                                        size={35}
                                        color={COLORS.white}
                                        style={{
                                            opacity: 0.7,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: COLORS.white,
                                            borderRadius: 10,
                                        }}
                                    />
                                </View>
                            </ImageBackground>
                        </View>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 10, fontSize: 18, fontWeight: 'bold', color: theme.primaryText }}>
                        {userName}
                    </Text>
                </View>

                <View style={styles.action}>
                    <FontAwesome name="id-card" color={theme.primaryText} size={25} paddingLeft={10} />
                    <TextInput
                        placeholder={t("First Name")}
                        placeholderTextColor="#666666"
                        autoCorrect={false}
                        style={[
                            styles.textInput,
                            {
                                color: theme.primaryText,
                                paddingLeft: 10,
                            },
                        ]}
                        value={String(firstName)}
                        onChangeText={text => setFirstName(text)}
                    />
                </View>
                <View style={styles.action}>
                    <FontAwesome name="id-card" color={theme.primaryText} size={25} paddingLeft={10} />
                    <TextInput
                        placeholder={t("Last Name")}
                        placeholderTextColor="#666666"
                        autoCorrect={false}
                        style={[
                            styles.textInput,
                            {
                                color: theme.primaryText,
                            },
                        ]}
                        value={String(lastName)}
                        onChangeText={text => setLastName(text)}
                    />
                </View>
                <View style={styles.action}>
                    <FontAwesome name="phone" color={theme.primaryText} size={25} paddingLeft={10} />
                    <TextInput
                        placeholder={t("Phone")}
                        placeholderTextColor="#666666"
                        keyboardType="number-pad"
                        autoCorrect={false}
                        style={[
                            styles.textInput,
                            {
                                color: theme.primaryText,
                                paddingLeft: 18,
                            },
                        ]}
                        value={String(phone)}
                        onChangeText={text => setPhone(text)}
                    />
                </View>
                <View style={styles.action}>
                    <AntDesign name="email" color={theme.primaryText} size={25} paddingLeft={8} />
                    <TextInput
                        placeholder={t("Email")}
                        placeholderTextColor="#666666"
                        keyboardType="email-address"
                        autoCorrect={false}
                        style={[
                            styles.textInput,
                            {
                                color: theme.primaryText,
                                paddingLeft: 14,
                            },
                        ]}
                        value={String(email)}
                        onChangeText={text => setEmail(text)}
                    />
                </View>
                <View style={styles.action}>
                    <MaterialCommunityIcons name="bio" color={theme.primaryText} size={27} paddingLeft={5} />
                    <TextInput
                        placeholder={t("Bio...")}
                        placeholderTextColor="#666666"
                        autoCorrect={false}
                        style={[
                            styles.textInput,
                            {
                                color: theme.primaryText,
                                paddingLeft: 16,
                            },
                        ]}
                        multiline
                        value={String(bio)}
                        onChangeText={text => setUserBio(text)}
                    />
                </View>
                <TouchableOpacity style={[styles.commandButton, { backgroundColor: theme.secondaryBackground }]} onPress={updateUserProfile}>
                    <Text style={[styles.panelButtonTitle, { color: theme.primaryText }]}>{t('Submit')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

export default EditProfile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    commandButton: {
        padding: 13,
        borderRadius: 10,
        width: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginTop: 10,
        ...Platform.select({
            web: {
                marginLeft: '30%',
                width: '40%',
            },
        }),
    },
    panel: {
        padding: 20,
        paddingTop: 20,
    },
    header: {
        shadowColor: '#333333',
        shadowOffset: { width: -1, height: -3 },
        shadowRadius: 2,
        shadowOpacity: 0.4,
        paddingTop: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    panelHeader: {
        alignItems: 'center',
    },
    panelHandle: {
        width: 40,
        height: 8,
        borderRadius: 4,
        marginBottom: 10,
    },
    panelTitle: {
        fontSize: 27,
        height: 35,
    },
    panelSubtitle: {
        fontSize: 14,
        color: 'gray',
        height: 30,
        marginBottom: 10,
    },
    panelButton: {
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 7,
    },
    panelButtonTitle: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    action: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
        paddingBottom: 5,
        ...Platform.select({
            web: {
                marginLeft: '2%',
            },
        }),
    },
    actionError: {
        flexDirection: 'row',
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FF0000',
        paddingBottom: 10,
    },
    textInput: {
        flex: 1,
        paddingLeft: 10,
        color: '#05375a',
    },});
