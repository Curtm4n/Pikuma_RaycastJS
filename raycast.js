const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.25;

class Map {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1],
            [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 1],
            [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }
    hasWallAt(x, y) {
		if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
			return true;
		}
		var gridX = Math.floor(x / TILE_SIZE);
		var gridY = Math.floor(y / TILE_SIZE);
		return this.grid[gridY][gridX];
    }
    render() {
        for (var i = 0; i < MAP_NUM_ROWS; i++) {
            for (var j = 0; j < MAP_NUM_COLS; j++) {
                var tileX = j * TILE_SIZE;
                var tileY = i * TILE_SIZE;
                var tileColor = this.grid[i][j] != 0 ? "#222" : "#fff";
                stroke("#222");
                fill(tileColor);
                rect(
					MINIMAP_SCALE_FACTOR * tileX,
					MINIMAP_SCALE_FACTOR * tileY,
					MINIMAP_SCALE_FACTOR * TILE_SIZE,
					MINIMAP_SCALE_FACTOR * TILE_SIZE
				);
            }
        }
    }
}

class Player {
	constructor() {
		this.x = WINDOW_WIDTH / 2;
		this.y = WINDOW_HEIGHT / 2;
		this.radius = 2.5;
		this.turnDirection = 0; // -1 if left, +1 if right
		this.walkDirection = 0; // -1 if back, +1 if front
		this.sideDirection = 0; // +1 if left, -1 if right
		this.rotationAngle = Math.PI / 2;
		this.moveSpeed = 2.0;
		this.rotationSpeed = 2 * (Math.PI / 180);
	}
	update() {
		this.rotationAngle += this.turnDirection * this.rotationSpeed;

		var moveStep;
		var newPlayerX;
		var newPlayerY;

		if (this.walkDirection != 0) {
			moveStep = this.walkDirection * this.moveSpeed;
			newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
			newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;

			if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
				this.x = newPlayerX;
				this.y = newPlayerY;
			}
		}

		if (this.sideDirection != 0) {
			moveStep = this.sideDirection * this.moveSpeed;
			newPlayerX = this.x + Math.sin(this.rotationAngle) * moveStep;
			newPlayerY = this.y - Math.cos(this.rotationAngle) * moveStep;

			if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
				this.x = newPlayerX;
				this.y = newPlayerY;
			}
		}
	}
	render() {
		noStroke();
		fill("blue");
		circle(
			MINIMAP_SCALE_FACTOR * this.x,
			MINIMAP_SCALE_FACTOR * this.y,
			MINIMAP_SCALE_FACTOR * this.radius
		);
		stroke("blue");
		line(
			MINIMAP_SCALE_FACTOR * this.x,
			MINIMAP_SCALE_FACTOR * this.y,
			MINIMAP_SCALE_FACTOR * (this.x + Math.cos(this.rotationAngle) * 15),
			MINIMAP_SCALE_FACTOR * (this.y + Math.sin(this.rotationAngle) * 15)
		);
	}
}

class Ray {
	constructor(rayAngle) {
		this.rayAngle = normalizeAngle(rayAngle);
		this.wallHitX = 0;
		this.wallHitY = 0;
		this.distance = 0;
		this.wasHitVertical = false;
		this.color = 4;

		this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
		this.isRayFacingUp = !this.isRayFacingDown;

		this.isRayFacingRight = this.rayAngle <
			Math.PI / 2 || this.rayAngle > 1.5 * Math.PI;
		this.isRayFacingLeft = !this.isRayFacingRight;
	}
	cast() {
		var xintercept, yintercept;
		var xstep, ystep;

		////////////////////////////////////////////
		// HORIZONTAL RAY-GRID INTERSECTION CODE
		////////////////////////////////////////////
		var foundHorzWallHit = false;

		// Find the y-coordinate of the closest horizontal grid intersection
		yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
		yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

		// Find the x-coordinate of the closest horizontal grid intersection
		xintercept = player.x + (yintercept - player.y)
			/ Math.tan(this.rayAngle);

		// Calculate the increment xstep and ystep
		ystep = TILE_SIZE;
		ystep *= this.isRayFacingUp ? -1 : 1;

		xstep = TILE_SIZE / Math.tan(this.rayAngle);
		xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
		xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

		var nextHorzTouchX = xintercept;
		var nextHorzTouchY = yintercept;

		if (this.isRayFacingUp)
			nextHorzTouchY--;

		var colorHorz;

		// Increment xstep and ystep until we found a wall
		while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH &&
			nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
			if ((colorHorz = grid.hasWallAt(nextHorzTouchX, nextHorzTouchY))) {
				foundHorzWallHit = true;
				break;
			} else {
				nextHorzTouchX += xstep;
				nextHorzTouchY += ystep;
			}
		}

		////////////////////////////////////////////
		// VERTICAL RAY-GRID INTERSECTION CODE
		////////////////////////////////////////////
		var foundVertWallHit = false;

		// Find the x-coordinate of the closest vertical grid intersection
		xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
		xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

		// Find the y-coordinate of the closest vertical grid intersection
		yintercept = player.y + (xintercept - player.x)
			* Math.tan(this.rayAngle);

		// Calculate the increment xstep and ystep
		xstep = TILE_SIZE;
		xstep *= this.isRayFacingLeft ? -1 : 1;

		ystep = TILE_SIZE * Math.tan(this.rayAngle);
		ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
		ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

		var nextVertTouchX = xintercept;
		var nextVertTouchY = yintercept;

		if (this.isRayFacingLeft)
			nextVertTouchX--;

		var colorVert;

		// Increment xstep and ystep until we found a wall
		while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH &&
			nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
			if ((colorVert = grid.hasWallAt(nextVertTouchX, nextVertTouchY))) {
				foundVertWallHit = true;
				break;
			} else {
				nextVertTouchX += xstep;
				nextVertTouchY += ystep;
			}
		}

		// Calculate both horizontal and vertical distances
		// and choose the smallest value

		if (nextVertTouchX % 32 != 0)
			nextVertTouchX++;
		if (nextHorzTouchY % 32 != 0)
			nextHorzTouchY++;

		var distHorz = Math.sqrt(Math.pow(player.x - nextHorzTouchX, 2) +
			Math.pow(player.y - nextHorzTouchY, 2));
		var distVert = Math.sqrt(Math.pow(player.x - nextVertTouchX, 2) +
			Math.pow(player.y - nextVertTouchY, 2));

		// Store the X, Y and distance value of the closest wall hit
		if (distVert < distHorz) {
			this.wallHitX = nextVertTouchX;
			this.wallHitY = nextVertTouchY;
			this.distance = distVert;
			this.wasHitVertical = true;
			this.color = colorVert;
		} else {
			this.wallHitX = nextHorzTouchX;
			this.wallHitY = nextHorzTouchY;
			this.distance = distHorz;
			this.wasHitVertical = false;
			this.color = colorHorz;
		}
	}
	render() {
		stroke("rgba(255, 0, 0, 0.3)");
		line(
			MINIMAP_SCALE_FACTOR * player.x,
			MINIMAP_SCALE_FACTOR * player.y,
			MINIMAP_SCALE_FACTOR * this.wallHitX,
			MINIMAP_SCALE_FACTOR * this.wallHitY
		);
	}
}

var grid = new Map();
var player = new Player();
var rays = [];

function keyPressed() {
	if (keyCode == UP_ARROW) {
		player.walkDirection = +1;
	} else if (keyCode == DOWN_ARROW) {
		player.walkDirection = -1;
	} else if (keyCode == RIGHT_ARROW) {
		player.turnDirection = +1;
	} else if (keyCode == LEFT_ARROW) {
		player.turnDirection = -1;
	} else if (keyCode == 65) {
		player.sideDirection = +1;
	} else if (keyCode == 68) {
		player.sideDirection = -1;
	}
}

function keyReleased() {
	if (keyCode == UP_ARROW) {
		player.walkDirection = 0;
	} else if (keyCode == DOWN_ARROW) {
		player.walkDirection = 0;
	} else if (keyCode == RIGHT_ARROW) {
		player.turnDirection = 0;
	} else if (keyCode == LEFT_ARROW) {
		player.turnDirection = 0;
	} else if (keyCode == 65) {
		player.sideDirection = 0;
	} else if (keyCode == 68) {
		player.sideDirection = 0;
	}
}

function castAllRays() {
	// start first ray substracting half of the FOV
	var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);

	rays = [];

	// loop all columns casting the rays
	for (i = 0; i < NUM_RAYS; i++) {
		var ray = new Ray(rayAngle);
		ray.cast();
		rays.push(ray);

		rayAngle += FOV_ANGLE / NUM_RAYS;
	}
}

function renderCeiling() {
	noStroke();
	fill('#414141');
	rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT / 2);
}

function renderFloor() {
	noStroke();
	fill('#818181');
	rect(0, WINDOW_HEIGHT / 2, WINDOW_WIDTH, WINDOW_HEIGHT);
}

function render3DProjectedWalls() {
	renderCeiling();
	renderFloor();

	// loop every ray in the array of rays
	for (var i = 0; i < NUM_RAYS; i++) {
		var ray = rays[i];

		var correctWallDistance = ray.distance *
			Math.cos(ray.rayAngle - player.rotationAngle);

		// calculate the distance to the projection plane
		var DistanceProjectionPlane = (WINDOW_WIDTH / 2) /
			Math.tan(FOV_ANGLE / 2);

		// projected wall height
		var wallStripHeight = (TILE_SIZE / correctWallDistance) *
			DistanceProjectionPlane;

		// compute the transparency based on the wall distance
		var alpha = 1.0; //300 / correctWallDistance;

		var r = 0;
		var g = 0;
		var b = 0;

		if (ray.color == 1) {
			r = ray.wasHitVertical ? 255 : 180;
		} else if (ray.color == 2) {
			g = ray.wasHitVertical ? 255 : 180;
		} else if (ray.color == 3) {
			b = ray.wasHitVertical ? 255 : 180;
		}

		// render a rectangle with the calculate wall height
		fill("rgba(" + r + ", " + g + ", " + b + ", "
			+ alpha + ")");
		noStroke();
		rect(
			i * WALL_STRIP_WIDTH,
			(WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
			WALL_STRIP_WIDTH,
			wallStripHeight

		);

	}
}

function normalizeAngle(angle) {
	angle = angle % (2 * Math.PI);
	if (angle < 0) {
		angle += 2 * Math.PI;
	}
	return angle;
}

function setup() {
    createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);

}

function update() {
	player.update();
	castAllRays();
}

function draw() {
    background("#111");
    update();

	render3DProjectedWalls();
    grid.render();
    for (ray of rays) {
		ray.render();
    }
    player.render();
}
