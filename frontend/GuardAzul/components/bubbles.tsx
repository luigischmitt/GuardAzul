import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

type BubbleProps = {
  size: number;
  initialX: string; // Ex: '15%'
  duration: number;
};

const Bubble: React.FC<BubbleProps> = ({ size, initialX, duration }) => {
  const yPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(yPosition, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    ).start();
  }, [duration, yPosition]);

  const translateY = yPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [height, -size],
  });

  // Converte '15%' → 0.15 * width
  const convertPercentageToValue = (percentage: string): number => {
    const num = parseFloat(percentage.replace('%', ''));
    return (num / 100) * width;
  };

  const bubbleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute' as const,
    left: convertPercentageToValue(initialX),
    transform: [{ translateY }],
  };

  return <Animated.View style={bubbleStyle} />;
};

const Bubbles: React.FC = () => {
  const bubbleData: BubbleProps[] = [
    { size: 20, initialX: '5%', duration: 10000 },
    { size: 35, initialX: '15%', duration: 12000 },
    { size: 15, initialX: '30%', duration: 8000 },
    { size: 40, initialX: '50%', duration: 15000 },
    { size: 25, initialX: '70%', duration: 9000 },
    { size: 30, initialX: '85%', duration: 11000 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbleData.map((data, index) => (
        <Bubble key={index} {...data} />
      ))}
    </View>
  );
};

export default Bubbles;
