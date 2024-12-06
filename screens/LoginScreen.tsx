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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigation.navigate('MainTabs', { screen: 'Chats' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
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
            Welcome Back
          </Text>
          <Text style={styles.subtitle}>
            Sign in to continue chatting with your friends
          </Text>

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

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            buttonStyle={styles.button}
            containerStyle={styles.buttonContainer}
          />

          <Button
            title="Don't have an account? Sign Up"
            type="clear"
            onPress={() => navigation.navigate('Register')}
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