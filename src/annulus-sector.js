import { Circle } from "leaflet";

const DEG_TO_RAD = Math.PI / 180;

// make sure 0 degrees is up (North) and convert to radians.
function fixAngle(angle) {
  return (angle - 90) * DEG_TO_RAD;
}

// rotate point [x + r, y+r] around [x, y] by `angle` radians.
function rotated(p, angle, r) {
  return p.add(L.point(Math.cos(angle), Math.sin(angle)).multiplyBy(r));
}

L.Point.prototype.rotated = function (angle, r) {
  return rotated(this, angle, r);
};

const sectorMixin = () => ({
  stopAngle() {
    if (this.options.startAngle < this.options.stopAngle) {
      return fixAngle(this.options.stopAngle);
    } else {
      return fixAngle(this.options.startAngle);
    }
  },

  startAngle() {
    if (this.options.startAngle < this.options.stopAngle) {
      return fixAngle(this.options.startAngle);
    } else {
      return fixAngle(this.options.stopAngle);
    }
  },

  _isValidSector() {
    if (isNaN(this.options.startAngle)) {
      throw new Error("Start angle cannot be NaN");
    }
    if (isNaN(this.options.stopAngle)) {
      throw new Error("Stop angle cannot be NaN");
    }
    if (this.options.startAngle >= this.options.stopAngle) {
      throw new Error("Stop angle must be greater than the start angle");
    }
  },
});

const annularMixin = () => ({
  /* Override Circle _project */
  _project() {
    const map = this._map,
      crs = map.options.crs;
    if (crs.distance === L.CRS.Earth.distance) {
      const outer = this._radiusCalculation(this._mRadius);
      this._point = outer.point;
      this._radius = outer.radius;
      this._radiusY = outer.radiusY;
      const inner = this._radiusCalculation(this.options.innerRadius);
      this._innerPoint = inner.point;
      this._innerRadius = inner.radius;
      this._innerRadiusY = inner.radiusY;
    } else {
      const latlng2 = crs.unproject(
        crs.project(this._latlng).subtract([this._mRadius, 0]),
      );
      this._point = map.latLngToLayerPoint(this._latlng);
      this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
      const latlng3 = crs.unproject(
        crs.project(this._latlng).subtract([this.options.innerRadius, 0]),
      );
      this._innerRadius = this._point.x - map.latLngToLayerPoint(latlng3).x;
    }
    this._updateBounds();
  },

  _radiusCalculation(radius) {
    const lng = this._latlng.lng,
      lat = this._latlng.lat,
      map = this._map;
    const d = Math.PI / 180,
      latR = radius / L.CRS.Earth.R / d,
      top = map.project([lat + latR, lng]),
      bottom = map.project([lat - latR, lng]),
      p = top.add(bottom).divideBy(2),
      lat2 = map.unproject(p).lat;
    let lngR =
      Math.acos(
        (Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
          (Math.cos(lat * d) * Math.cos(lat2 * d)),
      ) / d;
    if (isNaN(lngR) || lngR === 0) {
      lngR = latR / Math.cos((Math.PI / 180) * lat); // Fallback for edge case, #2425
    }
    return {
      point: p.subtract(map.getPixelOrigin()),
      radius: isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x,
      radiusY: p.y - top.y,
    };
  },

  _isValidAnnulus() {
    if (isNaN(this.options.innerRadius)) {
      throw new Error("Inner radius cannot be NaN");
    }
    if (this.options.innerRadius >= this.options.radius) {
      throw new Error("Outer radius must be greater than the inner radius");
    }
  },
});

export var AnnulusSector = (L.AnnulusSector = Circle.extend({
  options: {
    stroke: false,
    startAngle: 0,
    stopAngle: 359.9999,
    innerRadius: 0,
  },

  initialize(latlng, options, legacyOptions) {
    L.Circle.prototype.initialize.call(this, latlng, options, legacyOptions);
    Object.assign(this, sectorMixin());
    Object.assign(this, annularMixin());
    this._isValidAnnulus();
    this._isValidSector();
  },

  _updatePath() {
    this._renderer._updateAnnulusSector(this);
  },
}));

export var Annulus = (L.Annulus = Circle.extend({
  options: {
    stroke: false,
    innerRadius: 0,
  },

  initialize(latlng, options, legacyOptions) {
    L.Circle.prototype.initialize.call(this, latlng, options, legacyOptions);
    Object.assign(this, annularMixin());
    this._isValidAnnulus();
  },

  _updatePath() {
    this._renderer._updateAnnulus(this);
  },
}));

export var DiskSector = (L.DiskSector = Circle.extend({
  options: {
    stroke: false,
    startAngle: 0,
    stopAngle: 359.9999,
  },

  initialize(latlng, options, legacyOptions) {
    L.Circle.prototype.initialize.call(this, latlng, options, legacyOptions);
    Object.assign(this, sectorMixin());
    this._isValidSector();
  },

  _updatePath() {
    this._renderer._updateDiskSector(this);
  },
}));

L.annulussector = function (latlng, options) {
  return new L.AnnulusSector(latlng, options);
};

L.annulus = function (latlng, options) {
  return new L.Annulus(latlng, options);
};

L.disksector = function (latlng, options) {
  return new L.DiskSector(latlng, options);
};

export function annulussector(latlng, options) {
  return new AnnulusSector(latlng, options);
}

export function annulus(latlng, options) {
  return new Annulus(latlng, options);
}

export function disksector(latlng, options) {
  return new DiskSector(latlng, options);
}

L.SVG.include({
  _updateAnnulus(layer) {
    if (layer._empty()) {
      return this._setPath(layer, "M0 0");
    }
    const p = layer._map.latLngToLayerPoint(layer._latlng),
      r = Math.max(Math.round(layer._radius), 1),
      r2 = Math.max(Math.round(layer._radiusY), 1) || r;
    const innerP = layer._innerPoint || p,
      innerR = Math.max(Math.round(layer._innerRadius), 1),
      innerR2 = Math.max(Math.round(layer._innerRadiusY), 1) || innerR;

    /*
     * This figure is drawn using two pairs of arcs :
     * the first pair draws the outer circle, starting from the bottom half,
     * the second pair then proceed with the inner circle.
     */
    const d = `M${p.x - r},${p.y}
                      a${r},${r2},0,1,0,${r * 2},0
                      a${r},${r2},0,1,0 ${-r * 2},0
                      M${innerP.x - innerR},${innerP.y}
                      a${innerR},${innerR2},0,1,0,${innerR * 2},0
                      a${innerR},${innerR2},0,1,0 ${-innerR * 2},0`;

    this._setPath(layer, d);
  },

  _updateDiskSector(layer) {
    if (layer._empty()) {
      return this._setPath(layer, "M0 0");
    }
    const p = layer._map.latLngToLayerPoint(layer._latlng),
      r = Math.max(Math.round(layer._radius), 1),
      r2 = Math.max(Math.round(layer._radiusY), 1) || r;
    const start = p.rotated(layer.startAngle(), r),
      end = p.rotated(layer.stopAngle(), r);
    const largeArc =
      layer.options.stopAngle - layer.options.startAngle >= 180 ? "1" : "0";
    /*
     * Start from the disk's perimeter at the opening angle, draw the arc
     * until the stop angle then draw the radius.
     */
    const d = `M${start.x},${start.y}
                      A${r},${r2},0,${largeArc},1,${end.x},${end.y}
                      L${p.x},${p.y}
                      Z`;
    this._setPath(layer, d);
  },

  _updateAnnulusSector(layer) {
    if (layer._empty()) {
      return this._setPath(layer, "M0 0");
    }
    const p = layer._map.latLngToLayerPoint(layer._latlng),
      r = Math.max(Math.round(layer._radius), 1),
      r2 = Math.max(Math.round(layer._radiusY), 1) || r;
    const innerR = Math.max(Math.round(layer._innerRadius), 1),
      innerR2 = Math.max(Math.round(layer._innerRadiusY), 1) || innerR;
    const start = p.rotated(layer.startAngle(), r),
      end = p.rotated(layer.stopAngle(), r),
      innerStart = p.rotated(layer.startAngle(), innerR),
      innerEnd = p.rotated(layer.stopAngle(), innerR);
    const largeArc =
      layer.options.stopAngle - layer.options.startAngle >= 180 ? "1" : "0";
    /*
     * Start from the annulus's perimeter at the opening angle, draw the arc
     * until the stop angle, draw the line representing R - r then draw
     * the closing arc following the inner circle.
     */
    const d = `M${start.x},${start.y}
                      A${r},${r2},0,${largeArc},1,${end.x},${end.y}
                      L${innerEnd.x},${innerEnd.y}
                      A${innerR},${innerR2},0,${largeArc},0,${innerStart.x},${innerStart.y}
                      Z`;
    this._setPath(layer, d);
  },
});
