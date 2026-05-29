import { ImageBackground, StyleSheet, View } from 'react-native'

export default function ClassroomBackground({ children }) {
  return (
    <ImageBackground
      source={require('../assets/images/classroom-background.png')}
      style={styles.bg}
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
    >
      <View style={styles.content} collapsable={false}>
        {children}
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
})
