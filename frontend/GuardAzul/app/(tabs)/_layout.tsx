import { Ionicons } from '@expo/vector-icons';
import { Tabs, SplashScreen } from 'expo-router';
import { useEffect } from 'react';

// [NOVO] Importando as fontes e o hook para usá-las
import { useFonts, Righteous_400Regular } from '@expo-google-fonts/righteous';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';

export default function TabLayout() {
  // [NOVO] Carregando as fontes em segundo plano
  const [fontsLoaded, fontError] = useFonts({
    Righteous_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // [NOVO] Garante que a tela de splash fique visível até as fontes carregarem
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // [NOVO] Se as fontes não carregaram ainda (ou deu erro), não renderiza nada.
  // Isso evita que o texto "pisque" com a fonte padrão antes de carregar a customizada.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // [SEU CÓDIGO ORIGINAL] Seu layout de abas é renderizado aqui, após o carregamento das fontes.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="denunciar"
        options={{
          title: 'Denunciar',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "alert-circle" : "alert-circle-outline"} 
              size={26} 
              color={'#FF4444'}
            />
          ),
          tabBarLabelStyle: {
            fontFamily: 'Nunito_700Bold',
            fontSize: 12,
            color: '#FF4444',
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Homepage',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={26} 
              color={'#20B2AA'}
            />
          ),
           tabBarLabelStyle: {
            fontFamily: 'Nunito_700Bold',
            fontSize: 12,
            color: '#20B2AA',
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={26} 
              color={'#1E88E5'}
            />
          ),
           tabBarLabelStyle: {
            fontFamily: 'Nunito_700Bold',
            fontSize: 12,
            color: '#1E88E5',
          },
        }}
      />
    </Tabs>
  );
}