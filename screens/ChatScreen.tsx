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
import { colors, spacing, borderRadius, typography, shadows, layout } from '../theme';
import ReactionsMenu from '../server/src/components/ReactionMenuProps';

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
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

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
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [message, ...prev];
          });
          
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
    console.log('handleReaction called with:', { messageId, reaction });
    if (!user) return;

    setMessages(prev => {
      console.log('Previous messages:', prev);
      const newMessages = prev.map(msg => {
        if (msg.id === messageId) {
          console.log('Updating message:', msg.id);
          // Remove existing reaction from this user if it exists
          const filteredReactions = msg.reactions.filter(r => r.user !== user.id);
          // Add new reaction
          const newMsg = {
            ...msg,
            reactions: [...filteredReactions, { user: user.id, reaction }]
          };
          console.log('Updated message:', newMsg);
          return newMsg;
        }
        return msg;
      });
      console.log('New messages:', newMessages);
      return newMessages;
    });

    // Emit to socket
    socketRef.current?.emit('message_reaction', {
      messageId,
      userId: user.id,
      reaction,
    });
  };

  const handlePressOutside = () => {
    setSelectedMessageId(null);
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

        <View style={styles.secondaryWrapper}>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isOwnMessage && item.readBy.includes(userId) && (
              <Ionicons name="checkmark-done" size={16} color={colors.text.primary} />
            )}
          </View>

          <View style={styles.reactionsContainer}>
            {item.reactions
              .filter(reaction => reaction.user === user?.id || reaction.user === userId)
              .map((reaction, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.reaction,
                    reaction.user === user?.id ? styles.reactionRight : styles.reactionLeft
                  ]}
                >
                  {reaction.reaction}
                </Text>
            ))}
            <TouchableOpacity
              onPress={() => setSelectedMessageId(item.id)}
              style={styles.addReaction}
            >
              <Text style={{color: colors.text.primary}}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedMessageId === item.id && (
          <>
            <View 
              style={[
                styles.reactionMenu,
                isOwnMessage ? styles.reactionMenuRight : styles.reactionMenuLeft
              ]}
              pointerEvents="box-none"
            >
              <ReactionsMenu
                visible={true}
                onSelect={(reaction: string) => {
                  console.log('Reaction selected:', reaction);
                  handleReaction(item.id, reaction);
                  setSelectedMessageId(null);
                }}
              />
            </View>
            <TouchableOpacity 
              style={[styles.overlay, { zIndex: 999 }]}
              onPress={handlePressOutside} 
              activeOpacity={0}
            />
          </>
        )}
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
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Input
          placeholder="Type a message..."
          placeholderTextColor={colors.text.subtitle}
          value={newMessage}
          onChangeText={text => {
            setNewMessage(text);
            handleTyping();
          }}
          containerStyle={styles.input}
          inputContainerStyle={styles.inputField}
          inputStyle={styles.inputText}
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
    backgroundColor: colors.background.primary,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderColor: colors.message.own,
    borderWidth: 1,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderColor: colors.message.other,
    borderWidth: 1,
  },
  messageText: {
    ...typography.body,
    color: colors.text.primary,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.sm,
  },
  secondaryWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  messageTime: {
    ...typography.caption,
    color: colors.message.time,
    marginRight: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  input: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  inputField: {
    borderBottomWidth: 0,
  },
  attachButton: {
    padding: spacing.sm,
  },
  sendButton: {
    borderColor: colors.button.primary,
    borderWidth: 1,
    width: layout.inputHeight,
    height: layout.inputHeight,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    borderColor: colors.button.disabled,
  },
  typingIndicator: {
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  typingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: spacing.sm,
  },
  reaction: {
    fontSize: 16,
    marginHorizontal: spacing.xs,
  },
  addReaction: {
    borderColor: colors.text.secondary,
    borderWidth: 1,
    width: 20,
    height: 20,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    color: colors.text.inverse,
  },
  reactionMenu: {
    position: 'absolute',
    bottom: '52%',
    marginBottom: 50,
    zIndex: 1001,
    elevation: 5,
  },
  reactionMenuRight: {
    right: 0,
  },
  reactionMenuLeft: {
    left: 0,
  },
  reactionRight: {
    alignSelf: 'flex-end',
  },
  reactionLeft: {
    alignSelf: 'flex-start',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
}); 