// @vitest-environment happy-dom
import { divIcon, DivIcon } from "leaflet";
import { it, expect } from "vitest";
import "./index.js";

it("should render a div icon", () => {
  const el = document.createElement("l-div-icon");
  el.innerHTML = "Hello, World!";
  el.setAttribute("icon-anchor","[50, 50]");
  el.setAttribute("icon-size", "[100, 100]")
  document.body.appendChild(el);
  expect(el.icon).toBeInstanceOf(DivIcon);
  expect(el.icon).toEqual(divIcon({ html: "Hello, World!" , iconAnchor: [50, 50], iconSize: [100, 100]}));
});

it("should assign null as iconSize when null passed", () => {
  const el = document.createElement("l-div-icon");
  el.innerHTML = "Hello, World!";
  el.setAttribute("icon-anchor","[50, 50]");
  el.setAttribute("icon-size","null");
  document.body.appendChild(el);
  expect(el.icon).toBeInstanceOf(DivIcon);
  expect(el.icon).toEqual(divIcon({ html: "Hello, World!" , iconAnchor: [50, 50], iconSize: null}));
});

it("should have a default iconSize if not given", () => {
  const el = document.createElement("l-div-icon");
  el.innerHTML = "Hello, World!";
  el.setAttribute("icon-anchor","[50, 50]");
  document.body.appendChild(el);
  expect(el.icon).toBeInstanceOf(DivIcon);
  expect(el.icon).toEqual(divIcon({ html: "Hello, World!" , iconAnchor: [50, 50]}));
  expect(el.icon.options).toHaveProperty('iconSize', [12, 12]);
});

it("should attach div icon to marker", () => {
  const icon = document.createElement("l-div-icon");
  const marker = document.createElement("l-marker");
  marker.setAttribute("lat-lng", "[0,0]");
  marker.appendChild(icon);
  document.body.appendChild(marker);

  expect(icon.icon).toEqual(marker.layer.getIcon());
});
