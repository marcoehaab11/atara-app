import type { Decoration } from '../meta/shop';
import type { Theme } from '../meta/themes';
const assets = import.meta.glob<string>('../../assets/svg/*.svg', { eager: true, query: '?url', import: 'default' });
const names: Record<Decoration | 'eggs' | 'customer', string> = {
  chili: 'decor_chili_string', plant: 'decor_mint_plant', lantern: 'decor_lantern', scale: 'decor_scale', radio: 'decor_radio',
  sign: 'decor_brass_sign_icon', cat: 'decor_cat', tray: 'decor_tea_tray', eggs: 'decor_eggs', customer: 'char_customer',
};
export function art(item: keyof typeof names, label = '') {
  const image = document.createElement('img'); image.src = assets[`../../assets/svg/${names[item]}.svg`]; image.alt = label; return image;
}
export function spiceArt(id: number) {
  const key = Object.keys(assets).find(key => key.includes(`/spice_${id}_`))!;
  const image = document.createElement('img'); image.src = assets[key]; image.alt = ''; return image;
}
export function garland(theme: Theme): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 360 30'); svg.setAttribute('aria-hidden', 'true');
  const add = (tag: string, attrs: Record<string, string>) => { const node = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); svg.append(node); };
  const colors = ['#d4a24c', '#cc4e48', '#69a572', '#76aaca'];
  for (let i = 0; i < 6; i++) {
    const x = i * 60;
    add('path', { d: `M${x} 3 Q${x + 30} 15 ${x + 60} 3`, fill: 'none', stroke: '#d4a24c', 'stroke-width': '1' });
    if (theme === 'ramadan') {
      add('path', { d: `M${x + 30} 9v4m-5 3 5-4 5 4-1 9h-8Z`, fill: colors[i % 3], stroke: '#f0c674' });
    } else if (theme === 'eid') {
      for (const dx of [12, 30, 48]) add('path', { d: `M${x + dx - 5} 8h10l-5 12Z`, fill: colors[(i + dx / 6) % 4] });
    } else if (theme === 'spring') {
      for (const dx of [15, 45]) add('ellipse', { cx: String(x + dx), cy: '13', rx: '6', ry: '3', fill: '#75a16a', transform: `rotate(-30 ${x + dx} 13)` });
      for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) add('circle', { cx: String(x + 30 + dx), cy: String(16 + dy), r: '3', fill: '#e994b1' });
      add('circle', { cx: String(x + 30), cy: '16', r: '2', fill: '#f0c674' });
    }
  }
  return svg;
}
