import { App } from './ui/app';
import { loadPlayer } from './services/storage';
import { initializeNativeServices } from './services/ads';
import { loadPlayGamesSnapshot } from './services/playGames';
import { readPlayer } from './meta/player';
import './style.css';
const root = document.querySelector<HTMLElement>('#app')!;
if (import.meta.env.DEV && new URLSearchParams(location.search).has('motionBench')) {
  void import('./dev/motionBench').then(module => module.motionBench(root));
} else void loadPlayer().then(async player => {
  const app = new App(root, player);
  void initializeNativeServices();
  void loadPlayGamesSnapshot().then(snapshot => {
    if (!snapshot) return;
    const cloudPlayer = readPlayer(snapshot);
    app.applyCloudPlayer(cloudPlayer);
  });
});
