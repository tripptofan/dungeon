
import './App.css';
import { Canvas } from '@react-three/fiber';

import Dungeon from './components/dungeon';
import Player from './components/player';
import Overlay from './components/overlay';
import Enemy from './components/enemy';

function App() {
  return (
    <div className="App">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <Dungeon />
        <Player />
        <Enemy />
      </Canvas>
      <Overlay />
    </div>
  );
}
export default App;
