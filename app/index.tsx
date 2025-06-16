import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function IndexScreen() {
  useEffect(() => {
    // Redirect to auth flow on app start
    // In a real app, you'd check if user is authenticated first
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
});