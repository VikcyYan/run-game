import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121a2f);
scene.fog = new THREE.Fog(0x121a2f, 25, 110);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xb4dcff, 0x3d2e1f, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-6, 14, 4);
scene.add(dirLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 420),
  new THREE.MeshStandardMaterial({ color: 0x1d2b47 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -130;
scene.add(ground);

const laneLines = [];
for (let i = -1; i <= 1; i++) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.02, 420),
    new THREE.MeshStandardMaterial({ color: 0x3f87ff })
  );
  line.position.set(i * 4, 0.01, -130);
  scene.add(line);
  laneLines.push(line);
}

const playerGroup = new THREE.Group();
const playerBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 2.1, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x4de4b9, roughness: 0.45 })
);
playerBody.position.y = 1.05;
playerGroup.add(playerBody);
scene.add(playerGroup);

camera.position.set(0, 4.5, 10);

const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
};

const state = {
  speed: 23,
  sideSpeed: 10,
  verticalSpeed: 0,
  gravity: 34,
  jumpSpeed: 14,
  isGrounded: true,
  canAirDash: true,
  airDashTimer: 0,
  crouch: false,
  score: 0,
  gameOver: false,
};

const obstacles = [];
const obstacleGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);

function spawnObstacle(zOffset) {
  const mesh = new THREE.Mesh(
    obstacleGeo,
    new THREE.MeshStandardMaterial({ color: 0xff8b5f, roughness: 0.3 })
  );
  mesh.position.set((Math.floor(Math.random() * 5) - 2) * 2, 1.1, zOffset);
  scene.add(mesh);
  obstacles.push(mesh);
}

for (let i = 0; i < 22; i++) {
  spawnObstacle(-30 - i * 18 - Math.random() * 10);
}

const statusEl = document.getElementById("status");

function setStatus(text) {
  statusEl.textContent = text;
}

setStatus("开始奔跑！");

document.addEventListener("keydown", (event) => {
  const { code } = event;
  if (code in keys) {
    keys[code] = true;
  }

  if (code === "KeyJ" && state.isGrounded && !state.gameOver) {
    state.verticalSpeed = state.jumpSpeed;
    state.isGrounded = false;
    state.canAirDash = true;
  }

  if (code === "KeyK") {
    state.crouch = true;
  }

  if (
    code === "KeyL" &&
    !state.isGrounded &&
    state.canAirDash &&
    !state.gameOver
  ) {
    state.airDashTimer = 0.22;
    state.canAirDash = false;
    setStatus("空中冲刺！");
  }

  if (code === "KeyR" && state.gameOver) {
    resetGame();
  }
});

document.addEventListener("keyup", (event) => {
  const { code } = event;
  if (code in keys) {
    keys[code] = false;
  }
  if (code === "KeyK") {
    state.crouch = false;
  }
});

function resetGame() {
  playerGroup.position.set(0, 0, 0);
  state.verticalSpeed = 0;
  state.isGrounded = true;
  state.canAirDash = true;
  state.airDashTimer = 0;
  state.score = 0;
  state.gameOver = false;

  obstacles.forEach((obs, index) => {
    obs.position.set((Math.floor(Math.random() * 5) - 2) * 2, 1.1, -30 - index * 18 - Math.random() * 6);
  });

  setStatus("重新开始！");
}

function updatePlayer(delta) {
  if (state.gameOver) {
    return;
  }

  const horizontal = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const depth = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

  playerGroup.position.x += horizontal * state.sideSpeed * delta;
  playerGroup.position.z += depth * state.sideSpeed * delta;
  playerGroup.position.x = THREE.MathUtils.clamp(playerGroup.position.x, -7.2, 7.2);
  playerGroup.position.z = THREE.MathUtils.clamp(playerGroup.position.z, -8, 4);

  if (!state.isGrounded) {
    state.verticalSpeed -= state.gravity * delta;
  }

  playerGroup.position.y += state.verticalSpeed * delta;

  if (playerGroup.position.y <= 0) {
    playerGroup.position.y = 0;
    state.verticalSpeed = 0;
    state.isGrounded = true;
    state.airDashTimer = 0;
    setStatus(`得分：${Math.floor(state.score)}（空格区域躲避障碍，R重开）`);
  }

  if (state.airDashTimer > 0) {
    state.airDashTimer -= delta;
    playerGroup.position.z -= 30 * delta;
  }

  const targetHeight = state.crouch ? 1.2 : 2.1;
  playerBody.scale.y = THREE.MathUtils.lerp(playerBody.scale.y, targetHeight / 2.1, 0.22);
  playerBody.position.y = 1.05 * playerBody.scale.y;
}

function updateWorld(delta) {
  if (state.gameOver) {
    return;
  }

  const forwardStep = state.speed * delta;
  state.score += forwardStep * 0.55;

  for (const obs of obstacles) {
    obs.position.z += forwardStep;
    if (obs.position.z > 16) {
      obs.position.z = -360 - Math.random() * 60;
      obs.position.x = (Math.floor(Math.random() * 5) - 2) * 2;
    }

    const dx = Math.abs(obs.position.x - playerGroup.position.x);
    const dz = Math.abs(obs.position.z - playerGroup.position.z);
    const dy = Math.abs(obs.position.y - (playerGroup.position.y + 1));
    if (dx < 1.55 && dz < 1.5 && dy < 1.6) {
      state.gameOver = true;
      setStatus(`撞上障碍！最终得分：${Math.floor(state.score)}，按 R 重开。`);
    }
  }
}

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.032);

  updatePlayer(delta);
  updateWorld(delta);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x * 0.55, 0.07);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.2 + playerGroup.position.y * 0.45, 0.08);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10 + playerGroup.position.z * 0.45, 0.08);
  camera.lookAt(playerGroup.position.x * 0.7, 1.5 + playerGroup.position.y * 0.2, -8);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
