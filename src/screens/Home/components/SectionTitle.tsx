import {StyleSheet, Text, View} from 'react-native';
import {Icon, type IconName} from '../../../components/icons';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {HOME} from '../oldhomeConfig';

export function SectionTitle({icon, title}: {icon: IconName; title: string}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={16} color={colors.neon} />
      </View>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: HOME.grid.padding,
    marginTop: 24,
    marginBottom: 12,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  title: {flex: 1, color: colors.filament, fontFamily: fonts.black, fontSize: 16},
});
