import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Desenho de uma alga simples
const SeaweedSvg = () => (
  <Svg height="120" width="40" viewBox="0 0 20 60">
    <Path
      d="M 10 60 Q 20 40, 10 20 Q 0 0, 10 0"
      stroke="rgba(0, 128, 128, 0.4)" // Verde-azulado transparente
      strokeWidth="4"
      fill="none"
    />
  </Svg>
);

interface SeaweedProps {
  bottom: number;
  left: number;
  delay: number;
}

const Seaweed: React.FC<SeaweedProps> = ({ bottom, left, delay }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 4000 + delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -1,
          duration: 4000 + delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 4000 + delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const seaweedStyle = {
    position: 'absolute' as const,
    bottom,
    left,
    transformOrigin: 'bottom center', // Específico para web, no RN a rotação é no centro
    transform: [{ rotate }],
  };

  return (
    <Animated.View style={seaweedStyle}>
      <SeaweedSvg />
    </Animated.View>
  );
};

// Componente que renderiza um conjunto de algas
const SeaweedBed: React.FC = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Seaweed bottom={-20} left={30} delay={0} />
            <Seaweed bottom={-15} left={70} delay={500} />
        </View>
    );
}

export default SeaweedBed;