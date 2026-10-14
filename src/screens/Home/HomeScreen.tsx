import {StyleSheet, Text, View} from 'react-native';
import {colors, fontSizes, fonts} from '../../theme';

/**
 * Placeholder landing screen shown after the splash.
 * The video library, player and navigation will be built here next.
 * There is no login or sign-up: the app opens straight to content.
 */
export function HomeScreen() {
  return (
    <View style={styles.root} testID="home-screen">
      <Text style={styles.title} accessibilityRole="header">
        Welcome to LuminXn
      </Text>
      <Text style={styles.body}>Your videos will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.filament,
    fontFamily: fonts.light,
    fontSize: fontSizes.title,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    color: colors.mist,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
});

export default HomeScreen;
