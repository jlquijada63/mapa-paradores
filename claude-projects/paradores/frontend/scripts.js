const COLORES = { normal: "#2f4858", seleccionado: "#8c1c2c", cercano: "#b8862b" };
const RADIO_KM = 150;

const ZONAS = {
  peninsula: [[35.2, -9.6], [43.9, 3.4]],
  canarias: [[27.6, -18.2], [29.4, -13.4]],
};

const mapa = L.map("mapa", { zoomControl: false, attributionControl: true });
L.control.zoom({ position: "bottomleft" }).addTo(mapa);
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 18,
  attribution: "Tiles &copy; Esri",
}).addTo(mapa);

const paradores = {};
const marcadores = {};
const contenido = document.getElementById("contenido");
const inicial = contenido.innerHTML;
let circulo = null;

function encuadre() {
  return window.innerWidth > 760 ? { paddingTopLeft: [40, 40], paddingBottomRight: [420, 40] } : { padding: [20, 20] };
}

function verZona(zona) {
  mapa.fitBounds(ZONAS[zona], encuadre());
  document.querySelectorAll(".zonas button").forEach((b) => b.classList.toggle("activa", b.dataset.zona === zona));
}

function pintar(id, tipo) {
  const radio = { normal: 5, cercano: 7, seleccionado: 10 }[tipo];
  marcadores[id].setStyle({ fillColor: COLORES[tipo], radius: radio, weight: tipo === "normal" ? 1.5 : 2.5 });
  if (tipo !== "normal") marcadores[id].bringToFront();
}

function limpiar() {
  for (const id in marcadores) pintar(id, "normal");
  if (circulo) circulo.remove();
  circulo = null;
}

function cerrar() {
  limpiar();
  contenido.innerHTML = inicial;
}

function mostrar(html) {
  contenido.innerHTML = html;
  contenido.style.animation = "none";
  contenido.offsetHeight;
  contenido.style.animation = "";
  contenido.scrollTop = 0;
}

async function seleccionar(id) {
  const respuesta = await fetch(`/api/paradores/${id}/cercanos?km=${RADIO_KM}`);
  const cercanos = await respuesta.json();
  const p = paradores[id];

  limpiar();
  circulo = L.circle([p.lat, p.lon], {
    radius: RADIO_KM * 1000,
    color: COLORES.seleccionado,
    weight: 1,
    dashArray: "4 6",
    fillColor: COLORES.seleccionado,
    fillOpacity: 0.04,
    interactive: false,
  }).addTo(mapa);
  cercanos.forEach((c) => pintar(c.id, "cercano"));
  pintar(id, "seleccionado");

  const lugar = p.nombre.replace(/^Parador de /, "");
  const lista = cercanos.length
    ? `<ul class="cercanos">${cercanos
        .map(
          (c) => `<li data-id="${c.id}">
            <span class="nombre">${c.nombre.replace(/^Parador de /, "")}</span>
            <span class="km">${c.distancia} km</span>
            <span class="barra"><i style="width:${(c.distancia / RADIO_KM) * 100}%"></i></span>
          </li>`
        )
        .join("")}</ul>`
    : `<p class="texto">No hay otros paradores en un radio de ${RADIO_KM} km.</p>`;

  mostrar(`
    <button class="cerrar">Cerrar</button>
    <span class="eyebrow">${p.comunidad}</span>
    <h2 class="titulo"><small>Parador de</small>${lugar}</h2>
    <div class="datos">
      <div><span>Provincia</span><strong>${p.provincia}</strong></div>
      <div><span>Coordenadas</span><strong>${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}</strong></div>
    </div>
    <a class="boton" href="${p.web}" target="_blank" rel="noopener">Visitar web oficial <span>&rarr;</span></a>
    <div class="seccion"><h3>Paradores cercanos</h3><span>${cercanos.length} a menos de ${RADIO_KM} km</span></div>
    ${lista}
  `);

  contenido.querySelector(".cerrar").addEventListener("click", cerrar);
  contenido.querySelectorAll(".cercanos li").forEach((li) => {
    li.addEventListener("click", () => seleccionar(Number(li.dataset.id)));
  });

  mapa.flyToBounds(circulo.getBounds(), { ...encuadre(), duration: 0.8 });
}

async function cargar() {
  const respuesta = await fetch("/api/paradores");
  const lista = await respuesta.json();
  document.getElementById("total").textContent = lista.length;
  for (const p of lista) {
    paradores[p.id] = p;
    marcadores[p.id] = L.circleMarker([p.lat, p.lon], {
      radius: 5,
      color: "#fff",
      weight: 1.5,
      fillColor: COLORES.normal,
      fillOpacity: 1,
    })
      .bindTooltip(p.nombre, { direction: "top", offset: [0, -6] })
      .on("click", () => seleccionar(p.id))
      .addTo(mapa);
  }
}

document.querySelectorAll(".zonas button").forEach((b) => b.addEventListener("click", () => verZona(b.dataset.zona)));
const busqueda = document.getElementById("busqueda");
const resultados = document.getElementById("resultados");
let encontrados = [];
let activo = 0;

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function pintarResultados() {
  resultados.innerHTML = encontrados.length
    ? encontrados
        .map(
          (p, i) => `<li data-id="${p.id}" class="${i === activo ? "activo" : ""}">
            <span class="nombre">${p.nombre}</span>
            <span class="zona">${p.provincia}, ${p.comunidad}</span>
          </li>`
        )
        .join("")
    : `<li class="sin">Sin resultados</li>`;
  resultados.hidden = false;
}

function elegir(id) {
  busqueda.value = "";
  resultados.hidden = true;
  busqueda.blur();
  seleccionar(id);
}

busqueda.addEventListener("input", () => {
  const texto = normalizar(busqueda.value.trim());
  if (!texto) {
    resultados.hidden = true;
    return;
  }
  encontrados = Object.values(paradores)
    .filter((p) => normalizar(`${p.nombre} ${p.provincia} ${p.comunidad}`).includes(texto))
    .slice(0, 8);
  activo = 0;
  pintarResultados();
});

busqueda.addEventListener("keydown", (e) => {
  if (resultados.hidden || !encontrados.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    activo = (activo + (e.key === "ArrowDown" ? 1 : -1) + encontrados.length) % encontrados.length;
    pintarResultados();
  } else if (e.key === "Enter") {
    elegir(encontrados[activo].id);
  } else if (e.key === "Escape") {
    resultados.hidden = true;
  }
});

resultados.addEventListener("mousedown", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li) {
    e.preventDefault();
    elegir(Number(li.dataset.id));
  }
});

busqueda.addEventListener("blur", () => (resultados.hidden = true));

verZona("peninsula");
cargar();
