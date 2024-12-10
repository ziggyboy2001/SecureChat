import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Avatar, Text, ListItem, Button } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { colors, spacing, borderRadius, typography, shadows, layout } from '../theme';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/users/avatar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            avatar: `data:image/jpeg;base64,${result.assets[0].base64}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update avatar');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update avatar');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: logout,
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarChange} disabled={loading}>
          <Avatar
            size="xlarge"
            rounded
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require('../assets/images/default-avatar.png')
            }
            containerStyle={styles.avatar}
          >
            <Avatar.Accessory size={36} />
          </Avatar>
        </TouchableOpacity>
        <Text h3 style={styles.username}>
          {user?.username}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>
          Settings
        </Text>
        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>Notifications</ListItem.Title>
            <ListItem.Subtitle style={styles.listItemSubtitle}>Manage notification settings</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>

        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>Privacy</ListItem.Title>
            <ListItem.Subtitle style={styles.listItemSubtitle}>Control your privacy settings</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>

        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>Account</ListItem.Title>
            <ListItem.Subtitle style={styles.listItemSubtitle}>Manage your account settings</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>
      </View>

      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>
          Support
        </Text>
        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>Help Center</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>

        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>Contact Us</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>

        <ListItem bottomDivider containerStyle={styles.listItem}>
          <ListItem.Content style={styles.listItemContent}>
            <ListItem.Title style={styles.listItemTitle}>About</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron style={styles.listItemChevron} />
        </ListItem>
      </View>

      <Button
        title="Logout"
        onPress={handleLogout}
        buttonStyle={styles.logoutButton}
        titleStyle={styles.logoutButtonText}
        containerStyle={styles.logoutButtonContainer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  avatar: {
    backgroundColor: colors.background.primary,
    marginBottom: 15,
  },
  username: {
    marginBottom: 5,
  },
  email: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    marginTop: 20,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  sectionTitle: {
    padding: 15,
    marginBottom: 0,
    backgroundColor: colors.background.primary,
  },
  logoutButton: {
    backgroundColor: colors.button.primary,
    borderRadius: borderRadius.sm,
    height: 50,
    marginTop: 30,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButtonContainer: {
    marginHorizontal: 15,
    marginBottom: 30,
  },
  listItemContent: {
    backgroundColor: colors.background.primary,
  },
  listItemTitle: {
    color: colors.text.primary,
  },
  listItemSubtitle: {
    color: colors.text.subtitle,
  },
  listItem: {
    borderBottomColor: colors.border.secondary,
    backgroundColor: colors.background.primary,
  },
  listItemChevron: {
    color: colors.border.secondary,
  },
}); 

