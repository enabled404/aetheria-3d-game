import * as THREE from 'three';

export class CollisionSystem {
  constructor(cellSize = 16) {
    this.cellSize = cellSize;
    this.grid = new Map(); // key -> Array of colliders
    this.colliders = [];
  }

  _getKey(cellX, cellZ) {
    return `${cellX},${cellZ}`;
  }

  addCollider(x, z, radius, height = 10, type = 'obstacle', metadata = null) {
    const col = {
      id: this.colliders.length,
      x,
      z,
      radius,
      radiusSq: radius * radius,
      height,
      type,
      metadata,
      active: true
    };
    this.colliders.push(col);

    // Register in grid cells covered by radius
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellZ = Math.floor((z - radius) / this.cellSize);
    const maxCellZ = Math.floor((z + radius) / this.cellSize);

    col.cells = [];
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const key = this._getKey(cx, cz);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(col);
        col.cells.push(key);
      }
    }

    return col;
  }

  removeCollider(col) {
    if (!col || !col.active) return;
    col.active = false;
    if (col.cells) {
      for (const key of col.cells) {
        const list = this.grid.get(key);
        if (list) {
          const idx = list.indexOf(col);
          if (idx !== -1) list.splice(idx, 1);
        }
      }
    }
  }

  updateCollider(col, newX, newZ) {
    if (!col || !col.active) return;
    // Unlink from current cells
    if (col.cells) {
      for (const key of col.cells) {
        const list = this.grid.get(key);
        if (list) {
          const idx = list.indexOf(col);
          if (idx !== -1) list.splice(idx, 1);
        }
      }
    }

    col.x = newX;
    col.z = newZ;

    const minCellX = Math.floor((newX - col.radius) / this.cellSize);
    const maxCellX = Math.floor((newX + col.radius) / this.cellSize);
    const minCellZ = Math.floor((newZ - col.radius) / this.cellSize);
    const maxCellZ = Math.floor((newZ + col.radius) / this.cellSize);

    col.cells = [];
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const key = this._getKey(cx, cz);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(col);
        col.cells.push(key);
      }
    }
  }

  getNearbyColliders(x, z, searchRadius = 5.0) {
    const minCellX = Math.floor((x - searchRadius) / this.cellSize);
    const maxCellX = Math.floor((x + searchRadius) / this.cellSize);
    const minCellZ = Math.floor((z - searchRadius) / this.cellSize);
    const maxCellZ = Math.floor((z + searchRadius) / this.cellSize);

    const nearby = [];
    const seen = new Set();

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const list = this.grid.get(this._getKey(cx, cz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const c = list[i];
            if (c.active && !seen.has(c.id)) {
              seen.add(c.id);
              nearby.push(c);
            }
          }
        }
      }
    }
    return nearby;
  }

  /**
   * Resolves circle collision for an entity against static & dynamic obstacles.
   * Modifies pos in place and cancels perpendicular inward velocity for smooth tangential sliding.
   */
  resolveCircleCollision(pos, entityRadius = 0.45, velocity = null, maxIterations = 4) {
    let anyCollided = false;
    for (let iter = 0; iter < maxIterations; iter++) {
      const nearby = this.getNearbyColliders(pos.x, pos.z, entityRadius + 4.0);
      let collided = false;

      for (let i = 0; i < nearby.length; i++) {
        const col = nearby[i];
        const dx = pos.x - col.x;
        const dz = pos.z - col.z;
        const distSq = dx * dx + dz * dz;
        const minDist = entityRadius + col.radius;

        if (distSq < minDist * minDist) {
          collided = true;
          anyCollided = true;
          const dist = Math.sqrt(distSq);

          if (dist > 0.0001) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;

            // Push entity out of obstacle with positive clearance
            pos.x += nx * (overlap + 0.002);
            pos.z += nz * (overlap + 0.002);

            // True tangential sliding: cancel inward normal velocity component
            if (velocity) {
              const dot = velocity.x * nx + velocity.z * nz;
              if (dot < 0) {
                velocity.x -= dot * nx;
                velocity.z -= dot * nz;
              }
            }
          } else {
            // Exactly on top of center - push in random angle
            const randAng = Math.random() * Math.PI * 2;
            pos.x += Math.cos(randAng) * minDist;
            pos.z += Math.sin(randAng) * minDist;
          }
        }
      }

      if (!collided) break;
    }
    return anyCollided;
  }

  /**
   * Fast line-of-sight / raycast check against colliders in 2D plane
   */
  raycast(startX, startZ, dirX, dirZ, maxDist) {
    const step = 0.8;
    let currDist = 0;
    let cx = startX;
    let cz = startZ;

    while (currDist < maxDist) {
      cx += dirX * step;
      cz += dirZ * step;
      currDist += step;

      const nearby = this.getNearbyColliders(cx, cz, 1.5);
      for (const col of nearby) {
        const dx = cx - col.x;
        const dz = cz - col.z;
        if (dx * dx + dz * dz <= col.radiusSq) {
          return { hit: true, distance: currDist, collider: col, point: { x: cx, z: cz } };
        }
      }
    }
    return { hit: false, distance: maxDist };
  }
}
