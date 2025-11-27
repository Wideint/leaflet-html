// @ts-check

// Make L.annulus optional
// import("leaflet.annulus").catch((error) => {
//   console.warn("Failed to import leaflet.annulus", error)
// });

import "leaflet.annulus";
import { layerConnected, tooltipConnected } from "./events.js";

export default class LAnnulus extends HTMLElement {
  static observedAttributes = [
    "lat-lng",
    "radius",
    "inner-radius"
  ];

  constructor() {
    super();
    this.layer = null;
    this.addEventListener(tooltipConnected, (ev) => {
      if (this.layer !== null) {
        this.layer.bindTooltip(ev.detail.tooltip);
      }
    });
  }

  connectedCallback() {
    const latLng = this.getAttribute("lat-lng");
    const radius = this.getAttribute("radius");
    const innerRadius = this.getAttribute("inner-radius");

    this.layer = L.Annulus(latLng, {
      radius: radius,
      innerRadius: innerRadius
    });
    const event = new CustomEvent(layerConnected, {
      cancelable: true,
      bubbles: true,
      detail: {
        layer: this.layer,
      },
    });
    this.dispatchEvent(event);
  }

  attributeChangedCallback(attName, _, newValue) {
    if (this.layer !== null) {
      if (attName === "lat-lng") {
        this.layer.setLatLng(JSON.parse(newValue));
      } else if (attName === "radius") {
        this.layer.setRadius(parseInt(newValue));
      } else if (attName === "inner-radius") {
        this.layer.setInnerRadius(parseInt(newValue));
      }
    }
  }
}