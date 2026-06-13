import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import Header from '../components/Header'
import ClassroomBackground from '../components/ClassroomBackground'
import ChalkPanel from '../components/ChalkPanel'

const HomeScreen = ({ navigation }) => {
  return (
    <ClassroomBackground stripeTop={120}>
      <Header />
      <ChalkPanel style={styles.container}>
        <Text style={styles.title}>Bem-vindo à Tabuada!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Tabuada')}
        >
          <Text style={styles.buttonText}>Jogar Tabuada</Text>
        </TouchableOpacity>
      </ChalkPanel>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '90%',
    marginTop: 40,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: '#f8f8f8',
  },
  button: {
    backgroundColor: '#66bb6a',
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
})

export default HomeScreen
