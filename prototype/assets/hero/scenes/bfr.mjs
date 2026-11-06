// BFR counter: ticks edge toward threshold, resets with each cycle. Motif fills the stage.
export const svg = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
  <g transform="translate(30,110)">
    ${Array.from({length:10}).map((_,i)=>`<rect class="bfr-tick" x="${i*44}" y="0" width="34" height="80" rx="4" fill="#DCEAF5" stroke="#245B84" stroke-width="1.2" style="animation-delay:${i*0.6}s"/>`).join('')}
    <line x1="352" y1="-24" x2="352" y2="104" stroke="#9E4A2F" stroke-width="2.5" stroke-dasharray="5 4"/>
    <text x="352" y="-32" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" fill="#9E4A2F">max</text>
  </g>
</svg>`;
export const css = `
.hero-stage .bfr-tick{opacity:.15;animation:bfrFill 8s linear infinite}
@keyframes bfrFill{0%,5%{opacity:.15;fill:#DCEAF5}50%{opacity:1;fill:#DCEAF5}92%{opacity:1;fill:#F7DFD3}100%{opacity:.15;fill:#DCEAF5}}
`;
export function start(){}
