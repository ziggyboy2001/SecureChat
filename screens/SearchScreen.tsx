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
import { colors, spacing, borderRadius, typography, shadows, layout } from '../theme';

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
        placeholderTextColor={colors.text.subtitle}
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
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
    backgroundColor: colors.background.primary,
  },
  searchInput: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    margin: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  userItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    alignItems: 'center',
  },
  avatar: {
    width: layout.avatarSizes.medium,
    height: layout.avatarSizes.medium,
    borderRadius: layout.avatarSizes.medium / 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
  },
  email: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.circle,
    marginBottom: spacing.xs,
  },
  lastSeen: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  loader: {
    marginTop: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.text.secondary,
  },
});

export default SearchScreen; 
