// Hero scene loader. Picks one scene at random, dynamically imports only that
// scene's module (unselected modules are never fetched), injects its SVG and
// scoped CSS. Respects reduced motion, document.hidden, hero visibility.
const SCENES = ['ctl', 'bfr'];

async function run() {
  const stage = document.getElementById('hero-stage');
  if (!stage) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = SCENES[Math.floor(Math.random() * SCENES.length)];
  let mod;
  try {
    mod = await import(`./scenes/${pick}.mjs`);
  } catch (e) { return; }

  const styleEl = document.createElement('style');
  styleEl.textContent = mod.css || '';
  stage.appendChild(styleEl);

  const wrap = document.createElement('div');
  wrap.className = 'hero-svg';
  wrap.innerHTML = mod.svg;
  stage.appendChild(wrap);
  stage.dataset.scene = pick;

  if (reduce) {
    stage.classList.add('is-static');
    return;
  }

  if (mod.start) mod.start(stage);

  // The hero only animates when both flags are true: the tab is visible AND the stage is on
  // screen. Each listener updates its own flag and then calls syncPlay; neither can clobber
  // the other's state.
  let visible = !document.hidden;
  let intersecting = true;
  let reduceNow = reduce;
  const syncPlay = () => {
    const on = visible && intersecting && !reduceNow;
    stage.style.animationPlayState = on ? 'running' : 'paused';
    stage.querySelectorAll('*').forEach(el => {
      el.style.animationPlayState = on ? 'running' : 'paused';
    });
    stage.classList.toggle('is-static', reduceNow);
  };

  document.addEventListener('visibilitychange', () => { visible = !document.hidden; syncPlay(); });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) intersecting = e.isIntersecting;
    syncPlay();
  }, { threshold: 0.01 });
  io.observe(stage);

  // React to a runtime change in the user's reduced-motion preference. Older browsers that
  // do not implement addEventListener on MediaQueryList fall through silently.
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const onReduce = () => { reduceNow = mq.matches; syncPlay(); };
  if (mq.addEventListener) mq.addEventListener('change', onReduce);
  else if (mq.addListener) mq.addListener(onReduce);

  syncPlay();
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(run, { timeout: 1500 });
} else {
  setTimeout(run, 200);
}
