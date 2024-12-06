import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Input, Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL, SOCKET_URL, REACTIONS } from '../config';
import io, { Socket } from 'socket.io-client';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

interface Message {
  id: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  type: 'text' | 'image';
  createdAt: string;
  readBy: string[];
  reactions: {
    user: string;
    reaction: string;
  }[];
}

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  route: ChatScreenRouteProp;
}

export default function ChatScreen({ route }: Props) {
  const { userId, username } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user, token } = useAuth();
  const socketRef = useRef<Socket>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO with error handling
    try {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io',
        forceNew: true
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        socketRef.current?.emit('user_online', user.id);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socketRef.current.on('new_message', (message: Message) => {
        console.log('Received new message:', message);
        if (message.sender.id === userId || message.sender.id === user.id) {
          setMessages(prev => [message, ...prev]);
          if (message.sender.id === userId) {
            socketRef.current?.emit('message_read', {
              messageId: message.id,
              readBy: user.id,
            });
          }
        }
      });

      socketRef.current.on('message_sent', (message: Message) => {
        console.log('Message sent confirmation:', message);
        setMessages(prev => [message, ...prev]);
      });

      socketRef.current.on('message_error', (error) => {
        console.error('Message error:', error);
      });

      socketRef.current.on('user_typing', (data: { userId: string }) => {
        if (data.userId === userId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socketRef.current.on('message_status_update', (data: {
        messageId: string;
        readBy: string;
      }) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId
              ? { ...msg, readBy: [...msg.readBy, data.readBy] }
              : msg
          )
        );
      });

      // Fetch messages
      fetchMessages();

      return () => {
        console.log('Disconnecting socket');
        socketRef.current?.disconnect();
      };
    } catch (error) {
      console.error('Socket setup error:', error);
    }
  }, [user, userId]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/messages/${user.id}/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messageData = {
        senderId: user.id,
        receiverId: userId,
        content: newMessage,
        type: 'text' as const,
      };

      console.log('Sending message:', messageData);
      socketRef.current?.emit('private_message', messageData, (error: any) => {
        if (error) {
          console.error('Error sending message:', error);
        }
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error in handleSend:', error);
    }
  };

  const handleImagePick = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const messageData = {
        senderId: user.id,
        receiverId: userId,
        content: `data:image/jpeg;base64,${result.assets[0].base64}`,
        type: 'image' as const,
      };

      socketRef.current?.emit('private_message', messageData);
    }
  };

  const handleTyping = () => {
    if (!user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketRef.current?.emit('typing', {
      senderId: user.id,
      receiverId: userId,
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = undefined;
    }, 2000);
  };

  const handleReaction = (messageId: string, reaction: string) => {
    if (!user) return;

    socketRef.current?.emit('message_reaction', {
      messageId,
      userId: user.id,
      reaction,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!user) return null;
    const isOwnMessage = item.sender.id === user.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {item.type === 'image' ? (
          <Image
            source={{ uri: item.content }}
            style={styles.imageMessage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.messageText}>{item.content}</Text>
        )}

        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isOwnMessage && item.readBy.includes(userId) && (
            <Ionicons name="checkmark-done" size={16} color="#007AFF" />
          )}
        </View>

        <View style={styles.reactionsContainer}>
          {item.reactions.map((reaction, index) => (
            <Text key={index} style={styles.reaction}>
              {reaction.reaction}
            </Text>
          ))}
          <TouchableOpacity
            onPress={() => handleReaction(item.id, REACTIONS[0])}
            style={styles.addReaction}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{username} is typing...</Text>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handleImagePick} style={styles.attachButton}>
          <Ionicons name="image-outline" size={24} color="#007AFF" />
        </TouchableOpacity>

        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={text => {
            setNewMessage(text);
            handleTyping();
          }}
          containerStyle={styles.input}
          inputContainerStyle={styles.inputField}
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim()}
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#rgba(255, 255, 255, 0.7)',
    marginRight: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
  },
  inputField: {
    borderBottomWidth: 0,
  },
  attachButton: {
    padding: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  typingIndicator: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  typingText: {
    color: '#666',
    fontSize: 14,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  reaction: {
    fontSize: 16,
    marginRight: 5,
  },
  addReaction: {
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 