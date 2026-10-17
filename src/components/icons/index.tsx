import Svg, {Circle, Path, Polygon, Polyline, Rect} from 'react-native-svg';

export type IconName =
  | 'search'
  | 'x'
  | 'arrow-left'
  | 'play'
  | 'eye'
  | 'zap'
  | 'trending-up'
  | 'film'
  | 'wifi-off'
  | 'refresh';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
};

/** Small lucide-style icon set drawn with react-native-svg (no extra dependency). */
export function Icon({name, size = 20, color = '#fff', filled = false, strokeWidth = 2}: Props) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: filled ? color : 'none',
  };
  const none = {...p, fill: 'none'};

  let shapes;
  switch (name) {
    case 'search':
      shapes = (
        <>
          <Circle cx="11" cy="11" r="8" {...none} />
          <Path d="m21 21-4.3-4.3" {...none} />
        </>
      );
      break;
    case 'x':
      shapes = <Path d="M18 6 6 18M6 6l12 12" {...none} />;
      break;
    case 'arrow-left':
      shapes = <Path d="m12 19-7-7 7-7M19 12H5" {...none} />;
      break;
    case 'play':
      shapes = <Polygon points="6 3 20 12 6 21 6 3" {...p} />;
      break;
    case 'eye':
      shapes = (
        <>
          <Path
            d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"
            {...none}
          />
          <Circle cx="12" cy="12" r="3" {...none} />
        </>
      );
      break;
    case 'zap':
      shapes = (
        <Path
          d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
          {...p}
        />
      );
      break;
    case 'trending-up':
      shapes = (
        <>
          <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" {...none} />
          <Polyline points="16 7 22 7 22 13" {...none} />
        </>
      );
      break;
    case 'film':
      shapes = (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" {...none} />
          <Path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4" {...none} />
        </>
      );
      break;
    case 'wifi-off':
      shapes = (
        <Path
          d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.52M2 8.82a15 15 0 0 1 4.18-2.64M22 8.82a15 15 0 0 0-11.29-3.76M2 2l20 20"
          {...none}
        />
      );
      break;
    case 'refresh':
      shapes = (
        <Path
          d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"
          {...none}
        />
      );
      break;
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {shapes}
    </Svg>
  );
}
