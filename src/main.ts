import { App } from './ui/app';
import { loadPlayer } from './services/storage';
import { initializeNativeServices } from './services/ads';
import { loadPlayGamesSnapshot } from './services/playGames';
import { readPlayer } from './meta/player';
import { showWelcome } from './ui/welcome';
import './style.css';
const root = document.querySelector<HTMLElement>('#app')!;
if (import.meta.env.DEV && new URLSearchParams(location.search).has('motionBench')) {
  void import('./dev/motionBench').then(module => module.motionBench(root));
} else void loadPlayer().then(({ player, returning }) => {
  const enter = (view: 'game' | 'settings' = 'game') => {
    const app = new App(root, player, view);
    void initializeNativeServices();
    void loadPlayGamesSnapshot().then(snapshot => {
      if (!snapshot) return;
      const cloudPlayer = readPlayer(snapshot);
      app.applyCloudPlayer(cloudPlayer);
    });
  };
  if (returning) showWelcome(root, player, enter);
  else enter();
});
