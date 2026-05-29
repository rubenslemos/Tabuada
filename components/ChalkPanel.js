import { StyleSheet, View } from 'react-native'

export default function ChalkPanel({
  children,
  style,
  boardStyle,
  fill = false,
}) {
  return (
    <View style={[styles.frameOuter, style]}>
      <View style={[styles.frameMid, fill && styles.fill]}>
        <View style={[styles.frameInner, fill && styles.fill]}>
          <View style={[styles.board, fill && styles.fill, boardStyle]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frameOuter: {
    backgroundColor: '#8a5624',
    borderColor: '#5f3715',
    borderWidth: 3,
    borderRadius: 18,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fill: {
    flex: 1,
  },
  frameMid: {
    backgroundColor: '#bf8a4b',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  frameInner: {
    backgroundColor: '#70431d',
    borderRadius: 11,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  board: {
    backgroundColor: '#15553f',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.82)',
    alignSelf: 'stretch',
  },
})
