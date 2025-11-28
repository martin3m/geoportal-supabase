// -------------------------------------------------------------
// CONFIGURACIÓN SUPABASE
// -------------------------------------------------------------
const SUPABASE_URL = "https://vlflusjmxzxjpavmilmn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZmx1c2pteHp4anBhdm1pbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYyMjAsImV4cCI6MjA3OTE2MjIyMH0.5bJtVZJHLL7KV82AdLTL4iCoOObdVmHxsBEYI1w91W4";

// -------------------------------------------------------------
// VARIABLES GLOBALES
// -------------------------------------------------------------
let map;
let layerGroups = {};     // Almacena todas las capas activas
let radiosGroup = null;   // Radios del escenario
const layersEl = document.getElementById("layers");
const statusEl = document.getElementById("status");

// Panel atributos
const panelAtributos = document.getElementById("panelAtributos");
const tablaAtributos = document.getElementById("tablaAtributos");

// Sidebar
const sidebarEl = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebar");

// Botón cerrar panel
document.getElementById("cerrarPanel").onclick = () =>
  panelAtributos.classList.add("oculto");

// Toggle sidebar
if (toggleSidebarBtn) {
  toggleSidebarBtn.addEventListener("click", () => {
    sidebarEl.classList.toggle("collapsed");
  });
}

// -------------------------------------------------------------
// ESCENARIOS Y TABLAS
// -------------------------------------------------------------
const escenarios = {
  "Escenario 1": ["e1", "pl_1", "l1"],
  "Escenario 2": ["e2", "pl_2", "l2"],
  "Escenario 3": ["e3", "pl_3", "l3"],
  "Escenario 4": ["e4", "pl_4", "l4"],
  "Escenario 5": ["e5", "pl_5", "l5"]
};

// Radios verdaderos
const radiosEscenario = {
  e1: { rojo: 41, naranja: 84, azul: 68, verde: 123 },
  e2: { rojo: 16, naranja: 20, azul: 21, verde: 28 },
  e3: { rojo: 16, naranja: 14, azul: 20, verde: 19 },
  e4: { rojo: 40, naranja: 148, azul: 65, verde: 313 },
  e5: { rojo: 24, naranja: 37, azul: 37, verde: 57 }
};

// Dirección del viento
const DIRECCION_VIENTO_TXT = "SO";
const DIRECCION_VIENTO_GRADOS = 225;

// -------------------------------------------------------------
// INICIAR MAPA (SIN ZOOM RÁPIDO)
// -------------------------------------------------------------
function initMap() {
  map = L.map("map", {
    center: [18.1272, -94.4198],
    zoom: 17,
    zoomControl: true,
    inertia: false         // evita desplazamientos bruscos
  });

  const sat = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  ).addTo(map);

  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
  const dark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  );

  L.control.layers({ Satélite: sat, OSM: osm, Dark: dark }).addTo(map);
}

// -------------------------------------------------------------
// PANEL DE CAPAS
// -------------------------------------------------------------
function cargarCapas() {
  layersEl.innerHTML = "";

  for (const esc in escenarios) {
    const contenedor = document.createElement("div");
    contenedor.className = "escenario-group";

    const titulo = document.createElement("div");
    titulo.className = "layer-group-title";
    titulo.textContent = esc;

    const lista = document.createElement("div");
    lista.style.display = "none";

    // Abrir / cerrar grupo
    titulo.onclick = () => {
      lista.style.display = lista.style.display === "none" ? "block" : "none";
    };

    // Recorrer capas del escenario
    escenarios[esc].forEach((capa) => {
      const item = document.createElement("div");
      item.className = "layer-item";

      const icon = document.createElement("div");
      icon.className = "icon";
      icon.textContent = getIcon(capa);

      const texto = document.createElement("div");
      texto.className = "text";
      texto.innerHTML = `
        <div class="name">${capa}</div>
        <div class="meta">${getMeta(capa)}</div>
      `;

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.id = `chk_${capa}`;

      item.appendChild(icon);
      item.appendChild(texto);
      item.appendChild(chk);
      lista.appendChild(item);

      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") chk.checked = !chk.checked;
        manejarToggle(capa, chk.checked, esc);
      });

      chk.addEventListener("change", () =>
        manejarToggle(capa, chk.checked, esc)
      );
    });

    contenedor.appendChild(titulo);
    contenedor.appendChild(lista);
    layersEl.appendChild(contenedor);
  }
}

// -------------------------------------------------------------
// META / ICONOS
// -------------------------------------------------------------
function getMeta(c) {
  if (c.startsWith("e")) return "Radio de Afectación";
  if (c.startsWith("pl_")) return "Dirección del Viento";
  if (c.startsWith("l")) return "Localización";
  return "";
}

function getIcon(c) {
  if (c.startsWith("e")) return "🧩";
  if (c.startsWith("pl_")) return "🌀";
  if (c.startsWith("l")) return "📍";
  return "📄";
}

function getColor(c) {
  if (c.startsWith("e")) return "#f97316";   // naranja
  if (c.startsWith("pl_")) return "#22c55e"; // verde
  if (c.startsWith("l")) return "#60a5fa";   // azul
  return "#a855f7";
}

// -------------------------------------------------------------
// LIMPIAR MAPA COMPLETO
// -------------------------------------------------------------
function limpiarMapa() {
  map.eachLayer((layer) => {
    if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
  });

  layerGroups = {};
  radiosGroup = null;

  document.querySelectorAll("#layers input[type='checkbox']")
    .forEach((c) => (c.checked = false));

  panelAtributos.classList.add("oculto");

  setStatus("🧹 Mapa limpiado", "success");
}

document.getElementById("btnLimpiar").addEventListener("click", limpiarMapa);

// -------------------------------------------------------------
// MOSTRAR ATRIBUTOS
// -------------------------------------------------------------
function mostrarAtributos(props, capaNombre) {
  tablaAtributos.innerHTML = "";

  for (const k in props) {
    tablaAtributos.innerHTML += `
      <div class="attr-row">
        <div class="attr-key">${k}</div>
        <div class="attr-value">${props[k]}</div>
      </div>
    `;
  }

  // Radios del escenario
  const radios = radiosEscenario[capaNombre];
  if (radios) {
    tablaAtributos.innerHTML += `
      <hr class="attr-separator" />
      <div class="attr-block-title">Simbología del escenario</div>
    `;

    const colores = {
      rojo: "#ff0000",
      naranja: "#ffa500",
      azul: "#009dff",
      verde: "#00ff44"
    };

    for (const r in radios) {
      tablaAtributos.innerHTML += `
        <div class="attr-row legend-row">
          <div class="legend-dot" style="border-color:${colores[r]};"></div>
          <div class="attr-key">Radio ${r}</div>
          <div class="attr-value">${radios[r]} m</div>
        </div>
      `;
    }
  }

  panelAtributos.classList.remove("oculto");
}

// -------------------------------------------------------------
// CARGAR CAPA DESDE SUPABASE (SIN ZOOM AUTOMÁTICO)
// -------------------------------------------------------------
async function cargarCapa(tabla) {
  setStatus(`⏳ Cargando ${tabla}...`, "info");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_geojson`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ tabla })
  });

  if (!res.ok) {
    setStatus("❌ Error cargando capa", "error");
    return;
  }

  const geo = await res.json();
  const group = L.featureGroup();
  const color = getColor(tabla);

  L.geoJSON(geo, {
    style: {
      color,
      weight: 2,
      fillOpacity: 0
    },

    pointToLayer: (f, ll) =>
      L.circleMarker(ll, {
        radius: 8,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.9
      }),

    onEachFeature: (feature, layer) => {
      layer.on("click", () => {
        mostrarAtributos(feature.properties, tabla);
      });

      group.addLayer(layer);
    }
  });

  layerGroups[tabla] = group;
  group.addTo(map);

  setStatus(`✅ ${tabla} cargada`, "success");
}

// -------------------------------------------------------------
// DIBUJAR RADIOS
// -------------------------------------------------------------
function dibujarRadios(tablaLocalizacion, tablaEscenario) {
  if (radiosGroup) map.removeLayer(radiosGroup);

  const radios = radiosEscenario[tablaEscenario];
  if (!radios) return;

  const grupoLocalizacion = layerGroups[tablaLocalizacion];
  if (!grupoLocalizacion) return;

  const layerCentral = grupoLocalizacion.getLayers()[0];
  if (!layerCentral) return;

  const centro = layerCentral.getLatLng();
  radiosGroup = L.layerGroup();

  const colores = {
    rojo: "#ff0000",
    naranja: "#ffa500",
    azul: "#009dff",
    verde: "#00ff44"
  };

  for (const r in colores) {
    const circle = L.circle(centro, {
      radius: radios[r],
      color: colores[r],
      fill: false,
      weight: 4,
      opacity: 0.9
    });
    radiosGroup.addLayer(circle);
  }

  radiosGroup.addTo(map);
}

// -------------------------------------------------------------
// MANEJAR CLICK EN CAPAS
// -------------------------------------------------------------
async function manejarToggle(capa, activo, escenarioActual) {
  const chk = document.getElementById(`chk_${capa}`);
  const item = chk.closest(".layer-item");

  if (activo) {

    // Apagar escenarios distintos
    for (const esc in escenarios) {
      if (esc !== escenarioActual) {
        escenarios[esc].forEach((c) => {
          if (layerGroups[c]) {
            map.removeLayer(layerGroups[c]);
            delete layerGroups[c];
          }
          const chk2 = document.getElementById(`chk_${c}`);
          if (chk2) chk2.checked = false;
          chk2?.closest(".layer-item")?.classList.remove("active");
        });
      }
    }

    // Cargar capa
    await cargarCapa(capa);

    // Si es evento eX → cargar localización lX
    if (capa.startsWith("e")) {
      const num = capa.replace("e", "");
      const loc = "l" + num;

      if (!layerGroups[loc]) await cargarCapa(loc);

      const grupo = layerGroups[loc];
      if (grupo) {
        const layerCentral = grupo.getLayers()[0];
        if (layerCentral?.feature) {
          mostrarAtributos(layerCentral.feature.properties, capa);
          dibujarRadios(loc, capa);
        }
      }
    }

    item.classList.add("active");

  } else {

    if (layerGroups[capa]) {
      map.removeLayer(layerGroups[capa]);
      delete layerGroups[capa];
    }

    item.classList.remove("active");

    if (radiosGroup) {
      map.removeLayer(radiosGroup);
      radiosGroup = null;
    }
  }
}

// -------------------------------------------------------------
// STATUS BAR
// -------------------------------------------------------------
function setStatus(txt, type = "info") {
  statusEl.textContent = txt;
  statusEl.className = "status " + type;
}

// -------------------------------------------------------------
// INICIO
// -------------------------------------------------------------
initMap();
cargarCapas();
setStatus("Listo", "success");
