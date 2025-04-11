const mapImage = document.getElementById("map-image");
const crosshair = document.getElementById("crosshair");
const mapContainer = document.getElementById("map-container");
const findBtn = document.getElementById("find-btn");

let calibration = null;
let zoomFactor = 3;
let currentPixel = { x: 801, y: 3738 };

// Reference coordinates
const logicalRefA = { coords: { yDeg: 0, yMin: 0, yDir: "north", xDeg: 0, xMin: 0, xDir: "east" } };
const logicalRefB = { coords: { yDeg: 24, yMin: 58, yDir: "north", xDeg: 18, xMin: 43, xDir: "east" } };

// Convert coordinates to decimal degrees
const getLogicalDecimal = ({ yDeg, yMin, yDir, xDeg, xMin, xDir }) => {
  let y = yDeg + yMin / 60;
  let x = xDeg + xMin / 60;
  if (yDir === "south") y *= -1;
  if (xDir === "west") x *= -1;
  return { x, y };
};

// Set up calibration using known pixel coordinates
const setupCalibration = () => {
  const refA = { x: 801, y: 3738 }; // (0°N, 0°E)
  const refB = { x: 3197, y: 542 }; // (24°58'N, 18°43'E)

  const logicalA = getLogicalDecimal(logicalRefA.coords);
  const logicalB = getLogicalDecimal(logicalRefB.coords);

  const dxLogical = logicalB.x - logicalA.x;
  const dyLogical = logicalB.y - logicalA.y;
  const dxPixels = refB.x - refA.x;
  const dyPixels = refB.y - refA.y;

  calibration = {
    originPixel: refA,
    pxPerDegX: dxPixels / dxLogical,
    pxPerDegY: dyPixels / dyLogical
  };

  console.log("Calibration set:", calibration);

  // Center map on (0°N, 0°E) with initial zoom
  centerMapOn(refA.x, refA.y);
};

// Center the map on a given pixel coordinate
const centerMapOn = (x, y) => {
  const containerWidth = 600; // Map container width (900 - 300 sidebar)
  const containerHeight = 700; // Map container height

  // Update current pixel position
  currentPixel = { x, y };

  // Adjust for zoom
  const scaledX = x * zoomFactor;
  const scaledY = y * zoomFactor;
  mapImage.style.left = `${containerWidth / 2 - scaledX}px`;
  mapImage.style.top = `${containerHeight / 2 - scaledY}px`;

  console.log("Map centered at (pixel, scaled):", { x, y }, { scaledX, scaledY });

  // Position crosshair at the center of the container
  showCrosshair();
};

// Convert logical coordinates to pixel positions
const convertLogicalToPixel = (logical) => {
  if (!calibration) {
    console.error("Calibration not set");
    return { x: 0, y: 0 };
  }
  const logicalDecimal = getLogicalDecimal(logical);
  const offsetX = logicalDecimal.x * calibration.pxPerDegX;
  const offsetY = logicalDecimal.y * calibration.pxPerDegY;
  return {
    x: calibration.originPixel.x + offsetX,
    y: calibration.originPixel.y + offsetY
  };
};

// Show crosshair at the center of the container
const showCrosshair = () => {
  const containerWidth = 600;
  const containerHeight = 700;
  crosshair.style.left = `${containerWidth / 2 - 10}px`; // Center 20x20px crosshair
  crosshair.style.top = `${containerHeight / 2 - 10}px`;
  crosshair.style.display = "block";
  console.log("Crosshair positioned at container center:", {
    left: crosshair.style.left,
    top: crosshair.style.top
  });
};

// Handle mouse wheel zooming
const handleZoom = (event) => {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1; // Scroll down: zoom out, scroll up: zoom in
  zoomFactor = Math.max(1, Math.min(10, zoomFactor + zoomDelta)); // Limit zoom between 1x and 10x
  mapImage.style.transform = `scale(${zoomFactor})`;
  console.log("Zoom level:", zoomFactor);

  // Re-center the map on the current coordinates
  centerMapOn(currentPixel.x, currentPixel.y);
};

// Handle "Find Location" button click
const findLocation = () => {
  const yDeg = parseInt(document.getElementById("y-degrees").value) || 0;
  const yMin = parseInt(document.getElementById("y-minutes").value) || 0;
  const yDir = document.getElementById("y-direction").value;
  const xDeg = parseInt(document.getElementById("x-degrees").value) || 0;
  const xMin = parseInt(document.getElementById("x-minutes").value) || 0;
  const xDir = document.getElementById("x-direction").value;

  const logical = { yDeg, yMin, yDir, xDeg, xMin, xDir };
  console.log("Input coordinates:", logical);

  const pixel = convertLogicalToPixel(logical);
  console.log("Pixel position:", pixel);

  // Center map on the new coordinates
  centerMapOn(pixel.x, pixel.y);
};

// Initialize the map
const init = () => {
  mapImage.src = "map2.png";
  mapImage.onload = () => {
    console.log("Map image loaded successfully");
    setupCalibration();
  };
  mapImage.onerror = () => {
    console.error("Failed to load map2.png - check file path or name");
  };

  // Add mouse wheel event listener for zooming
  mapContainer.addEventListener("wheel", handleZoom);
};

// Run initialization
init();
findBtn.addEventListener("click", findLocation);