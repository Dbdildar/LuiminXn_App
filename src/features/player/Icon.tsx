import Feather from 'react-native-vector-icons/Feather';

export type IconName =
  | 'play'
  | 'pause'
  | 'rotate-ccw'
  | 'rotate-cw'
  | 'volume-2'
  | 'volume-x'
  | 'maximize'
  | 'minimize'
  | 'search'
  | 'arrow-left'
  | 'x'
  | 'alert-circle'
  | 'wifi-off';

/** The ONLY place that knows which icon library is used. Swap it here if yours differs. */
export function Icon({name, size = 24, color = '#fff'}: {name: IconName; size?: number; color?: string}) {
  return <Feather name={name} size={size} color={color} />;
}