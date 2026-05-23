import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';
import { COLORS, FONTS } from '../src/theme';

export default function PermissoesScreen() {
  const [loading, setLoading] = useState(true);
  const [permissoes, setPermissoes] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return setPermissoes({});
        const resp = await axios.get(`${API_BASE_URL}/auth/login/${userId}`);
        setPermissoes(resp.data.user?.permissoes || resp.data.permissoes || {});
      } catch (err) {
        console.error('Erro ao carregar permissões:', err?.response?.data || err.message);
        setPermissoes({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator/></View>;

  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={{flex:1}} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.panel}>
          <Text style={styles.title}>Permissões</Text>
          {Object.keys(permissoes).length === 0 && <Text>Nenhuma permissão encontrada.</Text>}
          {Object.entries(permissoes).map(([k,v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.key}>{k}</Text>
              <Text style={styles.value}>{String(v)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  panel: { width: '92%', maxWidth: 720, backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 10 },
  title: { fontSize: 22, fontFamily: FONTS.title, color: COLORS.primaryDarker, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  key: { fontFamily: FONTS.body, color: COLORS.primaryDarker },
  value: { fontFamily: FONTS.body }
});