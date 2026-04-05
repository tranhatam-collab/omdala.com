import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../screens/SignInScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { useSession } from '../session/sessionStore';
import { AppTabs } from './AppTabs';

type RootStackParamList = {
  SignIn: undefined;
  MainTabs: undefined;
  RunDetail: { runId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { session } = useSession();
  const isSignedIn = Boolean(session.token);

  return (
    <NavigationContainer>
      {isSignedIn ? (
        <Stack.Navigator>
          <Stack.Screen name="MainTabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="RunDetail" component={RunDetailScreen} options={{ title: 'Run detail' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
