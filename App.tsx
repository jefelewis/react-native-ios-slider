// Imports: Dependencies
import React from 'react';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';

// Imports: Components
import {Slider} from './src/components/Slider';

// App
const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <Slider
        type="Range"
        min={0}
        max={100}
        step={1}
        onChange={(low: number, high: number) => console.log(low, high)}
        minRange={5}
        disabled={false}
        darkMode={false}
      />
    </SafeAreaView>
  );
};

// Exports
export default App;
