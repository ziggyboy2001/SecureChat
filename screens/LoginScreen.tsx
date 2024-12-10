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
import { colors, spacing, borderRadius, typography, shadows, layout } from '../theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password');
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
            placeholderTextColor={colors.text.subtitle}
            value={email}
            inputStyle={{ color: colors.text.primary }}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={{ type: 'ionicon', name: 'mail-outline', color: colors.text.subtitle }}
          />

          <Input
            placeholder="Password"
            placeholderTextColor={colors.text.subtitle}
            inputStyle={{ color: colors.text.primary }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={{ type: 'ionicon', name: 'lock-closed-outline', color: colors.text.subtitle }}
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
            titleStyle={styles.signUpButtonText}  
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
    backgroundColor: colors.background.primary,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    color: colors.text.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.text.subtitle,
    marginBottom: 32,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    borderColor: colors.button.primary,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    height: 50,
  },
  buttonContainer: {
    marginVertical: 12,
    borderRadius: borderRadius.sm,
  },
  signUpButtonText: {
    color: colors.text.subtitle,
  },
}); 
