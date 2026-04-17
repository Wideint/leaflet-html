// @ts-check

import "leaflet.heatmap";
import { layerConnected, tooltipConnected } from "./events.js";
import LLayer from "./l-layer.js";
import { stamp } from "leaflet";
import { json, option, parse } from "./parse.js";

class LHeatLayer extends LLayer {
  static observedAttributes = [
    "min-opacity",
    "max-zoom",
    "radius",
    "blur",
    "max",
  ];

  constructor() {
    super();
    this.layer = null;
  }

  connectedCallback() {
    const latLngs = parse(option("lat-lngs", json()), this);
    const options = {
      minOpacity: parseFloat(this.getAttribute("min-opacity") || "0.05"),
      maxZoom: parseInt(this.getAttribute("max-zoom") || "18"),
      radius: parseInt(this.getAttribute("radius") || "25"),
      blur: parseInt(this.getAttribute("blur") || "15"),
      max: parseFloat(this.getAttribute("max") || "1.0"),
    };
    this.layer = L.heatLayer(latLngs, options);
    this.setAttribute("leaflet-id", stamp(this.layer));
    const event = new CustomEvent(layerConnected, {
      cancelable: true,
      bubbles: true,
      detail: {
        layer: this.layer,
      },
    });
    this.dispatchEvent(event);
  }
}

export default LHeatLayer;