import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ListItem, Avatar, Text } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { RootStackParamList } from '../types/navigation';
import { colors, spacing } from '../theme';
import { format } from 'date-fns';
import { BOT_PROFILES } from '../constants/botProfiles';

type ChatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Chat {
  id: string;
  messages?: Array<{
    content: string;
    timestamp: string;
  }>;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
    isUnderDuressAccount: boolean;
    mainAccountId: string;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount: number;
  isBot?: boolean;
  botTheme?: string;
}

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuth();
  const navigation = useNavigation<ChatsScreenNavigationProp>();

  const initializeBotChats = () => {
    const botChats = BOT_PROFILES.map(bot => ({
      id: bot.id,
      user: {
        id: bot.id,
        username: bot.username,
        avatar: bot.avatar,
        isUnderDuressAccount: false,
        mainAccountId: bot.id
      },
      isBot: true,
      botTheme: bot.theme,
      messages: [],
      lastMessage: {
        content: `Hi! I'm your ${bot.theme} assistant. How can I help you today?`,
        timestamp: new Date().toISOString()
      },
      unreadCount: 1
    }));

    return botChats;
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      
      if (user?.isUnderDuressAccount) {
        // For duress accounts, show both fake chats and bot chats
        const duressChats = data.filter((chat: Chat) => 
          chat.user.username.startsWith('fake_')
        );
        const botChats = initializeBotChats();
        setChats([...botChats, ...duressChats]);
      } else {
        // For real accounts, only show real chats
        const realChats = data.filter((chat: Chat) => 
          !chat.user.username.startsWith('fake_')
        );
        setChats(realChats);  // Remove botChats for real accounts
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      // Only show bot chats in duress mode if API fails
      if (user?.isUnderDuressAccount) {
        setChats(initializeBotChats());
      } else {
        setChats([]);
      }
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      return format(date, 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ListItem
      onPress={() => navigation.navigate('Chat', {
        userId: item.user.id,
        username: item.user.username,
        avatar: item.user.avatar || undefined,
        isBot: item.isBot,
        botTheme: item.botTheme
      })}
      bottomDivider
      containerStyle={styles.chatItem}
    >
      <Avatar
        rounded
        source={item.user.avatar ? { uri: item.user.avatar } : require('../assets/images/default-avatar.png')}
        containerStyle={styles.avatar}
      />
      <ListItem.Content>
        <ListItem.Title style={styles.username}>{item.user.username}</ListItem.Title>
        {item.lastMessage && (
          <>
            <ListItem.Subtitle style={styles.lastMessage}>
              {item.lastMessage.content}
            </ListItem.Subtitle>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessage.timestamp)}
            </Text>
          </>
        )}
      </ListItem.Content>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContainer: {
    padding: spacing.md,
  },
  chatItem: {
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: 0,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 40,
  },
  timestamp: {
    position: 'absolute',
    right: 0,
    top: 2,
    fontSize: 12,
    color: colors.text.subtitle,
  },
  unreadBadge: {
    backgroundColor: colors.button.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: spacing.sm,
  },
  unreadCount: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  avatar: {
    marginRight: spacing.sm,
  },
}); 