// A single angular degree of freedom keeps the suspension point fixed.
// Angles are radians; time is seconds. No translation or vertical spring exists.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export class SwingPhysics {
  constructor() { this.maxAngle = .27; this.gravity = 12.25; this.reset(); }
  reset() { this.angle = this.angularVelocity = this.targetAngle = 0; this.dragging = false; }
  target(angle) { this.targetAngle = clamp(angle, -this.maxAngle * .8, this.maxAngle * .8); this.dragging = true; }
  release(pointerVelocity) {
    this.dragging = false; this.targetAngle = 0;
    if (Number.isFinite(pointerVelocity)) this.angularVelocity = this.angularVelocity * .45 + pointerVelocity * .55;
    // Bound release energy rather than abruptly bouncing off a rotation limit.
    const speedLimit = Math.sqrt(Math.max(0, 2 * this.gravity * (Math.cos(this.angle) - Math.cos(this.maxAngle)))) * .96;
    this.angularVelocity = clamp(this.angularVelocity, -speedLimit, speedLimit);
  }
  step(elapsed) {
    let remaining = clamp(elapsed, 0, .05);
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 240); remaining -= dt;
      const acceleration = this.dragging
        ? 130 * (this.targetAngle - this.angle) - 21 * this.angularVelocity
        : -this.gravity * Math.sin(this.angle) - .65 * this.angularVelocity;
      this.angularVelocity += acceleration * dt;
      this.angle += this.angularVelocity * dt;
    }
    if (this.atRest()) { this.angle = this.dragging ? this.targetAngle : 0; this.angularVelocity = 0; }
  }
  atRest() { return Math.abs(this.angle - (this.dragging ? this.targetAngle : 0)) < .00015 && Math.abs(this.angularVelocity) < .0005; }
}
