// Cells-triggered-list: 8 slots fill in sequence, then drain. Motif fills the stage.
export const svg = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
  <g transform="translate(20,50)">
    ${Array.from({length:8}).map((_,i)=>`
      <g transform="translate(${i*58},0)">
        <rect x="0" y="0" width="48" height="200" rx="7" fill="#FAF9F5" stroke="#E6E3DA" stroke-width="1.5"/>
        <rect class="ctl-fill" x="3" y="3" width="42" height="194" rx="6" fill="#F7DFD3" stroke="#9E4A2F" stroke-width="1.2" style="animation-delay:${i*0.5}s"/>
        <text x="24" y="110" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" fill="#66655F">C${i+1}</text>
      </g>`).join('')}
  </g>
</svg>`;
export const css = `
.hero-stage .ctl-fill{opacity:0;transform-origin:center bottom;animation:ctlPulse 8s ease-in-out infinite}
@keyframes ctlPulse{0%,100%{opacity:0;transform:scaleY(.1)}20%,55%{opacity:1;transform:scaleY(1)}75%{opacity:0;transform:scaleY(.1)}}
`;
export function start(){}
