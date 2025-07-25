import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';

const { width } = Dimensions.get('window');

// Vamos usar a imagem que você baixou
const FishImage = () => (
  <Image
    source={require('../assets/images/peixe.png')}
    style={{ width: 50, height: 50, resizeMode: 'contain' }}
  />
);

interface FishProps {
  delay: number;
  top: number;
  duration: number;
  isReversed?: boolean;
}

const Fish: React.FC<FishProps> = ({ delay, top, duration, isReversed }) => {
  const horizontalPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(horizontalPosition, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const timer = setTimeout(() => animation.start(), delay);
    return () => clearTimeout(timer);
  }, [delay, duration, horizontalPosition]);

  const startX = isReversed ? width + 50 : -50;
  const endX = isReversed ? -50 : width + 50;

  const translateX = horizontalPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const fishStyle = {
    position: 'absolute' as const,
    top: top,
    // O scaleX vira a imagem horizontalmente para que ela "nade" na direção certa
    transform: [{ translateX }, { scaleX: isReversed ? -1 : 1 }],
  };

  return (
    <Animated.View style={fishStyle}>
      <FishImage />
    </Animated.View>
  );
};

const SchoolOfFish: React.FC = () => {
  const school = [
    { delay: 0, top: 150, duration: 10000 },
    { delay: 500, top: 160, duration: 9500 },
    { delay: 800, top: 145, duration: 10500 },
    { delay: 4000, top: 250, duration: 12000, isReversed: true },
    { delay: 4300, top: 265, duration: 11500, isReversed: true },
    { delay: 6000, top: 100, duration: 15000 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {school.map((fishProps, i) => <Fish key={i} {...fishProps} />)}
    </View>
  );
};

export default SchoolOfFish;