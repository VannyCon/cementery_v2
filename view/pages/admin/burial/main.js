// Cemetery Management System with Enhanced MapLibre GL Integration
class CemeteryManager {
  constructor() {
    this.authManager = new AuthManager();
    this.cemeteryAPI = this.authManager.API_CONFIG.baseURL + "cemetery.php";

    // Initialize drawing system
    this.draw = null;
    this.currentDrawingMode = null;

    // Initialize modal manager (will be set after DOM loads)
    this.modalManager = null;

    // Initialize road manager (will be set after DOM loads)
    this.roadManager = null;

    // Initialize layer manager (will be set after DOM loads)
    this.layerManager = null;

    this.initializeMap();
    this.initializeUI();
    this.initializeModalManager();
    this.initializeRoadManager();
    this.initializeLayerManager();
    // Don't load data immediately - wait for map to be ready
  }

  initializeMap() {
    // Satellite style configuration
    const satelliteStyle = {
      version: 8,
      sources: {
        "esri-imagery": {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 18, // <— IMPORTANT: set to the highest zoom Esri provides
        },
      },
      layers: [
        {
          id: "esri-imagery",
          type: "raster",
          source: "esri-imagery",
          minzoom: 0,
          maxzoom: 24, // <— allow MapLibre to keep showing tiles up to 24
        },
      ],
    };

    // Initialize MapLibre GL map
    this.map = new maplibregl.Map({
      container: "map",
      style: satelliteStyle,
      center: [123.421264, 10.887593],
      zoom: 19,
      minZoom: 0,
      maxZoom: 24,
      canvasContextAttributes: { antialias: true },
    });

    // Wait for map to load before adding controls and setting up interactions
    this.map.on("load", () => {
      this.loadData();
    });
    try {
      if (typeof LocationTracker !== "undefined") {
        this.locationTracker = new LocationTracker(this);
      } else {
        console.warn("LocationTracker is not loaded");
      }
    } catch (e) {
      console.warn("Failed to initialize LocationTracker", e);
    }
    // Wire Follow button to toggle follow mode on the LocationTracker
    const followBtn = document.getElementById("btnFollowMe");
    if (followBtn) {
      followBtn.addEventListener("click", async () => {
        if (!this.locationTracker) return;
        const enabled = await this.locationTracker.toggleFollowMode();
        if (enabled) {
          followBtn.classList.remove("btn-outline-primary");
          followBtn.classList.add("btn-primary");
          followBtn.innerHTML =
            '<i class="fas fa-crosshairs"></i><span class="d-none d-sm-inline ms-1">Following</span>';
          if (typeof CustomToast !== "undefined") {
            CustomToast.show(
              "success",
              "Map will follow and rotate with your movement"
            );
          }
        } else {
          followBtn.classList.remove("btn-primary");
          followBtn.classList.add("btn-outline-primary");
          followBtn.innerHTML =
            '<i class="fas fa-location-arrow"></i><span class="d-none d-sm-inline ms-1">Follow</span>';
          if (typeof CustomToast !== "undefined") {
            CustomToast.show("success", "Follow stopped");
          }
        }
      });
    }

    // Initialize feature collections for different data types
    this.features = {
      cemeteries: [],
      roads: [],
      gravePlots: [],
      annotations: [],
      routes: [],
    };

    // Drawing state (now handled by Mapbox GL Draw)
    // this.drawingMode, this.currentDrawing, this.drawingSource removed

    // Routing state
    this.routingMode = null;
    this.startMarker = null;
    this.endMarker = null;
    this.startNodeId = null;
    this.endNodeId = null;

    // Graph structures for routing
    this.graphNodes = [];
    this.graphAdj = new Map();
    this.nodeKeyToId = new Map();

    // Snapping tolerance
    this.SNAP_TOLERANCE_METERS = 5;

    // Initialize tab state
    window.tabs = window.tabs || "annotations"; // Default to annotations tab

    // Event handlers
    this.setupMapEventHandlers();
  }

  initializeDrawControls() {
    // Configure Mapbox GL Draw for MapLibre GL compatibility
    MapboxDraw.constants.classes.CANVAS = "maplibregl-canvas";
    MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
    MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
    MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
    MapboxDraw.constants.classes.ATTRIBUTION = "maplibregl-ctrl-attrib";

    // Custom styles for drawing
    const drawStyles = [
      // Polygon fill inactive
      {
        id: "gl-draw-polygon-fill-inactive",
        type: "fill",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "Polygon"],
          ["!=", "mode", "static"],
        ],
        paint: {
          "fill-color": "#3bb2d0",
          "fill-outline-color": "#3bb2d0",
          "fill-opacity": 0.1,
        },
      },
      // Polygon fill active
      {
        id: "gl-draw-polygon-fill-active",
        type: "fill",
        filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
        paint: {
          "fill-color": "#fbb03b",
          "fill-outline-color": "#fbb03b",
          "fill-opacity": 0.1,
        },
      },
      // Line inactive
      {
        id: "gl-draw-line-inactive",
        type: "line",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "LineString"],
          ["!=", "mode", "static"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#3bb2d0",
          "line-width": 2,
        },
      },
      // Line active
      {
        id: "gl-draw-line-active",
        type: "line",
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["==", "active", "true"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#fbb03b",
          "line-dasharray": [0.2, 2],
          "line-width": 2,
        },
      },
      // Vertex points
      {
        id: "gl-draw-polygon-and-line-vertex-stroke-inactive",
        type: "circle",
        filter: [
          "all",
          ["==", "meta", "vertex"],
          ["==", "$type", "Point"],
          ["!=", "mode", "static"],
        ],
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
        },
      },
      {
        id: "gl-draw-polygon-and-line-vertex-inactive",
        type: "circle",
        filter: [
          "all",
          ["==", "meta", "vertex"],
          ["==", "$type", "Point"],
          ["!=", "mode", "static"],
        ],
        paint: {
          "circle-radius": 3,
          "circle-color": "#fbb03b",
        },
      },
    ];

    // Initialize Mapbox GL Draw
    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        trash: true,
      },
      styles: drawStyles,
    });

    // Add draw control to map
    this.map.addControl(this.draw, "top-left");

    // Set up draw event listeners
    this.map.on("draw.create", (e) => this.handleDrawCreate(e));
    this.map.on("draw.update", (e) => this.handleDrawUpdate(e));
    this.map.on("draw.delete", (e) => this.handleDrawDelete(e));
    this.map.on("draw.selectionchange", (e) =>
      this.handleDrawSelectionChange(e)
    );

    console.log("Mapbox GL Draw initialized successfully");
  }

  // Mapbox GL Draw event handlers
  handleDrawCreate(e) {
    console.log("Draw create event:", e);
    const features = e.features;

    features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        this.handleAnnotationCreate(feature);
      } else if (feature.geometry.type === "LineString") {
        this.handleRoadCreate(feature);
      }
    });
  }

  handleDrawUpdate(e) {
    console.log("Draw update event:", e);
    const features = e.features;

    features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        this.handleAnnotationUpdate(feature);
      } else if (feature.geometry.type === "LineString") {
        this.handleRoadUpdate(feature);
      }
    });
  }

  handleDrawDelete(e) {
    console.log("Draw delete event:", e);
    const features = e.features;

    features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        this.handleAnnotationDelete(feature);
      } else if (feature.geometry.type === "LineString") {
        this.handleRoadDelete(feature);
      }
    });
  }

  handleDrawSelectionChange(e) {
    console.log("Draw selection change event:", e);
    if (e.features.length > 0) {
      const feature = e.features[0];
      // if (feature.geometry.type === 'Polygon') {
      //     this.showAreaCalculation(feature);
      // }
    } else {
      // this.hideAreaCalculation();
    }
  }

  // Feature-specific handlers
  handleAnnotationCreate(feature) {
    console.log("Creating annotation:", feature);
    if (this.layerManager) {
      this.layerManager.handleAnnotationCreate(feature);
    } else {
      console.warn("LayerManager not initialized yet");
    }
  }

  handleRoadCreate(feature) {
    console.log("Creating road:", feature);
    // Show road modal for details
    if (this.roadManager) {
      this.roadManager.handleRoadCreate(feature);
    } else {
      console.warn("RoadManager not initialized yet");
    }
  }

  handleAnnotationUpdate(feature) {
    console.log("Updating annotation:", feature);
    if (this.layerManager) {
      this.layerManager.handleAnnotationUpdate(feature);
    }
  }

  handleRoadUpdate(feature) {
    console.log("Updating road:", feature);
    if (this.roadManager) {
      this.roadManager.handleRoadUpdate(feature);
    }
  }

  handleAnnotationDelete(feature) {
    console.log("Deleting annotation:", feature);
    if (this.layerManager) {
      this.layerManager.handleAnnotationDelete(feature);
    }
  }

  handleRoadDelete(feature) {
    console.log("Deleting road:", feature);
    if (this.roadManager) {
      this.roadManager.handleRoadDelete(feature);
    }
  }

  showAreaCalculation(feature) {
    if (this.layerManager) {
      this.layerManager.showAreaCalculation(feature);
    }
  }

  hideAreaCalculation() {
    if (this.layerManager) {
      this.layerManager.hideAreaCalculation();
    }
  }

  // Start drawing mode with Mapbox GL Draw
  startDrawMode(mode) {
    if (!this.draw) {
      console.error("Mapbox GL Draw not initialized");
      return;
    }

    console.log("Starting draw mode:", mode);

    // Change the draw mode
    this.draw.changeMode(mode);

    // Show instructions based on mode
    if (mode === "line_string") {
      this.showToast(
        "Click to start drawing a road. Double-click to finish.",
        "info"
      );
    } else if (mode === "polygon") {
      this.showToast(
        "Click to start drawing a polygon. Double-click to finish.",
        "info"
      );
    }
  }

  // Stop drawing mode
  stopDrawMode() {
    if (!this.draw) return;

    this.draw.changeMode("simple_select");
    this.currentDrawingMode = null;
  }

  // Show toast notification
  showToast(message, type = "info") {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

    // Add to toast container
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);

    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast element after it's hidden
    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
    });
  }

  // Clear the currently drawn feature from Mapbox GL Draw
  clearDrawnFeature() {
    if (this.draw) {
      // Get all features and remove them
      const features = this.draw.getAll();
      if (features.features.length > 0) {
        // Remove all features
        features.features.forEach((feature) => {
          this.draw.delete(feature.id);
        });
      }
    }

    // Clear stored geometry
    this.currentRoadGeometry = null;
    this.currentAnnotationGeometry = null;
    this.pendingRoad = null;
    this.pendingAnnotation = null;

    // Hide area calculation
    this.hideAreaCalculation();
  }

  setupMapEventHandlers() {
    // Handle map clicks for drawing and routing
    this.map.on("click", (e) => {
      const lngLat = e.lngLat;
      const latlng = { lat: lngLat.lat, lng: lngLat.lng };

      // If user location is active, automatically use it as start and clicked point as destination
      if (this.isUserLocationActive && this.graphNodes.length > 0) {
        const snapped = this.findNearestGraphNode(latlng);
        if (!snapped) {
          this.setRouteInfo("No nearby road point found for destination.");
          if (typeof CustomToast !== "undefined") {
            CustomToast.show("warning", "Click closer to a road for routing");
          }
          return;
        }

        // Set destination and automatically calculate route
        this.setEndPoint(snapped);
        this.findRoute();

        if (typeof CustomToast !== "undefined") {
          CustomToast.show("success", "Route calculated from your location!");
        }
        return;
      }

      // Original routing mode handling
      if (this.routingMode) {
        if (!this.graphNodes.length) {
          this.setRouteInfo("No roads to route on. Add roads first.");
          return;
        }

        const snapped = this.findNearestGraphNode(latlng);
        if (!snapped) {
          this.setRouteInfo("No nearby road point found.");
          return;
        }

        if (this.routingMode === "start") {
          this.setStartPoint(snapped);
        } else if (this.routingMode === "end") {
          this.setEndPoint(snapped);
        }

        this.routingMode = null;
        return;
      }

      // Check if we're in a drawing mode (handled by Mapbox GL Draw)
      if (this.currentDrawingMode) {
        // Drawing is handled by Mapbox GL Draw, don't interfere
        return;
      }

      // Default behavior: Show location confirmation modal for adding records
      this.showLocationConfirmationModal(lngLat, latlng);
    });

    // Note: Feature-specific click handlers are set up in each render method
    // (renderCemeteries, renderRoads, renderGravePlots, renderAnnotations)
  }

  // Show location confirmation modal
  showLocationConfirmationModal(lngLat, latlng) {
    // Store the clicked location
    this.pendingLocation = {
      lng: lngLat.lng,
      lat: lngLat.lat,
      lngLat: lngLat,
      latlng: latlng,
    };

    // Format location as WKT POINT
    const locationWKT = `POINT(${lngLat.lng} ${lngLat.lat})`;

    // Update modal content
    const coordinatesEl = document.getElementById("locationCoordinates");
    if (coordinatesEl) {
      coordinatesEl.textContent = `${latlng.lat.toFixed(
        6
      )}, ${latlng.lng.toFixed(6)}`;
    }

    const confirmedLocationEl = document.getElementById("confirmedLocation");
    if (confirmedLocationEl) {
      confirmedLocationEl.value = locationWKT;
    }

    // Show confirmation modal
    const confirmModalEl = document.getElementById("locationConfirmModal");
    const confirmModal = new bootstrap.Modal(confirmModalEl);
    confirmModal.show();

    // Setup confirm button handler (only once)
    const confirmBtn = document.getElementById("confirmLocationBtn");
    if (confirmBtn && !confirmBtn.hasAttribute("data-handler-set")) {
      confirmBtn.setAttribute("data-handler-set", "true");
      confirmBtn.addEventListener("click", () => {
        // Set flag to open record modal after confirmation modal closes
        this.shouldOpenRecordModalAfterConfirm = true;
        // Hide confirmation modal first
        const confirmModalInstance =
          bootstrap.Modal.getInstance(confirmModalEl);
        if (confirmModalInstance) {
          confirmModalInstance.hide();
        }
      });
    }

    // Handle when confirmation modal is fully hidden
    confirmModalEl.addEventListener(
      "hidden.bs.modal",
      () => {
        // If we should open record modal after confirmation, do it now
        if (this.shouldOpenRecordModalAfterConfirm && this.pendingLocation) {
          this.shouldOpenRecordModalAfterConfirm = false;
          // Small delay to ensure modal is fully closed and Bootstrap has cleaned up
          setTimeout(() => {
            this.confirmLocationAndOpenRecordModal();
          }, 150);
        } else if (this.pendingLocation) {
          // Modal was closed without confirmation, clear pending location
          this.pendingLocation = null;
        }
      },
      { once: false }
    );
  }

  // Confirm location and open record modal
  confirmLocationAndOpenRecordModal() {
    if (!this.pendingLocation) return;

    const locationWKT = `POINT(${this.pendingLocation.lng} ${this.pendingLocation.lat})`;

    // Prepare location data
    const locationData = {
      lat: this.pendingLocation.lat,
      lng: this.pendingLocation.lng,
      location: locationWKT,
    };

    // Open record modal with location
    if (typeof window.openRecordModalFromGravePlot === "function") {
      window.openRecordModalFromGravePlot(locationData, locationWKT);
    } else {
      console.warn("openRecordModalFromGravePlot function not found");
      CustomToast &&
        CustomToast.error("Error", "Record modal functionality not loaded");
    }

    // Clear pending location
    this.pendingLocation = null;
  }

  initializeUI() {
    // Drawing buttons - now using Mapbox GL Draw
    const btnAddRoad = document.getElementById("btnAddRoad");
    const btnAddGravePlot = document.getElementById("btnAddGravePlot");
    const btnAddAnnotation = document.getElementById("btnAddAnnotation");

    console.log("Button elements found:", {
      btnAddRoad: !!btnAddRoad,
      btnAddGravePlot: !!btnAddGravePlot,
      btnAddAnnotation: !!btnAddAnnotation,
    });

    if (btnAddRoad) {
      btnAddRoad.addEventListener("click", () => {
        console.log("Add Road button clicked");
        this.currentDrawingMode = "road";
        this.startDrawMode("line_string");
      });
    } else {
      console.warn("btnAddRoad element not found");
    }

    if (btnAddGravePlot) {
      btnAddGravePlot.addEventListener("click", () => {
        console.log("Add Grave Plot button clicked");
        this.currentDrawingMode = "grave_plot";
        this.startDrawMode("polygon");
      });
    } else {
      console.warn("btnAddGravePlot element not found");
    }

    if (btnAddAnnotation) {
      btnAddAnnotation.addEventListener("click", () => {
        console.log("Add Annotation button clicked");
        this.currentDrawingMode = "annotation";
        this.startDrawMode("polygon");
      });
    } else {
      console.warn("btnAddAnnotation element not found");
    }

    // Routing buttons
    // document.getElementById('btnSetStart').addEventListener('click', () => {
    //     this.routingMode = 'start';
    //     this.setRouteInfo('Click near a road to set Start');
    // });

    // document.getElementById('btnSetEnd').addEventListener('click', () => {
    //     this.routingMode = 'end';
    //     this.setRouteInfo('Click near a road to set End');
    // });

    // document.getElementById('btnFindRoute').addEventListener('click', () => {
    //     this.findRoute();
    // });

    // document.getElementById('btnClearRoute').addEventListener('click', () => {
    //     this.clearRoute();
    // });

    // document.getElementById('btnUseMyLocation').addEventListener('click', () => {
    //     this.useMyLocation();
    // });

    // document.getElementById('btnARNavigate').addEventListener('click', () => {
    //     window.location.href = 'ar.html';
    // });

    document.getElementById("btnReload").addEventListener("click", () => {
      this.loadData();
    });

    // Form submissions
    this.setupFormHandlers();

    // Tab interactions
    this.setupTabInteractions();
  }

  initializeModalManager() {
    // Initialize modal manager when ModalManager class is available
    if (typeof ModalManager !== "undefined") {
      this.modalManager = new ModalManager(this);
      console.log("ModalManager initialized successfully");
    } else {
      // Retry after a short delay if ModalManager is not yet loaded
      setTimeout(() => {
        this.initializeModalManager();
      }, 100);
    }
  }

  initializeRoadManager() {
    // Initialize road manager when RoadManager class is available
    if (typeof RoadManager !== "undefined") {
      this.roadManager = new RoadManager(this);
      console.log("RoadManager initialized successfully");
    } else {
      // Retry after a short delay if RoadManager is not yet loaded
      setTimeout(() => {
        this.initializeRoadManager();
      }, 100);
    }
  }

  initializeLayerManager() {
    // Initialize layer manager when LayerManager class is available
    if (typeof LayerManager !== "undefined") {
      this.layerManager = new LayerManager(this);
      console.log("LayerManager initialized successfully");
    } else {
      // Retry after a short delay if LayerManager is not yet loaded
      setTimeout(() => {
        this.initializeLayerManager();
      }, 100);
    }
  }

  setupTabInteractions() {
    // Handle tab switching to control interactive properties
    const roadsTab = document.getElementById("roads-tab");
    const annotationsTab = document.getElementById("annotations-tab");

    if (roadsTab) {
      roadsTab.addEventListener("click", () => {
        window.tabs = "roads";
        this.loadData();
        this.updateLayerInteractivity();
      });
    }

    if (annotationsTab) {
      annotationsTab.addEventListener("click", () => {
        window.tabs = "annotations";
        this.loadData();
        this.updateLayerInteractivity();
      });
    }
  }

  // Update layer interactivity based on current tab
  updateLayerInteractivity() {
    // Update road interactivity
    if (this.roadManager) {
      this.roadManager.updateRoadInteractivity();
    }

    // Update annotation interactivity
    if (this.layerManager) {
      this.layerManager.updateAnnotationInteractivity();
    }
  }

  setupFormHandlers() {
    // Form handlers are now managed by ModalManager
    // Only keep delete confirmation handler
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", async () => {
        await this.confirmDelete();
      });
    }
  }

  // Data Management
  async loadData() {
    console.log("Loading cemetery data...");
    // Prevent multiple simultaneous calls
    if (this.isLoadingData) {
      console.log("Data loading already in progress, skipping...");
      return;
    }

    this.isLoadingData = true;

    try {
      const response = await axios.get(
        `${this.cemeteryAPI}?action=getMapData`,
        {
          headers: this.authManager.API_CONFIG.getHeaders(),
        }
      );
      if (response.data.success) {
        console.log("Data:", response.data);
        this.clearLayers();
        const data = response.data.data;

        // Store cemetery data for later use in dropdowns
        this.cemeteries = data.cemeteries || [];

        this.updateTables(data);

        // Render grave plots on the map
        if (data.grave_plots && data.grave_plots.length > 0) {
          this.renderGravePlots(data.grave_plots);
        }

        // Grave plot click handlers are now handled by the general map click handler
        // which shows a confirmation modal for all clicks

        // Fit bounds if any data exists
        setTimeout(() => {
          this.fitMapToData();
        }, 100); // Small delay to ensure all layers are rendered
      } else {
        CustomToast.show("danger", "Failed to load cemetery data");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      if (error.response && error.response.status === 401) {
        CustomToast.show(
          "danger",
          "Authentication Error",
          "Please login again"
        );
        // Redirect to login page
        window.location.href = "../../auth/login.php";
      } else {
        CustomToast.show("danger", "Failed to load cemetery data");
      }
    } finally {
      this.isLoadingData = false;
    }
  }

  clearLayers() {
    // Reset grave plot click handlers flag so they can be set up again
    this.gravePlotClickHandlersSet = false;

    // Clear grave plot markers
    if (this.gravePlotMarkers) {
      this.gravePlotMarkers.forEach((marker) => marker.remove());
      this.gravePlotMarkers = [];
    }

    // Remove all custom layers and sources
    const layersToRemove = [
      "cemeteries",
      "grave-plots-polygon",
      "grave-plots-polygon-stroke",
      "grave-plots-point",
      "grave-plots-circles",
      "roads-top",
      "roads-border",
      "roads",
      "annotations-fill",
      "annotations-stroke",
      "annotations",
      "routes",
    ];
    layersToRemove.forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    // Remove sources (these have different IDs than layers)
    const sourcesToRemove = [
      "cemeteries",
      "roads",
      "grave-plots",
      "grave-plots-circles",
      "annotations",
      "routes",
    ];
    sourcesToRemove.forEach((sourceId) => {
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    });

    // Clear feature collections
    this.features = {
      cemeteries: [],
      roads: [],
      gravePlots: [],
      annotations: [],
      routes: [],
    };
  }

  // Parse WKT POINT to coordinates
  parseWKTPoint(wkt) {
    if (!wkt || typeof wkt !== "string") {
      return null;
    }

    try {
      // Remove POINT( and )
      const coordsString = wkt.replace(/^POINT\(/, "").replace(/\)$/, "");
      const [first, second] = coordsString.trim().split(/\s+/).map(parseFloat);

      // WKT format is usually (lng lat) for POINT
      // Return as [lng, lat] for MapLibre GL
      if (first > 100) {
        // First value > 100 is likely longitude (lng, lat format)
        return [first, second];
      } else {
        // First value < 20 is likely latitude (lat, lng format)
        return [second, first];
      }
    } catch (error) {
      console.error("Error parsing WKT POINT:", error, wkt);
      return null;
    }
  }

  // Create a circle GeoJSON feature for 10-meter radius
  createCircleFeature(center, radiusMeters) {
    const points = 64; // Number of points in the circle
    const circleCoordinates = [];

    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points;
      const radian = (angle * Math.PI) / 180;

      // Calculate distance in degrees (approximate)
      // At latitude 10 (Philippines), 1 degree ≈ 111 km
      // 10 meters ≈ 0.00009 degrees
      const lat = center[1] + (radiusMeters / 111320) * Math.cos(radian);
      const lng =
        center[0] +
        (radiusMeters / (111320 * Math.cos((center[1] * Math.PI) / 180))) *
          Math.sin(radian);

      circleCoordinates.push([lng, lat]);
    }

    // Close the circle
    circleCoordinates.push(circleCoordinates[0]);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [circleCoordinates],
      },
      properties: {},
    };
  }

  // Render grave plots on the map with location icons and 10m radius circles
  renderGravePlots(gravePlots) {
    // Check if map is loaded before proceeding
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn(
        "Map not ready for rendering grave plots, retrying in 100ms..."
      );
      setTimeout(() => {
        this.renderGravePlots(gravePlots);
      }, 100);
      return;
    }

    // Initialize markers array if not exists
    if (!this.gravePlotMarkers) {
      this.gravePlotMarkers = [];
    }

    // Clear existing markers
    this.gravePlotMarkers.forEach((marker) => marker.remove());
    this.gravePlotMarkers = [];

    const pointFeatures = [];
    const circleFeatures = [];

    gravePlots.forEach((plot) => {
      let coordinates = null;

      // Parse location if it exists (POINT format)
      if (plot.location) {
        coordinates = this.parseWKTPoint(plot.location);
      }

      // If no location, skip this plot
      if (!coordinates) {
        console.warn("Grave plot has no valid location:", plot);
        return;
      }

      // Create point feature for marker
      pointFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        properties: {
          id: plot.id,
          grave_number: plot.grave_number || `G-${plot.id}`,
          status: plot.status || "unknown",
          type: "grave-plot",
        },
      });

      // Create 10-meter radius circle feature
      const circleFeature = this.createCircleFeature(coordinates, 10);
      circleFeatures.push(circleFeature);

      // Create location icon marker
      const markerEl = document.createElement("div");
      markerEl.className = "grave-plot-marker";
      markerEl.innerHTML =
        '<i class="fas fa-map-marker-alt" style="font-size: 24px; color: #dc3545;"></i>';
      markerEl.style.cursor = "pointer";
      markerEl.title = plot.grave_number || `Grave ${plot.id}`;

      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: "bottom",
      })
        .setLngLat(coordinates)
        .addTo(this.map);

      // Store marker reference
      this.gravePlotMarkers.push(marker);
    });

    // Store point features
    this.features.gravePlots = pointFeatures;

    // Add circles source and layer
    if (circleFeatures.length > 0) {
      // Remove existing circle layers and source if exists
      if (this.map.getLayer("grave-plots-circles-stroke")) {
        this.map.removeLayer("grave-plots-circles-stroke");
      }
      if (this.map.getLayer("grave-plots-circles")) {
        this.map.removeLayer("grave-plots-circles");
      }
      if (this.map.getSource("grave-plots-circles")) {
        this.map.removeSource("grave-plots-circles");
      }

      // Add new circle source
      this.map.addSource("grave-plots-circles", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: circleFeatures,
        },
      });

      // Add circle fill layer
      this.map.addLayer({
        id: "grave-plots-circles",
        type: "fill",
        source: "grave-plots-circles",
        paint: {
          "fill-color": "#dc3545",
          "fill-opacity": 0.1,
        },
      });

      // Add circle stroke layer
      this.map.addLayer({
        id: "grave-plots-circles-stroke",
        type: "line",
        source: "grave-plots-circles",
        paint: {
          "line-color": "#dc3545",
          "line-width": 1,
          "line-opacity": 0.3,
        },
      });
    }

    console.log(
      `Rendered ${this.gravePlotMarkers.length} grave plot markers with 10m radius circles`
    );
  }

  // Setup click handlers for grave plots - now using confirmation modal
  setupGravePlotClickHandlers() {
    // Grave plots now use the general map click handler which shows confirmation modal
    // This method is kept for potential future use but is not actively used
    // since we want to show confirmation modal for all clicks including grave plots
  }

  fitMapToData() {
    // Check if map is loaded before proceeding
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn("Map not ready for fitting bounds");
      return;
    }

    // Calculate bounds from all features
    let minLng = Infinity,
      minLat = Infinity;
    let maxLng = -Infinity,
      maxLat = -Infinity;
    let hasData = false;

    Object.values(this.features).forEach((featureCollection) => {
      if (featureCollection.length > 0) {
        featureCollection.forEach((feature) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const coords = this.getFeatureBounds(feature);
            if (coords) {
              hasData = true;

              if (Array.isArray(coords[0])) {
                // Handle bounds array [min, max]
                const [min, max] = coords;
                minLng = Math.min(minLng, min[0]);
                minLat = Math.min(minLat, min[1]);
                maxLng = Math.max(maxLng, max[0]);
                maxLat = Math.max(maxLat, max[1]);
              } else {
                // Handle single coordinate [lng, lat]
                minLng = Math.min(minLng, coords[0]);
                minLat = Math.min(minLat, coords[1]);
                maxLng = Math.max(maxLng, coords[0]);
                maxLat = Math.max(maxLat, coords[1]);
              }
            }
          }
        });
      }
    });

    if (
      hasData &&
      isFinite(minLng) &&
      isFinite(minLat) &&
      isFinite(maxLng) &&
      isFinite(maxLat)
    ) {
      // Create bounds in MapLibre GL format: [[minLng, minLat], [maxLng, maxLat]]
      const bounds = [
        [minLng, minLat],
        [maxLng, maxLat],
      ];
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }

  getFeatureBounds(feature) {
    if (feature.geometry.type === "Point") {
      return feature.geometry.coordinates; // [lng, lat]
    } else if (feature.geometry.type === "LineString") {
      const coords = feature.geometry.coordinates;
      if (coords.length === 0) return null;

      let minLng = coords[0][0],
        minLat = coords[0][1];
      let maxLng = coords[0][0],
        maxLat = coords[0][1];

      coords.forEach((coord) => {
        minLng = Math.min(minLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLng = Math.max(maxLng, coord[0]);
        maxLat = Math.max(maxLat, coord[1]);
      });

      return [
        [minLng, minLat],
        [maxLng, maxLat],
      ];
    } else if (feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates[0];
      if (coords.length === 0) return null;

      let minLng = coords[0][0],
        minLat = coords[0][1];
      let maxLng = coords[0][0],
        maxLat = coords[0][1];

      coords.forEach((coord) => {
        minLng = Math.min(minLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLng = Math.max(maxLng, coord[0]);
        maxLat = Math.max(maxLat, coord[1]);
      });

      return [
        [minLng, minLat],
        [maxLng, maxLat],
      ];
    }
    return null;
  }

  // Layer Management Methods
  async toggleAnnotationVisibility(id) {
    try {
      const formData = new FormData();
      formData.set("action", "toggleAnnotationVisibility");
      formData.set("id", id);

      const response = await axios.post(this.cemeteryAPI, formData, {
        headers: this.authManager.API_CONFIG.getFormHeaders(),
      });

      if (response.data.success) {
        CustomToast.show("success", "Annotation visibility updated");
        this.loadData();
      } else {
        CustomToast.show(
          "danger",
          response.data.message || "Failed to update visibility"
        );
      }
    } catch (error) {
      console.error("Error toggling annotation visibility:", error);
      CustomToast.show("danger", "Failed to update annotation visibility");
    }
  }

  async updateAnnotationSortOrder(id, sortOrder) {
    try {
      const formData = new FormData();
      formData.set("action", "updateAnnotationSortOrder");
      formData.set("id", id);
      formData.set("sort_order", sortOrder);

      const response = await axios.post(this.cemeteryAPI, formData, {
        headers: this.authManager.API_CONFIG.getFormHeaders(),
      });

      if (response.data.success) {
        CustomToast.show("success", "Sort order updated");
        this.loadData();
      } else {
        CustomToast.show(
          "danger",
          response.data.message || "Failed to update sort order"
        );
      }
    } catch (error) {
      console.error("Error updating sort order:", error);
      CustomToast.show("danger", "Failed to update sort order");
    }
  }

  async refreshAnnotations() {
    CustomToast.show("info", "Refreshing annotations...");
    await this.loadData();
  }

  // Routing Functions (from your original system_script.js)

  // Routing helper functions (from original system_script.js)
  nodeKey(lat, lng) {
    const f = 1e5;
    return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
  }

  addNode(lat, lng) {
    const key = this.nodeKey(lat, lng);
    if (this.nodeKeyToId.has(key)) return this.nodeKeyToId.get(key);
    const id = this.graphNodes.length;
    this.graphNodes.push({ id, lat, lng, key });
    this.nodeKeyToId.set(key, id);
    this.graphAdj.set(id, []);
    return id;
  }

  addEdge(aId, bId, w) {
    if (aId === bId) return;
    if (!this.hasEdge(aId, bId)) this.graphAdj.get(aId).push({ to: bId, w });
    if (!this.hasEdge(bId, aId)) this.graphAdj.get(bId).push({ to: aId, w });
  }

  hasEdge(aId, bId) {
    const list = this.graphAdj.get(aId) || [];
    return list.some((e) => e.to === bId);
  }

  findNearestGraphNode(latlng) {
    let best = null;
    let bestD = Infinity;
    for (const n of this.graphNodes) {
      const d = this.haversineMeters(latlng.lat, latlng.lng, n.lat, n.lng);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  setStartPoint(node) {
    this.startNodeId = node.id;
    if (this.startMarker) this.startMarker.remove();

    // Create custom start marker element
    const startMarkerEl = document.createElement("div");
    startMarkerEl.style.width = "20px";
    startMarkerEl.style.height = "20px";
    startMarkerEl.style.backgroundColor = "#28a745";
    startMarkerEl.style.borderRadius = "50%";
    startMarkerEl.style.border = "2px solid white";
    startMarkerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

    this.startMarker = new maplibregl.Marker({
      element: startMarkerEl,
    })
      .setLngLat([node.lng, node.lat])
      .addTo(this.map);

    this.setRouteInfo(
      `Start set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`
    );
  }

  setEndPoint(node) {
    this.endNodeId = node.id;
    if (this.endMarker) this.endMarker.remove();

    // Create custom end marker element
    const endMarkerEl = document.createElement("div");
    endMarkerEl.style.width = "20px";
    endMarkerEl.style.height = "20px";
    endMarkerEl.style.backgroundColor = "#ffc107";
    endMarkerEl.style.borderRadius = "50%";
    endMarkerEl.style.border = "2px solid white";
    endMarkerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

    this.endMarker = new maplibregl.Marker({
      element: endMarkerEl,
    })
      .setLngLat([node.lng, node.lat])
      .addTo(this.map);

    this.setRouteInfo(
      `End set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`
    );
  }

  findRoute() {
    if (this.startNodeId == null || this.endNodeId == null) {
      this.setRouteInfo("Set Start and End first");
      return;
    }
    const res = this.dijkstra(this.startNodeId, this.endNodeId);
    this.renderRoute(res.pathCoords, res.distanceMeters);

    // Store for AR navigation
    if (res.pathCoords && res.pathCoords.length >= 2) {
      try {
        localStorage.setItem("cl_route_coords", JSON.stringify(res.pathCoords));
        localStorage.setItem(
          "cl_route_distance_m",
          String(res.distanceMeters || 0)
        );
      } catch (e) {}
      const arBtn = document.getElementById("btnARNavigate");
      if (arBtn) arBtn.disabled = false;
    }
  }

  dijkstra(sourceId, targetId) {
    const N = this.graphNodes.length;
    const dist = new Array(N).fill(Infinity);
    const prev = new Array(N).fill(-1);
    dist[sourceId] = 0;

    const used = new Array(N).fill(false);
    for (let iter = 0; iter < N; iter++) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < N; i++) {
        if (!used[i] && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u === -1) break;
      used[u] = true;
      if (u === targetId) break;

      const neighbors = this.graphAdj.get(u) || [];
      for (const { to, w } of neighbors) {
        const nd = dist[u] + w;
        if (nd < dist[to]) {
          dist[to] = nd;
          prev[to] = u;
        }
      }
    }

    // Reconstruct path
    const pathIds = [];
    let cur = targetId;
    if (prev[cur] !== -1 || cur === sourceId) {
      while (cur !== -1) {
        pathIds.push(cur);
        cur = prev[cur];
      }
      pathIds.reverse();
    }
    const pathCoords = pathIds.map((id) => [
      this.graphNodes[id].lat,
      this.graphNodes[id].lng,
    ]);
    return { pathIds, pathCoords, distanceMeters: dist[targetId] };
  }

  renderRoute(coords, distanceMeters) {
    // Clear existing route
    if (this.map.getLayer("route")) {
      this.map.removeLayer("route");
    }
    if (this.map.getSource("route")) {
      this.map.removeSource("route");
    }

    // Clear existing markers
    if (this.startMarker) this.startMarker.remove();
    if (this.endMarker) this.endMarker.remove();

    if (!coords || coords.length < 2) {
      this.setRouteInfo("No route found");
      return;
    }

    // Convert coordinates to [lng, lat] format for MapLibre GL
    const routeCoords = coords.map((coord) => [coord[1], coord[0]]);

    // Add route source and layer
    this.map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoords,
        },
        properties: {},
      },
    });

    this.map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#dc3545",
        "line-width": 5,
        "line-opacity": 1,
      },
    });

    // Add start and end markers
    if (this.startNodeId !== null && this.graphNodes[this.startNodeId]) {
      const startNode = this.graphNodes[this.startNodeId];
      this.startMarker = new maplibregl.Marker({
        color: "#28a745",
      })
        .setLngLat([startNode.lng, startNode.lat])
        .addTo(this.map);
    }

    if (this.endNodeId !== null && this.graphNodes[this.endNodeId]) {
      const endNode = this.graphNodes[this.endNodeId];
      this.endMarker = new maplibregl.Marker({
        color: "#ffc107",
      })
        .setLngLat([endNode.lng, endNode.lat])
        .addTo(this.map);
    }

    this.setRouteInfo(`Route length: ${(distanceMeters / 1000).toFixed(2)} km`);
  }

  clearRoute() {
    this.startNodeId = null;
    this.endNodeId = null;

    // Remove route layer and source
    if (this.map.getLayer("route")) {
      this.map.removeLayer("route");
    }
    if (this.map.getSource("route")) {
      this.map.removeSource("route");
    }

    // Remove markers
    if (this.startMarker) this.startMarker.remove();
    if (this.endMarker) this.endMarker.remove();

    this.setRouteInfo("Route cleared");

    try {
      localStorage.removeItem("cl_route_coords");
      localStorage.removeItem("cl_route_distance_m");
    } catch (e) {}

    const arBtn = document.getElementById("btnARNavigate");
    if (arBtn) arBtn.disabled = true;
  }

  async useMyLocation() {
    try {
      if (!navigator.geolocation) return;

      // Show loading state
      const btn = document.getElementById("btnUseMyLocation");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML =
          '<i class="fas fa-spinner fa-spin me-1"></i>Locating...';
      }

      // Get high-accuracy location
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const heading = pos.coords.heading;

      // Remove previous marker and accuracy circle
      if (this.userLocationMarker) this.userLocationMarker.remove();
      if (this.userAccuracyCircle) this.userAccuracyCircle.remove();

      // Create marker with direction arrow
      // const markerEl = document.createElement('div');
      // markerEl.className = 'user-location-marker';
      // markerEl.style.width = '32px';
      // markerEl.style.height = '32px';
      // markerEl.style.display = 'flex';
      // markerEl.style.alignItems = 'center';
      // markerEl.style.justifyContent = 'center';

      // // Arrow for heading
      // const arrow = document.createElement('div');
      // arrow.style.width = '0';
      // arrow.style.height = '0';
      // arrow.style.borderLeft = '10px solid transparent';
      // arrow.style.borderRight = '10px solid transparent';
      // arrow.style.borderBottom = '20px solid #4285f4';
      // arrow.style.transform = `rotate(${typeof heading === 'number' && !isNaN(heading) ? heading : 0}deg)`;
      // arrow.style.transition = 'transform 0.2s';
      // markerEl.appendChild(arrow);

      // Create marker with direction arrow
      // const markerEl = document.createElement('div');
      // markerEl.className = 'user-location-marker';
      // markerEl.style.width = '32px';
      // markerEl.style.height = '32px';
      // markerEl.style.display = 'flex';
      // markerEl.style.alignItems = 'center';
      // markerEl.style.justifyContent = 'center';

      // Create new marker element
      const markerEl = document.createElement("div");
      markerEl.className = "location-marker";
      markerEl.title = `Your Location (±${Math.round(accuracy)}m)`;

      // Arrow for heading
      const arrow = document.createElement("div");
      // arrow.style.width = '0';
      // arrow.style.height = '0';
      // arrow.style.borderLeft = '10px solid transparent';
      // arrow.style.borderRight = '10px solid transparent';
      // arrow.style.borderBottom = '20px solid #4285f4';
      // arrow.style.transform = `rotate(${typeof heading === 'number' && !isNaN(heading) ? heading : 0}deg)`;
      // arrow.style.transition = 'transform 0.2s';
      markerEl.appendChild(arrow);

      // Add marker to map
      this.userLocationMarker = new maplibregl.Marker({
        element: markerEl,
      })
        .setLngLat([lng, lat])
        .addTo(this.map);

      // Add accuracy circle
      // this.userAccuracyCircle = new maplibregl.Marker({
      //     element: this.createAccuracyCircle(accuracy)
      // })
      // .setLngLat([lng, lat])
      // .addTo(this.map);

      // Center and zoom
      let zoomLevel = 18;
      if (accuracy > 100) zoomLevel = 16;
      if (accuracy > 500) zoomLevel = 14;
      if (accuracy > 1000) zoomLevel = 12;
      this.map.setCenter([lng, lat]);
      this.map.setZoom(zoomLevel);

      // Store for realtime tracking
      this.userCurrentLocation = { lat, lng, heading };
      this.isUserLocationActive = true;

      // Start realtime location tracking (updates marker and heading)
      this.startRealtimeLocationTracking();
    } catch (err) {
      // Do nothing (no details shown)
    } finally {
      // Reset button state
      const btn = document.getElementById("btnUseMyLocation");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML =
          '<i class="fas fa-location-arrow me-1"></i><span class="d-none d-sm-inline">My Location</span><span class="d-inline d-sm-none">GPS</span>';
      }
    }
  }

  createAccuracyCircle(accuracy) {
    const circleEl = document.createElement("div");
    circleEl.style.width = `${accuracy * 2}px`;
    circleEl.style.height = `${accuracy * 2}px`;
    circleEl.style.border = "2px solid #4285f4";
    circleEl.style.borderRadius = "50%";
    circleEl.style.backgroundColor = "rgba(66, 133, 244, 0.1)";
    circleEl.style.position = "absolute";
    circleEl.style.left = "50%";
    circleEl.style.top = "50%";
    circleEl.style.transform = "translate(-50%, -50%)";
    circleEl.style.pointerEvents = "none";
    return circleEl;
  }

  // High-frequency real-time location tracking
  startRealtimeLocationTracking() {
    // Stop any existing tracking
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
    }

    let lastUpdateTime = 0;
    let locationHistory = [];

    // Start high-frequency position watching
    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const speed = position.coords.speed || 0;

        // Smooth location updates - only update if moved significantly or accuracy improved
        const shouldUpdate = this.shouldUpdateLocation(
          lat,
          lng,
          accuracy,
          now - lastUpdateTime
        );

        if (shouldUpdate && this.userLocationMarker) {
          // Smooth animation for marker movement
          this.animateMarkerToPosition(lat, lng);

          // Update accuracy circle with smooth transition
          if (this.userAccuracyCircle) {
            this.userAccuracyCircle.setLngLat([lng, lat]);
            // Update accuracy circle size
            const circleEl = this.userAccuracyCircle.getElement();
            if (circleEl) {
              circleEl.style.width = `${accuracy * 2}px`;
              circleEl.style.height = `${accuracy * 2}px`;
            }
          }

          // Store current location
          this.userCurrentLocation = { lat, lng, accuracy, speed };

          // Update start point if user location is active
          if (this.isUserLocationActive && this.graphNodes.length > 0) {
            const snapped = this.findNearestGraphNode({ lat, lng });
            if (snapped && this.startMarker) {
              // Smoothly update start point
              this.startMarker.setLngLat([snapped.lng, snapped.lat]);
              this.startPoint = snapped;

              // Auto-recalculate route if end point exists
              if (this.endPoint) {
                this.findRoute();
              }
            }
          }

          // Update popup with real-time info
          this.updateLocationPopup(lat, lng, accuracy, speed);

          // Keep location history for smoothing
          locationHistory.push({ lat, lng, accuracy, timestamp: now });
          if (locationHistory.length > 10) {
            locationHistory.shift(); // Keep only last 10 positions
          }

          lastUpdateTime = now;
        }
      },
      (error) => {
        console.warn("Real-time location tracking error:", error);
        if (error.code === error.TIMEOUT) {
          // Continue tracking even on timeout
          console.log("Location timeout, continuing tracking...");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // Shorter timeout for faster updates
        maximumAge: 0, // Very fresh location data (1 second max age)
      }
    );

    // Extended tracking time for navigation
    setTimeout(() => {
      if (this.locationWatchId) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
        this.setRouteInfo(
          "Real-time location tracking stopped to save battery"
        );
      }
    }, 1800000); // 30 minutes for navigation
  }

  // Determine if location should be updated
  shouldUpdateLocation(lat, lng, accuracy, timeSinceLastUpdate) {
    if (!this.userCurrentLocation) return true;

    const distance = this.haversineMeters(
      this.userCurrentLocation.lat,
      this.userCurrentLocation.lng,
      lat,
      lng
    );

    // Update conditions:
    // 1. Moved more than 2 meters
    // 2. Accuracy improved by more than 5 meters
    // 3. At least 2 seconds since last update
    return (
      distance > 2 ||
      accuracy < this.userCurrentLocation.accuracy - 5 ||
      timeSinceLastUpdate > 2000
    );
  }

  // Smooth marker animation
  animateMarkerToPosition(lat, lng) {
    if (!this.userLocationMarker) return;

    const currentLngLat = this.userLocationMarker.getLngLat();
    const targetLngLat = [lng, lat];

    // Calculate distance for animation duration
    const distance = this.haversineMeters(
      currentLngLat.lat,
      currentLngLat.lng,
      lat,
      lng
    );
    const duration = Math.min(Math.max(distance * 10, 100), 1000); // 100ms to 1s

    // Animate marker movement
    this.userLocationMarker.setLngLat(targetLngLat);

    // Add smooth CSS transition
    const markerElement = this.userLocationMarker.getElement();
    if (markerElement) {
      markerElement.style.transition = `all ${duration}ms ease-out`;
      setTimeout(() => {
        markerElement.style.transition = "";
      }, duration);
    }
  }

  // Update location popup with real-time data
  updateLocationPopup(lat, lng, accuracy, speed) {
    if (!this.userLocationMarker) return;

    const speedKmh = speed ? (speed * 3.6).toFixed(1) : "0.0";
    const popupContent = `
            <div class="user-location-popup">
                <h6><i class="fas fa-location-arrow text-primary"></i> Your Location (Live)</h6>
                <p class="mb-1"><strong>Coordinates:</strong><br>
                ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p class="mb-1"><strong>Accuracy:</strong> ±${Math.round(
                  accuracy
                )}m</p>
                <p class="mb-1"><strong>Speed:</strong> ${speedKmh} km/h</p>
                <small class="text-muted">Live tracking active • ${new Date().toLocaleTimeString()}</small>
                <div class="mt-2">
                    <button class="btn btn-sm btn-danger" onclick="cemeteryManager.stopRealtimeTracking()">
                        <i class="fas fa-stop"></i> Stop Tracking
                    </button>
                    <button class="btn btn-sm btn-info ms-1" onclick="cemeteryManager.centerOnUserLocation()">
                        <i class="fas fa-crosshairs"></i> Center
                    </button>
                </div>
            </div>
        `;

    // Update existing popup or create new one
    const existingPopup = this.userLocationMarker.getPopup();
    if (existingPopup) {
      existingPopup.setHTML(popupContent);
    } else {
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
      })
        .setLngLat([lng, lat])
        .setHTML(popupContent);

      this.userLocationMarker.setPopup(popup);
    }
  }

  // Stop real-time tracking
  stopRealtimeTracking() {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    this.isUserLocationActive = false;
    this.setRouteInfo("Real-time location tracking stopped");
    if (typeof CustomToast !== "undefined") {
      CustomToast.show("info", "Location tracking stopped");
    }
  }

  // Center map on user location
  centerOnUserLocation() {
    if (this.userCurrentLocation && this.userLocationMarker) {
      this.map.setCenter([
        this.userCurrentLocation.lng,
        this.userCurrentLocation.lat,
      ]);
      this.map.setZoom(18);
    }
  }

  // Stop location tracking (legacy method)
  stopLocationTracking() {
    this.stopRealtimeTracking();
  }

  setRouteInfo(text) {
    const routeInfo = document.getElementById("routeInfo");
    if (routeInfo) routeInfo.textContent = text;
  }

  // Utility Functions
  haversineMeters(aLat, aLng, bLat, bLng) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const sa =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(sa));
  }

  projectPointOntoSegmentMeters(p, a, b) {
    const lat0 = a.lat;
    const P = this.latLngToXY(p.lat, p.lng, lat0);
    const A = this.latLngToXY(a.lat, a.lng, lat0);
    const B = this.latLngToXY(b.lat, b.lng, lat0);
    const ABx = B.x - A.x,
      ABy = B.y - A.y;
    const APx = P.x - A.x,
      APy = P.y - A.y;
    const ab2 = ABx * ABx + ABy * ABy;
    if (ab2 === 0) return { t: 0, dist: Math.hypot(APx, APy), proj: a };
    let t = (APx * ABx + APy * ABy) / ab2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const X = { x: A.x + t * ABx, y: A.y + t * ABy };
    const dist = Math.hypot(P.x - X.x, P.y - X.y);
    const projLL = this.xyToLatLng(X.x, X.y, lat0);
    return { t, dist, proj: { lat: projLL.lat, lng: projLL.lng } };
  }

  latLngToXY(lat, lng, lat0 = lat) {
    const R = 6371000;
    const x = ((lng * Math.PI) / 180) * R * Math.cos((lat0 * Math.PI) / 180);
    const y = ((lat * Math.PI) / 180) * R;
    return { x, y };
  }

  xyToLatLng(x, y, lat0) {
    const R = 6371000;
    const lat = ((y / R) * 180) / Math.PI;
    const lng = ((x / (R * Math.cos((lat0 * Math.PI) / 180))) * 180) / Math.PI;
    return { lat, lng };
  }

  normalizeCoordinates(input, geometryType) {
    if (!Array.isArray(input)) return geometryType === "polygon" ? [] : [];

    if (geometryType === "polygon") {
      if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
        return input
          .map((ring) =>
            ring.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean)
          )
          .filter((ring) => ring.length >= 3);
      } else {
        const ring = input
          .map(this.normalizeToLatLngPair.bind(this))
          .filter(Boolean);
        return ring.length >= 3 ? [ring] : [];
      }
    } else {
      if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
        const parts = input
          .map((part) =>
            part.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean)
          )
          .filter((p) => p.length >= 2);
        return parts[0] || [];
      } else {
        return input.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean);
      }
    }
  }

  normalizeToLatLngPair(p) {
    if (!p) return null;
    if (Array.isArray(p) && p.length >= 2) {
      const first = Number(p[0]);
      const second = Number(p[1]);

      // For Philippines coordinates: lat ~10-11, lng ~123-124
      // If first value is > 100, it's likely longitude (lng, lat format)
      // If first value is < 20, it's likely latitude (lat, lng format)
      if (first > 100) {
        // Likely [lng, lat] format, convert to [lat, lng]
        return this.isValidLatLng(second, first) ? [second, first] : null;
      } else {
        // Assume [lat, lng] format
        return this.isValidLatLng(first, second) ? [first, second] : null;
      }
    }
    if (typeof p === "object") {
      const lat = Number(p.lat ?? p.latitude);
      const lng = Number(p.lng ?? p.lon ?? p.longitude);
      return this.isValidLatLng(lat, lng) ? [lat, lng] : null;
    }
    return null;
  }

  isValidLatLng(lat, lng) {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  coordsToWKT(coords, type) {
    if (type === "POLYGON") {
      // coords should be in [lat, lng] format
      const ring = coords.map((coord) => `${coord[0]} ${coord[1]}`).join(", ");
      return `POLYGON((${ring}))`;
    } else if (type === "LINESTRING") {
      // coords should be in [lat, lng] format
      const line = coords.map((coord) => `${coord[0]} ${coord[1]}`).join(", ");
      return `LINESTRING(${line})`;
    }
    return "";
  }

  populateCemeterySelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`Select element with id '${selectId}' not found`);
      return;
    }

    // Clear existing options
    select.innerHTML = '<option value="">Select Cemetery</option>';

    // Populate with cemetery data if available
    if (this.cemeteries && this.cemeteries.length > 0) {
      this.cemeteries.forEach((cemetery) => {
        const option = document.createElement("option");
        option.value = cemetery.id;
        option.textContent = cemetery.name;
        select.appendChild(option);
      });
    } else {
      // If no cemeteries loaded yet, try to load them only once
      if (!this.cemeteries && !this.isLoadingCemeteries) {
        console.log("No cemetery data available, attempting to load...");
        this.isLoadingCemeteries = true;
        this.loadData()
          .then(() => {
            this.isLoadingCemeteries = false;
            // Only call recursively if we now have data
            if (this.cemeteries && this.cemeteries.length > 0) {
              this.populateCemeterySelect(selectId);
            }
          })
          .catch((error) => {
            this.isLoadingCemeteries = false;
            console.error("Failed to load cemetery data:", error);
          });
      }
    }
  }

  updateTables(data) {
    this.updateRoadsTable(data.roads || []);
    this.updatePlotsTable(data.grave_plots || []);
    this.updateAnnotationsTable(data.layer_annotations || []);
  }

  updateRoadsTable(roads) {
    const tbody = document.getElementById("roadsTableBody");
    tbody.innerHTML = roads
      .map(
        (road) => `
            <tr>
                <td>${this.escapeHtml(road.road_name)}</td>
                <td>${road.geometry_type}</td>
                <td>${new Date(road.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="cemeteryManager.deleteRoad(${
                      road.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updatePlotsTable(plots) {
    const tbody = document.getElementById("plotsTableBody");
    tbody.innerHTML = plots
      .map(
        (plot) => `
            <tr>
                <td>${this.escapeHtml(plot.grave_number)}</td>
                <td>${this.escapeHtml(plot.cemetery_name || "Unknown")}</td>
                <td><span class="badge bg-${
                  plot.status === "available"
                    ? "success"
                    : plot.status === "occupied"
                    ? "danger"
                    : "warning"
                }">${plot.status}</span></td>
                <td>${this.escapeHtml(plot.notes || "")}</td>
                <td>${new Date(plot.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="cemeteryManager.deleteGravePlot(${
                      plot.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updateAnnotationsTable(annotations) {
    const tbody = document.getElementById("annotationsTableBody");
    tbody.innerHTML = annotations
      .map(
        (annotation) => `
            <tr class="${annotation.is_visible == 1 ? "" : "table-secondary"}">
                <td>${this.escapeHtml(annotation.label || "Unnamed")}</td>
                <td class="d-none d-sm-table-cell">
                    <span style="display:inline-block;width:20px;height:20px;background-color:${
                      annotation.color
                    };border-radius:3px;"></span> 
                    ${annotation.color}
                </td>
                <td class="d-none d-md-table-cell">${
                  annotation.sort_order || 0
                }</td>
                <td class="d-none d-md-table-cell">
                    <span class="badge bg-${
                      annotation.is_visible == 1 ? "success" : "secondary"
                    }">${
          annotation.is_visible == 1 ? "Visible" : "Hidden"
        }</span>
                    <span class="badge bg-${
                      annotation.is_active == 1 ? "primary" : "warning"
                    } ms-1">${
          annotation.is_active == 1 ? "Active" : "Inactive"
        }</span>
                </td>
                <td class="d-none d-lg-table-cell">${this.escapeHtml(
                  annotation.notes || ""
                )}</td>
                <td class="d-none d-sm-table-cell">${new Date(
                  annotation.created_at
                ).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary" onclick="cemeteryManager.editAnnotation(${
                          annotation.id
                        })" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-${
                          annotation.is_visible == 1 ? "secondary" : "success"
                        }" 
                                onclick="cemeteryManager.toggleAnnotationVisibility(${
                                  annotation.id
                                })" 
                                title="${
                                  annotation.is_visible == 1 ? "Hide" : "Show"
                                }">
                            <i class="fas fa-eye${
                              annotation.is_visible == 1 ? "-slash" : ""
                            }"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cemeteryManager.deleteAnnotation(${
                          annotation.id
                        })" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");
  }

  editAnnotation(id) {
    // Find the annotation data
    const annotation = this.annotations?.find((a) => a.id == id);
    if (!annotation) {
      CustomToast.show("danger", "Annotation not found");
      return;
    }

    // Populate the form with existing data
    document.getElementById("annotationId").value = annotation.id;
    document.getElementById("annotationLabel").value = annotation.label || "";
    document.getElementById("annotationColor").value =
      annotation.color || "#FF0000";
    document.getElementById("annotationNotes").value = annotation.notes || "";
    document.getElementById("annotationSortOrder").value =
      annotation.sort_order || 0;
    document.getElementById("annotationVisible").checked =
      annotation.is_visible == 1;
    document.getElementById("annotationActive").checked =
      annotation.is_active == 1;

    // Update form action
    document.querySelector('#annotationForm [name="action"]').value =
      "updateLayerAnnotation";

    // Update modal title
    document.getElementById("annotationModalLabel").textContent =
      "Edit Annotation";

    // Show modal
    new bootstrap.Modal(document.getElementById("annotationModal")).show();
  }

  // Delete Functions
  deleteCemetery(id) {
    this.confirmDeleteAction = () => this.performDelete("deleteCemetery", id);
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  deleteRoad(id) {
    this.confirmDeleteAction = () => this.performDelete("deleteRoad", id);
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  deleteBurial(id) {
    this.confirmDeleteAction = () =>
      this.performDelete("deleteBurialRecord", id);
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  deleteGravePlot(id) {
    this.confirmDeleteAction = () => this.performDelete("deleteGravePlot", id);
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  deleteAnnotation(id) {
    this.confirmDeleteAction = () =>
      this.performDelete("deleteLayerAnnotation", id);
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  async confirmDelete() {
    if (this.confirmDeleteAction) {
      await this.confirmDeleteAction();
      bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      ).hide();
    }
  }

  async performDelete(action, id) {
    try {
      const formData = new FormData();
      formData.append("action", action);
      formData.append("id", id);

      const response = await axios.post(this.cemeteryAPI, formData, {
        headers: this.authManager.API_CONFIG.getFormHeaders(),
      });

      if (response.data.success) {
        CustomToast.show("success", "Item deleted successfully");
        this.loadData();
      } else {
        CustomToast.show(
          "danger",
          response.data.message || "Failed to delete item"
        );
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      if (error.response && error.response.status === 401) {
        CustomToast.show(
          "danger",
          "Authentication Error",
          "Please login again"
        );
        // Redirect to login page
        window.location.href = "../../auth/login.php";
      } else {
        CustomToast.show("danger", "Error deleting item");
      }
    }
  }

  showAlert(message, type = "info") {
    // Create a simple alert - you could enhance this with toast notifications
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = "20px";
    alertDiv.style.right = "20px";
    alertDiv.style.zIndex = "9999";
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  }

  escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str.replace(
      /[&<>"]/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
        }[s])
    );
  }
}

// Global functions for modal management are now handled by ModalManager class

// Initialize the cemetery manager when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Check if required libraries are already loaded
  if (
    typeof maplibregl !== "undefined" &&
    typeof THREE !== "undefined" &&
    typeof THREE.GLTFLoader !== "undefined"
  ) {
    // All libraries available, initialize immediately
    window.cemeteryManager = new CemeteryManager();
    return;
  }

  // Decide which scripts we still need
  const scripts = [];
  if (typeof maplibregl === "undefined") {
    scripts.push("https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js");
  }
  if (typeof THREE === "undefined") {
    scripts.push(
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    );
  }
  if (typeof THREE === "undefined" || typeof THREE.GLTFLoader === "undefined") {
    scripts.push(
      "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"
    );
  }

  const styles = ["https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css"];

  // Load CSS first
  styles.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });

  let loadedScripts = 0;

  function loadNextScript(index) {
    if (index >= scripts.length) {
      // All scripts loaded, wait a bit and initialize
      setTimeout(() => {
        if (typeof maplibregl !== "undefined") {
          window.cemeteryManager = new CemeteryManager();
        } else {
          console.error("Required libraries not loaded properly");
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = scripts[index];
    script.onload = () => {
      loadedScripts++;
      console.log(
        `Loaded script ${index + 1}/${scripts.length}: ${scripts[index]}`
      );
      loadNextScript(index + 1);
    };
    script.onerror = () => {
      console.error(`Failed to load script: ${scripts[index]}`);
    };
    document.head.appendChild(script);
  }

  // Start loading scripts sequentially
  loadNextScript(0);
});
