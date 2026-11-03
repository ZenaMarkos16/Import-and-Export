// Angles are radians; elapsed time is seconds. The pendulum has its own angular
// velocity, so releasing the pointer removes the force without removing momentum.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export class SwingPhysics {
  constructor() { this.maxAngle = .21; this.reset(); }
  reset() {
    this.angle = this.angularVelocity = this.x = this.y = this.vx = this.vy = 0;
    this.targetAngle = this.targetX = this.targetY = 0;
    this.dragging = false;
  }
  target(angle = 0, x = 0, y = 0, dragging = false) {
    this.targetAngle = clamp(angle, -this.maxAngle, this.maxAngle);
    this.targetX = x; this.targetY = y; this.dragging = dragging;
  }
  release() { this.target(); }
  step(elapsed) {
    // Substeps keep the solver stable across frame rates and background-tab gaps.
    let remaining = clamp(elapsed, 0, .05);
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120); remaining -= dt;
      const stiffness = this.dragging ? 105 : 19;
      const damping = this.dragging ? 16 : 3.1;
      const angularForce = this.dragging
        ? stiffness * (this.targetAngle - this.angle)
        : -stiffness * Math.sin(this.angle) + stiffness * this.targetAngle;
      this.angularVelocity += (angularForce - damping * this.angularVelocity) * dt;
      this.angle += this.angularVelocity * dt;
      if (Math.abs(this.angle) > this.maxAngle * 1.16) { this.angle = Math.sign(this.angle) * this.maxAngle * 1.16; this.angularVelocity *= -.18; }
      for (const [position, velocity, target] of [['x','vx','targetX'], ['y','vy','targetY']]) {
        this[velocity] += ((this[target] - this[position]) * stiffness - damping * this[velocity]) * dt;
        this[position] += this[velocity] * dt;
      }
    }
    if (this.atRest()) {
      this.angle = this.targetAngle; this.x = this.targetX; this.y = this.targetY;
      this.angularVelocity = this.vx = this.vy = 0;
    }
  }
  atRest() {
    return Math.abs(this.angle - this.targetAngle) < .00015 && Math.abs(this.angularVelocity) < .0005
      && Math.abs(this.x - this.targetX) < .025 && Math.abs(this.y - this.targetY) < .025
      && Math.abs(this.vx) < .08 && Math.abs(this.vy) < .08;
  }
}
