import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={{flex:1}} resizeMode="cover">
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>Bem-vindo à Tabuada!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Tabuada')}>
          <Text style={styles.buttonText}>Jogar Tabuada</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default HomeScreen;