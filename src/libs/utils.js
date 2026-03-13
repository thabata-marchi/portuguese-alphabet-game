/**
 * Calculates the distance between two points
 */
export function pointDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * Returns a random number between min and max
 */
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles an array (Fisher-Yates)
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Converts click coordinates to stage coordinates
 */
export function getScaledClickLocation(event, stage) {
  const rect = stage.canvas.getBoundingClientRect();
  const scaleX = stage.canvas.width / rect.width;
  const scaleY = stage.canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

/**
 * Generates a random vibrant color for the letters
 */
export function randomVibrantColor() {
  const colors = [
    0xFF6B6B, // red
    0x4ECDC4, // turquoise
    0xFFE66D, // yellow
    0xA8E6CF, // light green
    0xFF8B94, // rose
    0x6C5CE7, // purple
    0xFD79A8, // pink
    0x00B894, // green
    0xE17055, // orange
    0x0984E3, // blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
