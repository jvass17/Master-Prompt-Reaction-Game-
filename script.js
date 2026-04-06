// script.js
import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const GAME_STATES = Object.freeze({
  IDLE: "idle",
  WAITING: "waiting",
  READY: "ready",
  FALSE_START: "false-start",
  RESULT: "result"
});

const GAME_COPY = {
  [GAME_STATES.IDLE]: {
    chip: "Idle",
    title: "Ready to begin",
    subtitle: "Press Start to initialize the reaction test.",
    message: "Standing by."
  },
  [GAME_STATES.WAITING]: {
    chip: "Waiting",
    title: "Hold...",
    subtitle: "Wait for the signal. Clicking now will trigger a false start.",
    message: "Stimulus is armed. Stay sharp."
  },
  [GAME_STATES.READY]: {
    chip: "Go",
    title: "GO",
    subtitle: "Tap immediately.",
    message: "Signal active. Measure your reaction now."
  },
  [GAME_STATES.FALSE_START]: {
    chip: "False Start",
    title: "Too early",
    subtitle: "You clicked before the signal. Reset or replay to try again.",
    message: "False start detected."
  },
  [GAME_STATES.RESULT]: {
    chip: "Result",
    title: "Reaction captured",
    subtitle: "Solid hit. Review your time and go again if you want.",
    message: "Valid reaction recorded."
  }
};

const appState = {
  gameState: GAME_STATES.IDLE,
  startTimestamp: 0,
  stimulusTimeoutId: null,
  isRoundActive: false,
  reactionTimes: [],
  falseStarts: 0
};

const ui = {
  reactionZone: document.getElementById("reaction-zone"),
  stateChip: document.getElementById("state-chip"),
  zoneTitle: document.getElementById("zone-title"),
  zoneSubtitle: document.getElementById("zone-subtitle"),
  latestResult: document.getElementById("latest-result"),
  systemMessage: document.getElementById("system-message"),
  bestTime: document.getElementById("best-time"),
  averageTime: document.getElementById("average-time"),
  attemptCount: document.getElementById("attempt-count"),
  falseStartCount: document.getElementById("false-start-count"),
  startBtn: document.getElementById("start-btn"),
  replayBtn: document.getElementById("replay-btn"),
  resetBtn: document.getElementById("reset-btn")
};

const visuals = createReactionLabScene(document.getElementById("three-root"));

function setGameState(nextState) {
  appState.gameState = nextState;

  const copy = GAME_COPY[nextState];
  ui.stateChip.textContent = copy.chip;
  ui.zoneTitle.textContent = copy.title;
  ui.zoneSubtitle.textContent = copy.subtitle;
  ui.systemMessage.textContent = copy.message;

  ui.reactionZone.classList.remove(
    "state-idle",
    "state-waiting",
    "state-ready",
    "state-false-start",
    "state-result"
  );
  ui.reactionZone.classList.add(`state-${nextState}`);

  updateControlStates();
  visuals.setMode(nextState);
}

function updateLatestResult(text) {
  ui.latestResult.textContent = text;
}

function updateStats() {
  const times = appState.reactionTimes;
  const best = times.length ? `${Math.min(...times).toFixed(1)} ms` : "—";
  const avg = times.length
    ? `${(times.reduce((sum, value) => sum + value, 0) / times.length).toFixed(1)} ms`
    : "—";

  ui.bestTime.textContent = best;
  ui.averageTime.textContent = avg;
  ui.attemptCount.textContent = String(times.length);
  ui.falseStartCount.textContent = String(appState.falseStarts);
}

function updateControlStates() {
  const { gameState } = appState;

  ui.startBtn.disabled = gameState === GAME_STATES.WAITING || gameState === GAME_STATES.READY;
  ui.replayBtn.disabled = gameState === GAME_STATES.IDLE || gameState === GAME_STATES.WAITING || gameState === GAME_STATES.READY;
  ui.resetBtn.disabled = false;
}

function clearPendingStimulus() {
  if (appState.stimulusTimeoutId !== null) {
    clearTimeout(appState.stimulusTimeoutId);
    appState.stimulusTimeoutId = null;
  }
}

function fullyDisarmRound() {
  clearPendingStimulus();
  appState.isRoundActive = false;
  appState.startTimestamp = 0;
}

function getRandomDelay() {
  return 1000 + Math.random() * 4000;
}

function beginRound() {
  fullyDisarmRound();

  appState.isRoundActive = true;
  updateLatestResult("—");
  setGameState(GAME_STATES.WAITING);

  const delay = getRandomDelay();

  appState.stimulusTimeoutId = window.setTimeout(() => {
    appState.stimulusTimeoutId = null;

    if (!appState.isRoundActive) {
      return;
    }

    appState.startTimestamp = performance.now();
    setGameState(GAME_STATES.READY);
  }, delay);
}

function recordFalseStart() {
  if (!appState.isRoundActive) {
    return;
  }

  appState.falseStarts += 1;
  updateStats();
  updateLatestResult("False start");
  fullyDisarmRound();
  setGameState(GAME_STATES.FALSE_START);
}

function recordReaction() {
  if (!appState.isRoundActive || appState.gameState !== GAME_STATES.READY) {
    return;
  }

  const reactionTime = performance.now() - appState.startTimestamp;
  appState.reactionTimes.push(reactionTime);

  updateLatestResult(`${reactionTime.toFixed(1)} ms`);
  updateStats();
  fullyDisarmRound();
  setGameState(GAME_STATES.RESULT);
}

function resetSession() {
  fullyDisarmRound();
  appState.reactionTimes = [];
  appState.falseStarts = 0;
  updateLatestResult("—");
  updateStats();
  setGameState(GAME_STATES.IDLE);
}

function handleReactionZonePress() {
  switch (appState.gameState) {
    case GAME_STATES.WAITING:
      recordFalseStart();
      break;
    case GAME_STATES.READY:
      recordReaction();
      break;
    case GAME_STATES.IDLE:
      ui.systemMessage.textContent = "Press Start to begin a round.";
      break;
    case GAME_STATES.FALSE_START:
      ui.systemMessage.textContent = "Use Replay to re-arm the test or Reset to clear the session.";
      break;
    case GAME_STATES.RESULT:
      ui.systemMessage.textContent = "Use Replay for another attempt or Reset to clear stats.";
      break;
    default:
      break;
  }
}

function bindEvents() {
  ui.startBtn.addEventListener("click", () => {
    if (appState.gameState === GAME_STATES.WAITING || appState.gameState === GAME_STATES.READY) {
      return;
    }
    beginRound();
  });

  ui.replayBtn.addEventListener("click", () => {
    beginRound();
  });

  ui.resetBtn.addEventListener("click", () => {
    resetSession();
  });

  ui.reactionZone.addEventListener("click", handleReactionZonePress);

  document.addEventListener("keydown", (event) => {
    const isSpace = event.code === "Space";
    const isEnter = event.code === "Enter";

    if (!isSpace && !isEnter) {
      return;
    }

    const activeTag = document.activeElement?.tagName;
    const isButtonFocused = activeTag === "BUTTON";

    if (!isButtonFocused) {
      event.preventDefault();
      handleReactionZonePress();
    }
  });

  window.addEventListener("beforeunload", () => {
    fullyDisarmRound();
    visuals.destroy();
  });
}

function initialize() {
  updateLatestResult("—");
  updateStats();
  setGameState(GAME_STATES.IDLE);
  bindEvents();
}

initialize();

function createReactionLabScene(container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08101b, 0.055);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2.4, 11.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const labGroup = new THREE.Group();
  scene.add(labGroup);

  const ambient = new THREE.AmbientLight(0x8ab4ff, 0.75);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0x38bdf8, 12, 30, 2);
  keyLight.position.set(0, 2.5, 3.5);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x7c3aed, 8, 35, 2);
  fillLight.position.set(-5, 1.5, -4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x22c55e, 6, 30, 2);
  rimLight.position.set(5, -1, -2);
  scene.add(rimLight);

  const platformGeometry = new THREE.CylinderGeometry(4.4, 5.2, 0.6, 64, 1, false);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x162235,
    metalness: 0.85,
    roughness: 0.3,
    emissive: 0x08131f,
    emissiveIntensity: 0.5
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -2.6;
  labGroup.add(platform);

  const ringGroup = new THREE.Group();
  labGroup.add(ringGroup);

  const ringConfigs = [
    { radius: 2.8, tube: 0.05, y: -0.1, color: 0x38bdf8 },
    { radius: 3.55, tube: 0.06, y: 0.35, color: 0x22c55e },
    { radius: 4.2, tube: 0.05, y: 0.8, color: 0xf59e0b }
  ];

  const rings = ringConfigs.map((config, index) => {
    const geometry = new THREE.TorusGeometry(config.radius, config.tube, 20, 120);
    const material = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      metalness: 0.95,
      roughness: 0.2,
      emissive: config.color,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.85 - index * 0.08
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2 + index * 0.08;
    mesh.position.y = config.y;
    ringGroup.add(mesh);
    return mesh;
  });

  const coreGroup = new THREE.Group();
  coreGroup.position.y = 0.6;
  labGroup.add(coreGroup);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xc6f1ff,
    metalness: 0.55,
    roughness: 0.08,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8
  });

  const coreGeometry = new THREE.IcosahedronGeometry(1.15, 1);
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  coreGroup.add(core);

  const shellGeometry = new THREE.OctahedronGeometry(1.9, 0);
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x77d7ff,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85
  });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.rotation.z = 0.35;
  coreGroup.add(shell);

  const pillarGroup = new THREE.Group();
  labGroup.add(pillarGroup);

  const pillarGeometry = new THREE.BoxGeometry(0.22, 5.8, 0.22);
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x233348,
    metalness: 0.88,
    roughness: 0.28,
    emissive: 0x0b1320,
    emissiveIntensity: 0.6
  });

  for (let i = 0; i < 8; i += 1) {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    const angle = (i / 8) * Math.PI * 2;
    const radius = 6.4;
    pillar.position.set(Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius);
    pillar.rotation.y = angle;
    pillarGroup.add(pillar);

    const capGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: i % 2 === 0 ? 0x38bdf8 : 0x7c3aed,
      emissiveIntensity: 1.4,
      metalness: 0.2,
      roughness: 0.2
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 3.0;
    pillar.add(cap);
  }

  const droneGroup = new THREE.Group();
  labGroup.add(droneGroup);

  const droneGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const droneMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6ecff,
    metalness: 0.8,
    roughness: 0.16,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9
  });

  const drones = [];
  for (let i = 0; i < 16; i += 1) {
    const mesh = new THREE.Mesh(droneGeometry, droneMaterial.clone());
    const angle = (i / 16) * Math.PI * 2;
    const radius = 5 + (i % 3) * 0.7;
    mesh.position.set(Math.cos(angle) * radius, -0.2 + (i % 4) * 0.65, Math.sin(angle) * radius);
    mesh.rotation.set(angle * 0.7, angle * 0.3, angle * 0.45);
    droneGroup.add(mesh);
    drones.push({
      mesh,
      baseAngle: angle,
      radius,
      heightOffset: mesh.position.y,
      speed: 0.3 + (i % 5) * 0.05,
      direction: i % 2 === 0 ? 1 : -1
    });
  }

  const particlesGroup = new THREE.Group();
  scene.add(particlesGroup);

  const particleGeometry = new THREE.SphereGeometry(0.03, 10, 10);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0x87e8ff,
    transparent: true,
    opacity: 0.8
  });

  const particles = [];
  for (let i = 0; i < 120; i += 1) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
    particle.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 18
    );
    particle.scale.setScalar(0.5 + Math.random() * 1.5);
    particlesGroup.add(particle);
    particles.push({
      mesh: particle,
      drift: 0.08 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2
    });
  }

  const clock = new THREE.Clock();
  let mode = GAME_STATES.IDLE;
  let animationFrameId = null;

  const themeMap = {
    [GAME_STATES.IDLE]: {
      key: 0x38bdf8,
      fill: 0x7c3aed,
      rim: 0x22c55e,
      bg: 0x08101b,
      emissive: 1.6,
      speed: 0.65,
      pulse: 0.45
    },
    [GAME_STATES.WAITING]: {
      key: 0xf59e0b,
      fill: 0xfb7185,
      rim: 0xf59e0b,
      bg: 0x130f08,
      emissive: 1.25,
      speed: 1.1,
      pulse: 0.9
    },
    [GAME_STATES.READY]: {
      key: 0x22c55e,
      fill: 0x38bdf8,
      rim: 0x22c55e,
      bg: 0x07150e,
      emissive: 2.25,
      speed: 1.9,
      pulse: 1.5
    },
    [GAME_STATES.FALSE_START]: {
      key: 0xf97316,
      fill: 0xef4444,
      rim: 0xf97316,
      bg: 0x1b0c06,
      emissive: 2.0,
      speed: 1.4,
      pulse: 1.2
    },
    [GAME_STATES.RESULT]: {
      key: 0x38bdf8,
      fill: 0x22c55e,
      rim: 0x7c3aed,
      bg: 0x08101b,
      emissive: 1.95,
      speed: 1.2,
      pulse: 1.0
    }
  };

  function applyTheme(theme) {
    keyLight.color.setHex(theme.key);
    fillLight.color.setHex(theme.fill);
    rimLight.color.setHex(theme.rim);
    scene.fog.color.setHex(theme.bg);

    coreMaterial.emissive.setHex(theme.key);
    coreMaterial.emissiveIntensity = theme.emissive;

    shellMaterial.emissive.setHex(theme.fill);

    rings[0].material.emissive.setHex(theme.key);
    rings[1].material.emissive.setHex(theme.rim);
    rings[2].material.emissive.setHex(theme.fill);

    drones.forEach((drone, index) => {
      const droneThemeColor = index % 2 === 0 ? theme.key : theme.fill;
      drone.mesh.material.emissive.setHex(droneThemeColor);
      drone.mesh.material.emissiveIntensity = 0.8 + theme.pulse * 0.22;
    });

    particles.forEach((particle, index) => {
      particle.mesh.material.color.setHex(index % 3 === 0 ? theme.fill : theme.key);
    });
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    const theme = themeMap[mode];

    labGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.14;
    ringGroup.rotation.y += 0.0025 * theme.speed;
    ringGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.06;

    rings[0].rotation.z += 0.004 * theme.speed;
    rings[1].rotation.z -= 0.003 * theme.speed;
    rings[2].rotation.z += 0.002 * theme.speed;

    core.rotation.x += 0.006 * theme.speed;
    core.rotation.y += 0.008 * theme.speed;

    shell.rotation.x -= 0.004 * theme.speed;
    shell.rotation.y += 0.005 * theme.speed;
    shell.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.04 * theme.pulse);

    coreGroup.position.y = 0.6 + Math.sin(elapsed * 1.35) * 0.18 * theme.pulse;

    drones.forEach((drone, index) => {
      const t = elapsed * drone.speed * theme.speed;
      const angle = drone.baseAngle + t * 0.45 * drone.direction;
      drone.mesh.position.x = Math.cos(angle) * drone.radius;
      drone.mesh.position.z = Math.sin(angle) * drone.radius;
      drone.mesh.position.y = drone.heightOffset + Math.sin(t + index) * 0.24;
      drone.mesh.rotation.x += 0.015 * theme.speed;
      drone.mesh.rotation.y += 0.02 * theme.speed;
    });

    particles.forEach((particle, index) => {
      particle.mesh.position.y += Math.sin(elapsed * particle.drift + particle.phase) * 0.0025;
      particle.mesh.position.x += Math.cos(elapsed * particle.drift * 0.7 + index) * 0.0012;
      particle.mesh.material.opacity = 0.25 + (Math.sin(elapsed * 1.2 + particle.phase) + 1) * 0.2;
    });

    keyLight.intensity = 9 + Math.sin(elapsed * 2.3) * 0.6 + theme.pulse * 1.2;
    fillLight.intensity = 6 + Math.sin(elapsed * 1.7 + 1) * 0.4 + theme.pulse * 0.8;
    rimLight.intensity = 5 + Math.sin(elapsed * 2.1 + 2) * 0.35 + theme.pulse * 0.9;

    camera.position.x = Math.sin(elapsed * 0.18) * 0.7;
    camera.position.y = 2.4 + Math.cos(elapsed * 0.22) * 0.18;
    camera.lookAt(0, 0.2, 0);

    renderer.render(scene, camera);
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", handleResize);

  applyTheme(themeMap[GAME_STATES.IDLE]);
  animate();

  return {
    setMode(nextMode) {
      mode = nextMode;
      applyTheme(themeMap[nextMode]);
    },
    destroy() {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", handleResize);

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}