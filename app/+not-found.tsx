import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, textStyles } from '@/theme';
 
export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Screen Not Found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.text.primary,
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    ...textStyles.caption,
    color: colors.accent.blue,
  },
});