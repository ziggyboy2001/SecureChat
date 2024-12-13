import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Input, Button, Text, Switch, Slider } from '@rneui/themed';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { colors, spacing, typography } from '../theme';
import { BOT_PROMPTS } from '../services/openai';

interface UnderDuressSettings {
  showTimestamps: boolean;
  minTimeInMinutes: number;
  maxTimeInMinutes: number;
  numberOfFakeUsers: number;
  underDuressAccount?: {
    username: string;
    email: string;
    password: string;
  };
  selectedBots: string[];
}

export default function UnderDuressSettingsScreen() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UnderDuressSettings>({
    showTimestamps: true,
    minTimeInMinutes: 2,
    maxTimeInMinutes: 1440,
    numberOfFakeUsers: 5,
    selectedBots: [],
  });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/under-duress-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...data,
          selectedBots: data.selectedBots || []
        });
        if (data.underDuressAccount) {
          setUsername(data.underDuressAccount.username);
          setEmail(data.underDuressAccount.email);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!username || !email) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving settings:', {
        ...settings,
        underDuressAccount: password ? { username, email, password } : undefined
      });

      const response = await fetch(`${API_URL}/auth/under-duress-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...settings,
          underDuressAccount: {
            username,
            email,
            password,
          },
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save settings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text h4 style={styles.sectionTitle}>Under Duress Account</Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor={colors.text.secondary}
        inputStyle={{ color: colors.text.primary }}
      />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.text.secondary}
        inputStyle={{ color: colors.text.primary }}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.text.secondary}
        inputStyle={{ color: colors.text.primary }}
      />
      <Input
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor={colors.text.secondary}
        inputStyle={{ color: colors.text.primary }}
      />

      <Text h4 style={styles.sectionTitle}>Fake Chat Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={{color: colors.text.secondary}}>Show Timestamps</Text>
        <Switch
          value={settings.showTimestamps}
          onValueChange={(value) => setSettings({ ...settings, showTimestamps: value })}
          color={colors.button.primary}
        />
      </View>

      {settings.showTimestamps && (
        <>
          <Text style={styles.label}>Minimum Time (minutes): {settings.minTimeInMinutes}</Text>
          <Slider
            value={settings.minTimeInMinutes}
            onValueChange={(value) => setSettings({ ...settings, minTimeInMinutes: value })}
            minimumValue={2}
            maximumValue={60}
            step={1}
            thumbStyle={{ backgroundColor: colors.button.primary, height: 20, width: 15 }}
            trackStyle={{ height: 4 }}
            minimumTrackTintColor={colors.button.primary}
          />

          <Text style={styles.label}>Maximum Time (hours): {settings.maxTimeInMinutes / 60}</Text>
          <Slider
            value={settings.maxTimeInMinutes}
            onValueChange={(value) => setSettings({ ...settings, maxTimeInMinutes: value })}
            minimumValue={60}
            maximumValue={1440}
            step={60}
            thumbStyle={{ backgroundColor: colors.button.primary, height: 20, width: 15 }}
            trackStyle={{ height: 4 }}
            minimumTrackTintColor={colors.button.primary}
          />
        </>
      )}

      <Text style={styles.label}>Number of Fake Conversations: {settings.numberOfFakeUsers}</Text>
      <Slider
        value={settings.numberOfFakeUsers}
        onValueChange={(value) => setSettings({ ...settings, numberOfFakeUsers: value })}
        minimumValue={2}
        maximumValue={15}
        step={1}
        thumbStyle={{ backgroundColor: colors.button.primary, height: 20, width: 15 }}
        trackStyle={{ height: 4 }}
        minimumTrackTintColor={colors.button.primary}
      />

      <Text style={styles.description}>
        When under duress, your chat list will show these fake conversations with randomly generated users. 
        You can still search and message real users, but they won't appear in your chat list.
      </Text>

      <Text h4 style={styles.sectionTitle}>Chat Personas</Text>
      <Text style={styles.description}>
        Select up to 5 AI personas to generate fake conversations in duress mode.
      </Text>
      {Object.entries(BOT_PROMPTS).map(([botType, prompt]) => (
        <View key={botType} style={styles.settingRow}>
          <Text style={{color: colors.text.secondary}}>{botType.replace('_', ' ').toUpperCase()}</Text>
          <Switch
            value={settings.selectedBots.includes(botType)}
            onValueChange={(value) => {
              const newBots = value 
                ? [...settings.selectedBots, botType].slice(0, 5)
                : settings.selectedBots.filter(b => b !== botType);
              setSettings({ ...settings, selectedBots: newBots });
            }}
            disabled={!settings.selectedBots.includes(botType) && settings.selectedBots.length >= 5}
            color={colors.button.primary}
          />
        </View>
      ))}
      <Text style={styles.label}>Selected: {settings.selectedBots.length}/5</Text>

      <Button
        title="Save Settings"
        onPress={handleSave}
        loading={loading}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  sectionTitle: {
    marginVertical: spacing.lg,
    color: colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
    marginVertical: spacing.sm,
  },
  button: {
    backgroundColor: colors.button.primary,
    borderRadius: spacing.sm,
    marginTop: spacing.lg,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    marginVertical: spacing.sm,
  },
}); 