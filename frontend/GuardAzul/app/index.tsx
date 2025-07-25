// Login Page (First Page)

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    // Aqui você implementaria a lógica de login
    console.log('Login:', { email, password });
    // Navegar para as tabs após login bem-sucedido
    router.replace('/(tabs)');
  };

  const handleSignUp = () => {
    // Navegar para tela de cadastro
    router.push('register' as any);
  };

  const handleForgotPassword = () => {
    Alert.alert('Esqueceu a senha', 'Funcionalidade será implementada');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Usando sua imagem de fundo dos peixes */}
      <ImageBackground 
        source={require('../assets/images/login-background.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay para melhorar a legibilidade */}
        <View style={styles.oceanOverlay} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card de Login */}
          <View style={styles.loginCard}>
            {/* Logo ou título do app */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/tridente-icon.png')} 
                style={styles.appLogo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>GuardAzul</Text>
            </View>

            <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
            
            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#4682B4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#8DB4D2"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#4682B4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#8DB4D2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#4682B4" 
                />
              </TouchableOpacity>
            </View>

            {/* Link Esqueceu Senha */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            {/* Botão Login */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <LinearGradient
                colors={['#008B8B', '#20B2AA', '#48D1CC']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Link Cadastro */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Não possui cadastro? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#4682B4', // Cor de fundo azul enquanto a imagem carrega
  },
  oceanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 100, 130, 0.2)', // Overlay mais sutil para não competir com sua imagem
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)', // Mais opaco para melhor contraste
    borderRadius: 25,
    padding: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3, // Sombra mais forte
    shadowRadius: 15,
    elevation: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008B8B', // Cor que combina com o gradiente
    letterSpacing: 2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 248, 255, 0.95)', // Mais opaco
    borderRadius: 15,
    marginBottom: 18,
    paddingHorizontal: 18,
    height: 55,
    borderWidth: 2,
    borderColor: 'rgba(70, 130, 180, 0.4)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#008B8B',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#008B8B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#6C757D',
    fontSize: 14,
  },
  signUpLink: {
    color: '#008B8B',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 