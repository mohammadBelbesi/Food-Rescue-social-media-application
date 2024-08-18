import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { AuthContext } from '../../navigation/AuthProvider';
import { Container } from '../../styles/feedStyles';
import PostCard from '../../components/postCard/PostCard';
import AddPostCard from '../../components/addPost/AddPostCard';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { getLocation } from '../../hooks/helpersMap/getLocation';
import { useDarkMode } from '../../styles/DarkModeContext';
import { getPostsWithFilters, getPostsFromFollowers } from '../../FirebaseFunctions/collections/post';
import { useRoute } from "@react-navigation/native";
import PostCardSkeletonPlaceholder from '../../components/CustomSkeletonPlaceholder/PostCardSkeletonPlaceholder';
import AddPostCardSkeletonPlaceholder from '../../components/CustomSkeletonPlaceholder/AddPostCardSkeletonPlaceholder';

const HomeScreen = ({ isHomeTabPressed }) => {
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [firstFetchForYou, setFirstFetchForYou] = useState(true);
  const [firstFetchFollowing, setFirstFetchFollowing] = useState(true);
  const [lastVisibleForYou, setLastVisibleForYou] = useState(null);
  const [lastVisibleForFollowers, setLastVisibleFollowers] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [position, setPosition] = useState(null);
  const [radius, setRadius] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [feedChoice, setFeedChoice] = useState('For You');
  const [buttonTitle, setButtonTitle] = useState('Share Location');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { theme } = useDarkMode();
  const isFocused = useIsFocused();
  const [showAddPostCard, setShowAddPostCard] = useState(false);
  const [showNoPostsMessage, setShowNoPostsMessage] = useState(false); // New state

  const fetchData = async (loadMore = false) => {
    if (!position && feedChoice === 'For You') {
      console.info("No position found");
      return;
    }

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let newPosts = [];
      let lastVisibleDoc;

      if (feedChoice === 'For You') {
        lastVisibleDoc = loadMore ? lastVisibleForYou : null;
        const result = await getPostsWithFilters(
          [position.latitude, position.longitude],
          radius,
          user.uid,
          selectedCategories,
          lastVisibleDoc,
        );
        newPosts = result?.posts;
        lastVisibleDoc = result?.lastVisible;
        setLastVisibleForYou(lastVisibleDoc);
        setFirstFetchFollowing(false);
      } else {
        lastVisibleDoc = loadMore ? lastVisibleForFollowers : null;
        const result = await getPostsFromFollowers(user.uid, lastVisibleDoc, firstFetchFollowing);
        newPosts = result?.posts;
        lastVisibleDoc = result?.lastVisible;
        setLastVisibleFollowers(lastVisibleDoc);
        setFirstFetchForYou(false);
      }

      if (loadMore) {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      if (feedChoice === 'For You' && firstFetchForYou) setFirstFetchForYou(false);
      if (feedChoice === 'Following' && firstFetchFollowing) setFirstFetchFollowing(false);

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchLocationAndPosts = async () => {
      if (!permissionDenied) {
        await getLocation(setPosition, null, setPermissionDenied);
      }
    };
    fetchLocationAndPosts();
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      setFeedChoice(route.params?.feedChoice || 'For You');
      setRadius(route.params?.radius || 10);
      setSelectedCategories(route.params?.selectedCategories || []);
      setLastVisibleForYou(null);
      setLastVisibleFollowers(null);
      setFirstFetchForYou(true);
      setFirstFetchFollowing(true);
      if (position) {
        fetchData();
      }
    }
  }, [isFocused, route.params]);

  useEffect(() => {
    if (position) {
      setLastVisibleForYou(null);
      setLastVisibleFollowers(null);
      fetchData();
    }
  }, [position, feedChoice, selectedCategories, radius]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (posts.length === 0) {
        setShowAddPostCard(true);
        setShowNoPostsMessage(true); // Show the message after 6 seconds
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [posts]);

  useFocusEffect(
    useCallback(() => {
      if (isHomeTabPressed) {
        console.log('Home tab pressed: Refreshing...');
        onRefresh();
      }
    }, [isHomeTabPressed])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setLastVisibleForYou(null);
    setLastVisibleFollowers(null);
    setFirstFetchForYou(true);
    setFirstFetchFollowing(true);
    setPosts([]);  
    if (position) await fetchData();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!loadingMore && (lastVisibleForYou || lastVisibleForFollowers)) {
      setLoadingMore(true);
      if (position) {
        await fetchData(true);
      }
      setLoadingMore(false);
    }
  };

  if (error) {
    return <Text style={{ color: theme.primaryText }}>Error: {error}</Text>;
  }

  return (
    <>
      {loading && !permissionDenied ? (
        <Container style={[styles.container, { backgroundColor: theme.appBackGroundColor }]}>
          <ScrollView 
            style={{ marginLeft: 2, marginRight: 2 }} 
            showsVerticalScrollIndicator={false}
          >
            <AddPostCardSkeletonPlaceholder />
            <PostCardSkeletonPlaceholder />
            <PostCardSkeletonPlaceholder />
          </ScrollView>
        </Container>
      ) : (
        <Container style={[styles.container, { backgroundColor: theme.appBackGroundColor }]}>
          {permissionDenied ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  setButtonTitle("loading...");
                  await getLocation(setPosition, null, setPermissionDenied);
                  if (permissionDenied) { 
                    setButtonTitle("Share Location");
                  }
                }}
              >
                <Text style={{ color: theme.primaryText, fontSize:16, fontWeight:'500'}}>{buttonTitle}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={posts}
                style={{ width: '100%' }}
                ListHeaderComponent={<AddPostCard />}
                renderItem={({ item }) => (
                  item && item.id ? (
                    <PostCard
                      key={item.id}
                      item={item}
                      postUserId={item.userId}
                      isProfilePage={false}
                      isMapPostCard={false}
                      userLocation={position}
                    />
                  ) : null
                )}
                keyExtractor={(item, index) => item.id ? item.id : index.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.primaryText}
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={loadingMore && <ActivityIndicator size="large" color={theme.primaryText} />}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    {position && <Text style={{ color: theme.black }}>No posts available. Pull down to refresh.</Text>}
                  </View>
                )}
              />
              {showNoPostsMessage && (
                <Text style={{ textAlign: 'center', marginTop: 10, color: theme.primaryText }}>
                  There are no posts to show you in your region
                </Text>
              )}
            </>
          )}
        </Container>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    marginTop: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "#A7EAAE",
    padding: 15,
    borderRadius: 10,
  }
});

export default HomeScreen;
