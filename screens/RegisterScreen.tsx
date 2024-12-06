import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register(username, email, password);
      navigation.navigate('MainTabs', { screen: 'Chats' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text h1 style={styles.title}>
            Create Account
          </Text>
          <Text style={styles.subtitle}>
            Join our community and start chatting
          </Text>

          <Input
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            leftIcon={{ type: 'ionicon', name: 'person-outline' }}
          />

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={{ type: 'ionicon', name: 'mail-outline' }}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={{ type: 'ionicon', name: 'lock-closed-outline' }}
          />

          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon={{ type: 'ionicon', name: 'lock-closed-outline' }}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            buttonStyle={styles.button}
            containerStyle={styles.buttonContainer}
          />

          <Button
            title="Already have an account? Login"
            type="clear"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    height: 50,
  },
  buttonContainer: {
    marginVertical: 12,
    borderRadius: 25,
  },
}); 