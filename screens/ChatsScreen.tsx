import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ListItem, Avatar, Text, SearchBar } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface Chat {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    type: 'text' | 'image';
  };
  unreadCount: number;
}

type ChatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { user, token } = useAuth();
  const navigation = useNavigation<ChatsScreenNavigationProp>();

  const fetchChats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/messages/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      console.log('Fetched chats:', data);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [token]);

  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Chat }) => (
    <ListItem
      onPress={() =>
        navigation.navigate('Chat', {
          userId: item.user.id,
          username: item.user.username,
        })
      }
      containerStyle={styles.chatItem}
    >
      <Avatar
        rounded
        source={
          item.user.avatar
            ? { uri: item.user.avatar }
            : require('../assets/images/default-avatar.png')
        }
        size="medium"
      />
      <ListItem.Content>
        <ListItem.Title style={styles.username}>
          {item.user.username}
        </ListItem.Title>
        <ListItem.Subtitle numberOfLines={1} style={styles.lastMessage}>
          {item.lastMessage.type === 'image' ? '🖼️ Image' : item.lastMessage.content}
        </ListItem.Subtitle>
      </ListItem.Content>
      <View>
        <Text style={styles.time}>
          {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search chats..."
        onChangeText={setSearch}
        value={search}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        lightTheme
        round
      />
      <FlatList
        data={filteredChats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchChats} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
  },
  listContainer: {
    paddingBottom: 15,
  },
  chatItem: {
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastMessage: {
    color: '#666',
    marginTop: 3,
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
}); 