import { Animated, Pressable, StyleSheet, Text, Dimensions, View } from 'react-native';
import { Icon } from './Icon';
import { PLAYER, clamp, formatClock } from './playerConfig';
import { ProgressBar } from './ProgressBar';

const {  height } = Dimensions.get('screen')

type Props = {
  title: string;
  width: number;
  insets: { top: number; left: number; right: number; bottom: number };
  playing: boolean;
  ended: boolean;
  /** first load / buffering / seeking: the loader takes the play button's place */
  loading?: boolean;
  muted: boolean;
  speed: number;
  speedMenuOpen: boolean;
  isFullscreen: boolean;
  duration: number;
  currentTime: number;
  buffered: number;
  progress: Animated.Value;
  onTogglePlay: () => void;
  onReplay: () => void;
  onSeekBy: (delta: number) => void;
  onToggleMute: () => void;
  onToggleSpeedMenu: () => void;
  onSelectSpeed: (s: number) => void;
  onToggleFullscreen: () => void;
  onScrubStart: () => void;
  onScrub: (ratio: number) => void;
  onScrubEnd: (ratio: number) => void;
};

function RoundButton({
  testID,
  label,
  onPress,
  size,
  children,
}: {
  testID: string;
  label: string;
  onPress: () => void;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}>
      {children}
    </Pressable>
  );
}

function SkipGlyph({ forward, size }: { forward: boolean; size: number }) {
  return (
    <View style={styles.glyph}>
      <Icon name={forward ? 'rotate-cw' : 'rotate-ccw'} size={size} />
      <Text style={[styles.glyphText, { fontSize: Math.max(size * 0.4, 9) }]}>{PLAYER.seekStepSeconds}</Text>
    </View>
  );
}

/** Netflix-like overlay: centre transport buttons, bottom scrubber + actions. */
export function PlayerControls(p: Props) {
  const playSize = clamp(p.width * 0.13, 44, 72);
  const skipSize = clamp(p.width * 0.085, 32, 48);
  const padL = Math.max(p.insets.left, 12) + 4;
  const padR = Math.max(p.insets.right, 12) + 4;
  const remaining = Math.max(p.duration - p.currentTime, 0);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="player-controls">
      <View style={styles.scrim} pointerEvents="none" />

      {p.isFullscreen && (
        <View style={[styles.top, { paddingTop: Math.max(p.insets.top, 12), paddingLeft: padL, paddingRight: padR }]} pointerEvents="box-none">
          <Pressable
            testID="player-exit-fullscreen"
            accessibilityRole="button"
            accessibilityLabel="Exit fullscreen"
            onPress={p.onToggleFullscreen}
            hitSlop={10}>
            <Icon name="arrow-left" size={26} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {p.title}
          </Text>
        </View>
      )}

      <View style={styles.center} pointerEvents="box-none">
        <RoundButton testID="player-rewind" label="Rewind 10 seconds" size={skipSize + 12} onPress={() => p.onSeekBy(-PLAYER.seekStepSeconds)}>
          <SkipGlyph forward={false} size={skipSize * 0.7} />
        </RoundButton>

        {p.loading ? (
          <View style={{ width: playSize + 12, height: playSize + 12 }} />
        ) : p.ended ? (
          <RoundButton testID="player-replay" label="Replay" size={playSize + 12} onPress={p.onReplay}>
            <Icon name="rotate-ccw" size={playSize * 0.55} />
          </RoundButton>
        ) : (
          <RoundButton
            testID="player-play-pause"
            label={p.playing ? 'Pause' : 'Play'}
            size={playSize + 12}
            onPress={p.onTogglePlay}>
            <Icon name={p.playing ? 'pause' : 'play'} size={playSize * 0.55} />
          </RoundButton>
        )}

        <RoundButton testID="player-forward" label="Forward 10 seconds" size={skipSize + 12} onPress={() => p.onSeekBy(PLAYER.seekStepSeconds)}>
          <SkipGlyph forward size={skipSize * 0.7} />
        </RoundButton>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(p.insets.bottom, 8) }]} pointerEvents="box-none">
        {/* Full-width progress bar with padding */}
        <View style={styles.progressRow}>
          <ProgressBar
            progress={p.progress}
            buffered={p.buffered}
            duration={p.duration}
            onScrubStart={p.onScrubStart}
            onScrub={p.onScrub}
            onScrubEnd={p.onScrubEnd}
            onStep={p.onSeekBy}
          />
        </View>

        <View style={[styles.actions, { paddingLeft: padL, paddingRight: padR }]} pointerEvents="box-none">
          <View style={styles.actionsLeft} pointerEvents="box-none">
            <View>
              <Pressable
                testID="player-speed"
                accessibilityRole="button"
                accessibilityLabel="Playback speed"
                onPress={p.onToggleSpeedMenu}
                hitSlop={8}
                style={styles.speedBtn}>
                <Text style={styles.speedText}>{p.speed}x</Text>
              </Pressable>
              {p.speedMenuOpen && (
                <View style={styles.menu} testID="player-speed-menu">
                  {PLAYER.speeds.map(s => (
                    <Pressable
                      key={s}
                      testID={`player-speed-${s}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${s}x speed`}
                      onPress={() => p.onSelectSpeed(s)}
                      style={styles.menuItem}>
                      <Text style={[styles.menuText, s === p.speed && { color: PLAYER.accent }]}>{s}x</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              testID="player-mute"
              accessibilityRole="button"
              accessibilityLabel={p.muted ? 'Unmute' : 'Mute'}
              onPress={p.onToggleMute}
              hitSlop={10}>
              <Icon name={p.muted ? 'volume-x' : 'volume-2'} size={22} />
            </Pressable>

            {/* Timer moved right after the sound button */}
            <Text testID="player-remaining" style={styles.time}>
              {formatClock(remaining)}
            </Text>
          </View>

          <Pressable
            testID="player-fullscreen"
            accessibilityRole="button"
            accessibilityLabel={p.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onPress={p.onToggleFullscreen}
            hitSlop={10}
            style={[styles.fullscreenBtn, !p.isFullscreen && styles.fullscreenSmallScreen]}>
            <Icon name={p.isFullscreen ? 'minimize' : 'maximize'} size={22} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  round: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  glyph: { alignItems: 'center', justifyContent: 'center' },
  glyphText: { position: 'absolute', color: '#fff', fontWeight: '800' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom:-height*0.06, gap: 4 },
  
  // Clean spacing without negative margins
  progressRow: { marginHorizontal: 16, marginBottom: 2 },
  
  time: { color: '#fff', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 0,bottom:height*0.025 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  speedBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  speedText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  menu: { position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, minWidth: 64, borderRadius: 10, backgroundColor: 'rgba(20,20,20,0.95)', paddingVertical: 4 },
  menuItem: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  menuText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fullscreenBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenSmallScreen: {
    transform: [{ translateY: 2 }],
  },
});