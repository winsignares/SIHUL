import { motion } from 'motion/react';
import { memo, useMemo } from 'react';

type Particle = {
  left: string;
  top: string;
  size: string;
  xOffset: number;
  duration: number;
  delay: number;
};

const createParticleRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const buildParticles = (count: number, seedOffset: number, xRange: number, durationBase: number, durationRange: number, delayRange: number): Particle[] => {
  return Array.from({ length: count }, (_, index) => {
    const random = createParticleRandom(seedOffset + index + 1);

    return {
      left: `${random() * 100}%`,
      top: `${random() * 100}%`,
      size: `${2 + random() * 4}px`,
      xOffset: random() * xRange - xRange / 2,
      duration: durationBase + random() * durationRange,
      delay: random() * delayRange,
    };
  });
};

export const LoginBackgroundParticles = memo(function LoginBackgroundParticles() {
  const floatingParticles = useMemo(() => buildParticles(50, 1000, 100, 6, 6, 4), []);

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600 to-red-700 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full opacity-15 blur-3xl"
        animate={{
          x: [-150, 150, -150],
          y: [150, -150, 150],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {floatingParticles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute rounded-full opacity-40 ${
            i % 3 === 0 ? 'bg-gradient-to-r from-red-400 to-red-500' :
            i % 3 === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
            'bg-gradient-to-r from-blue-400 to-blue-500'
          }`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0.1, 0.6, 0.1],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  );
});

export const RightSideParticles = memo(function RightSideParticles() {
  const rightSideParticles = useMemo(() => buildParticles(20, 2000, 30, 5, 3, 2), []);

  return (
    <>
      {rightSideParticles.map((particle, i) => (
        <motion.div
          key={`right-particle-${i}`}
          className="absolute w-1 h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full opacity-40"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  );
});
