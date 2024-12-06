import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { token } = useAuth();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('Chat', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'online' ? '#4CAF50' : '#9E9E9E' },
          ]}
        />
        <Text style={styles.lastSeen}>
          {item.status === 'online'
            ? 'Online'
            : `Last seen ${formatDistanceToNow(new Date(item.lastSeen))} ago`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    margin: 10,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 12,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default SearchScreen; 