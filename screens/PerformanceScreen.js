import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

export default function PerformanceScreen(){
  return (
    <View style={{flex:1}}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>Desempenho (em breve)</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {flex:1, justifyContent:'center', alignItems:'center'},
  title: {fontSize:18}
});