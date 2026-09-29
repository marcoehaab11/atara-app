import { App } from './ui/app';
import { loadPlayer } from './services/storage';
import './style.css';
const root = document.querySelector<HTMLElement>('#app')!;
if (import.meta.env.DEV && new URLSearchParams(location.search).has('motionBench')) {
  void import('./dev/motionBench').then(module => module.motionBench(root));
} else void loadPlayer().then(player => new App(root, player));
