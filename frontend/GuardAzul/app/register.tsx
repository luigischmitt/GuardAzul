import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    
    if (!agreeTerms) {
      Alert.alert('Erro', 'Você deve aceitar os termos e condições');
      return;
    }
    
    // Aqui você implementaria a lógica de cadastro
    console.log('Cadastro:', { name, email, password });
    
    Alert.alert(
      'Sucesso!', 
      'Conta criada com sucesso! Bem-vindo ao Guarda Azul!',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)')
        }
      ]
    );
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleTermsPress = () => {
    Alert.alert('Termos e Condições', 'Funcionalidade será implementada');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Política de Privacidade', 'Funcionalidade será implementada');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Usando a mesma imagem de fundo dos peixes */}
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
          {/* Card de Cadastro */}
          <View style={styles.registerCard}>
            <Text style={styles.registerTitle}>Cadastro</Text>
            <Text style={styles.registerSubtitle}>
              Cria a sua conta e seja Guardião do Mar!
            </Text>
            
            {/* Campo Nome */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#4682B4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor="#8DB4D2"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#4682B4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
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
                placeholder="Crie uma senha"
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

            {/* Campo Confirmar Senha */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#4682B4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirme a senha"
                placeholderTextColor="#8DB4D2"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#4682B4" 
                />
              </TouchableOpacity>
            </View>

            {/* Checkbox Termos */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>Li e concordo com os </Text>
                <TouchableOpacity onPress={handleTermsPress}>
                  <Text style={styles.termsLink}>Termos e Condições</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> e a </Text>
                <TouchableOpacity onPress={handlePrivacyPress}>
                  <Text style={styles.termsLink}>Política de Privacidade</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Botão Cadastrar */}
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <LinearGradient
                colors={['#008B8B', '#20B2AA', '#48D1CC']}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.registerButtonText}>Cadastrar</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Link Voltar ao Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já possui uma conta? </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>Fazer login</Text>
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
    backgroundColor: 'rgba(0, 100, 130, 0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  registerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  appLogo: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008B8B',
    letterSpacing: 1.5,
  },
  registerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 248, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 18,
    height: 50,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4682B4',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#008B8B',
    borderColor: '#008B8B',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 13,
    color: '#008B8B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#008B8B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6C757D',
    fontSize: 14,
  },
  loginLink: {
    color: '#008B8B',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 