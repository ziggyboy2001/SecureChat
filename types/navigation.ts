import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Chats: undefined;
  Profile: undefined;
  Search: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  Chat: {
    userId: string;
    username: string;
    avatar?: string;
  };
  UnderDuressSettings: undefined;
}; 