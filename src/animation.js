import { MathUtils } from 'three';

export function transition(duration, draw) {
  let position = 0;
  let destination = 0;
  return {
    to(value) { destination = value; },
    step(delta, instant = false) {
      if (position === destination) return false;
      const distance = instant ? 1 : delta / duration;
      position += Math.sign(destination - position) * Math.min(distance, Math.abs(destination - position));
      draw(MathUtils.smoothstep(position, 0, 1));
      return true;
    },
  };
}

export function oneShot(duration, draw) {
  let elapsed = duration;
  return {
    start() {
      if (elapsed < duration) return false;
      elapsed = 0;
      return true;
    },
    step(delta, instant = false) {
      if (elapsed >= duration) return false;
      elapsed = instant ? duration : Math.min(duration, elapsed + delta);
      draw(elapsed / duration);
      return true;
    },
    end() {
      if (elapsed >= duration) return;
      elapsed = duration;
      draw(1);
    },
  };
}

export function toggle(target, title, pressed, change) {
  return {
    target,
    label: () => title,
    pressed: () => pressed,
    run() {
      pressed = !pressed;
      change(pressed);
    },
  };
}
