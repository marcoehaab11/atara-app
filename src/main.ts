import { App } from './ui/app';
import { loadPlayer } from './services/storage';
import { initializeNativeServices } from './services/ads';
import './style.css';
const root = document.querySelector<HTMLElement>('#app')!;
if (import.meta.env.DEV && new URLSearchParams(location.search).has('motionBench')) {
  void import('./dev/motionBench').then(module => module.motionBench(root));
} else void loadPlayer().then(async player => {
  new App(root, player);
  void initializeNativeServices();
});
