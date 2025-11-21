// Enhanced Real-Time Location and Navigation System for Cemetery Management
class LocationTracker {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.map = cemeteryManager.map;
        
        // Location tracking state
        this.isTracking = false;
        this.watchId = null;
        this.currentPosition = null;
        this.locationHistory = [];
        this.maxHistoryLength = 50;
        
        this.deviceOrientation = null;
        this.heading = 0; // raw heading in degrees (0..360)
        this.headingSmoothed = 0; // smoothed heading for stable map rotation
        this.headingSmoothingFactor = 0.2; // 0..1, higher = more responsive, lower = smoother
        this.isOrientationSupported = false;
        
        // Navigation state
        this.currentRoute = null;
        this.routeInstructions = [];
        this.currentInstructionIndex = 0;
        this.navigationMode = false;
        
        // Follow mode state: when enabled, recenter map on location updates
        this.followMode = false;

        // UI elements
        this.locationMarker = null;
        this.accuracyCircle = null;
        this.directionArrow = null;
        this.navigationPanel = null;
        
        // Performance optimization
        this.lastUpdateTime = 0;
        this.updateInterval = 1000; // 1 second minimum between updates
        
        this.initializeOrientationSupport();
        this.createNavigationUI();
        this.setupEventListeners();
    }
    
    // Initialize device orientation support
    initializeOrientationSupport() {
        // Check if device orientation is supported
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            this.isOrientationSupported = true;
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            this.isOrientationSupported = true;
        }
        
        if (this.isOrientationSupported) {
            this.setupOrientationListeners();
        }
    }
    
    // Setup device orientation listeners
    async setupOrientationListeners() {
        try {
            // Request permission on iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    console.warn('Device orientation permission denied');
                    this.isOrientationSupported = false;
                    return;
                }
            }
            
            // Prefer absolute orientation events when available
            const orientationHandler = (event) => {
                this.handleDeviceOrientation(event);
            };
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', orientationHandler, true);
            } else {
                window.addEventListener('deviceorientation', orientationHandler, true);
            }
            
            console.log('Device orientation tracking enabled');
        } catch (error) {
            console.warn('Failed to setup device orientation:', error);
            this.isOrientationSupported = false;
        }
    }
    
    // Get current screen orientation angle in degrees (0, 90, 180, 270)
    getScreenOrientationAngle() {
        try {
            if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
                return (window.screen.orientation.angle % 360 + 360) % 360;
            }
            if (typeof window.orientation === 'number') {
                return (window.orientation % 360 + 360) % 360;
            }
        } catch (_) {}
        return 0;
    }

    // Compute the correct map bearing so the phone's front points up on the map
    computeMapBearing() {
        if (this.headingSmoothed === null || this.headingSmoothed === undefined) return null;
        const screenAngle = this.getScreenOrientationAngle();
        const headingDeg = (this.headingSmoothed % 360 + 360) % 360;
        // Compensate for current screen orientation
        const adjusted = (headingDeg + screenAngle) % 360;
        // Rotate map so device-facing direction is at the top
        const mapBearing = (360 - adjusted) % 360;
        return mapBearing;
    }

    // Handle device orientation events
    handleDeviceOrientation(event) {
        if (!this.isTracking) return;
        
        // Get compass heading from device orientation
        let heading = event.alpha;
        
        // iOS Safari uses different coordinate system
        if (event.webkitCompassHeading !== undefined) {
            heading = event.webkitCompassHeading;
        }
        
        // Handle different browser implementations
        if (heading === null || heading === undefined) {
            // Fallback calculation
            const alpha = event.alpha;
            const beta = event.beta;
            const gamma = event.gamma;
            
            if (alpha !== null) {
                heading = alpha;
            }
        }
        
        // If event.absolute explicitly false, readings may be relative and inaccurate
        // We'll still smooth and use course heading when moving to improve perceived accuracy
        
        if (heading !== null && heading !== undefined) {
            // Normalize to 0..360
            const normalized = (heading % 360 + 360) % 360;
            this.heading = normalized;
            // Exponential smoothing to stabilize jittery compass readings
            if (typeof this.headingSmoothed !== 'number' || Number.isNaN(this.headingSmoothed)) {
                this.headingSmoothed = normalized;
            } else {
                // Handle wrap-around (e.g., 359 -> 1) by choosing shortest angular distance
                let delta = normalized - this.headingSmoothed;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                this.headingSmoothed = (this.headingSmoothed + this.headingSmoothingFactor * delta + 360) % 360;
            }

            // Update map bearing in real-time when follow mode is active
            if (this.followMode && this.map) {
                const bearing = this.computeMapBearing();
                if (bearing !== null) {
                    this.map.setBearing(bearing);
                }
            }
        }
    }
    async toggleFollowMode() {
        try {
            if (!this.isTracking) {
                await this.startLocationTracking();
            }
            this.followMode = !this.followMode;
            if (this.followMode && this.currentPosition) {
                const { lat, lng } = this.currentPosition;
                // Ensure a consistent, flat camera when starting follow
                if (typeof this.map.setPitch === 'function') {
                    this.map.setPitch(0);
                }
                this.map.setCenter([lng, lat]);
                
                // Set initial bearing if available
                const bearing = this.computeMapBearing();
                if (bearing !== null) {
                    this.map.setBearing(bearing);
                }
            } else if (!this.followMode) {
                // Reset bearing to north when follow mode is disabled
                this.map.setBearing(0);
            }
            return this.followMode;
        } catch (err) {
            console.error('Failed to toggle follow mode:', err);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('error', 'Location', 'Unable to access location');
            }
            return false;
        }
    }
     
    // Create navigation UI elements
    createNavigationUI() {
        // Get existing navigation panel
        this.navigationPanel = document.getElementById('navigation-panel');
        if (!this.navigationPanel) {
            console.error('Navigation panel element not found');
            return;
        }
        
        // Add nav-size class if not present
        if (!this.navigationPanel.classList.contains('nav-size')) {
            this.navigationPanel.classList.add('nav-size');
        }
        
        // <button class="btn btn-sm btn-outline-danger" id="stopNavigationBtn" title="Stop Navigation">
        //     <i class="fas fa-stop"></i>
        // </button>
        // <button class="btn btn-sm btn-outline-secondary" id="closeNavigationBtn" title="Close">
        //     <i class="fas fa-times"></i>
        // </button>
        // Populate navigation panel with content using Bootstrap card-footer style
        this.navigationPanel.innerHTML = `
            <div class="card-footer bg-light border-top">
                <div class="row align-items-center">
                    <div class="col-md-3 col-6">
                        <div class="text-center">
                            <div class="h4 mb-0 text-primary" id="distanceToDestination">--</div>
                            <small class="text-muted" id="distanceUnit">m</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="text-center">
                            <div class="h3 mb-1" id="directionArrow">↑</div>
                            <small class="text-muted" id="directionText">Head straight</small>
                        </div>
                    </div>
                    <div class="col-md-4 d-none d-md-block">
                        <small class="text-muted" id="nextTurn">Continue straight</small>
                    </div>
                    <div class="col-md-2 col-12 mt-2 mt-md-0">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-sm btn-outline-primary" id="centerOnLocationBtn" title="Center">
                                <i class="fas fa-crosshairs"></i>
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add minimal CSS styles for navigation panel
        const style = document.createElement('style');
        style.textContent = `
            .navigation-panel {
                position: relative;
                width: 100%;
                background: transparent;
                border: none;
                padding: 0;
                margin: 0;
                display: none;
            }
            
            .navigation-panel.show {
                display: block;
            }
            
            .location-marker {
                width: 20px;
                height: 20px;
                background: #007bff;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                position: relative;
            }
            
            .location-marker::after {
                content: '';
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 12px solid #007bff;
            }
            
            .direction-arrow-marker {
                width: 30px;
                height: 30px;
                background: rgba(220, 53, 69, 0.8);
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
        `;
        
        document.head.appendChild(style);
        
        this.setupNavigationEventListeners();
    }
    
    // Setup navigation panel event listeners
    setupNavigationEventListeners() {
        const closeBtn = document.getElementById('closeNavigationBtn');
        const stopBtn = document.getElementById('stopNavigationBtn');
        const centerBtn = document.getElementById('centerOnLocationBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideNavigationPanel());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopNavigation());
        }
        
        if (centerBtn) {
            centerBtn.addEventListener('click', () => this.centerOnLocation());
        }
    }
    
    // Setup main event listeners
    setupEventListeners() {
        // Listen for grave plot location data
        window.addEventListener('storage', (event) => {
            if (event.key === 'gravePlotLocation') {
                this.handleGravePlotLocation(event.newValue);
            }
        });
        
        // Listen for sessionStorage changes (same tab)
        const originalSetItem = sessionStorage.setItem;
        sessionStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'gravePlotLocation') {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: key,
                    newValue: value
                }));
            }
        };
    }
    
    // Handle grave plot location from sessionStorage
    handleGravePlotLocation(gravePlotDataStr) {
        if (!gravePlotDataStr) return;
        
        try {
            const gravePlotData = JSON.parse(gravePlotDataStr);
            const { lat, lng } = gravePlotData;
            
            if (lat && lng) {
                this.startNavigationToGrave(lat, lng, gravePlotData);
            }
        } catch (error) {
            console.error('Error parsing grave plot location:', error);
        }
    }
    
    // Start navigation to a grave plot
    async startNavigationToGrave(targetLat, targetLng, graveData) {
        try {
            // Start location tracking if not already active
            if (!this.isTracking) {
                await this.startLocationTracking();
            }
            
            // Set navigation mode
            this.navigationMode = true;
            this.navigationTarget = { lat: targetLat, lng: targetLng, data: graveData };
            
            // Calculate initial route
            await this.calculateRouteToTarget();
            
            // Show navigation panel
            this.showNavigationPanel();
            
            // Update UI with grave information
            this.updateNavigationInfo();
            
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success', `Navigation started to ${graveData.deceasedName || 'Grave'}`);
            }
            
        } catch (error) {
            console.error('Error starting navigation to grave:', error);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('error', 'Failed to start navigation');
            }
        }
    }
    
    // Start real-time location tracking
    async startLocationTracking() {
        if (this.isTracking) {
            console.log('Location tracking already active');
            return;
        }
        
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }
        
        return new Promise((resolve, reject) => {
            // Get initial position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleLocationUpdate(position);
                    this.isTracking = true;
                    resolve();
                },
                (error) => {
                    reject(new Error(this.getLocationErrorMessage(error)));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 100
                }
            );
            
            // Start watching position
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handleLocationUpdate(position),
                (error) => console.warn('Location watch error:', error),
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 200
                }
            );
        });
    }
    
    // Handle location updates
    handleLocationUpdate(position) {
        const now = Date.now();
        
        // Throttle updates for performance
        if (now - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const speed = position.coords.speed || 0;
        
        // Update current position
        this.currentPosition = { lat, lng, accuracy, speed, timestamp: now };
        
        // Add to history
        this.locationHistory.push(this.currentPosition);
        if (this.locationHistory.length > this.maxHistoryLength) {
            this.locationHistory.shift();
        }
        
        // Update location marker
        this.updateLocationMarker(lat, lng, accuracy);
        
        // Center map if follow mode is active
        if (this.followMode) {
            this.map.setCenter([lng, lat]);
        }
        
        // Update navigation if active
        if (this.navigationMode && this.navigationTarget) {
            this.updateNavigation();
        }
        
        // Update routing if user location is active in cemetery manager
        if (this.cemeteryManager.isUserLocationActive) {
            this.updateCemeteryManagerLocation();
        }
        
        this.lastUpdateTime = now;
    }
    
    // Update location marker on map
    updateLocationMarker(lat, lng, accuracy) {
        // Remove existing marker
        if (this.locationMarker) {
            this.locationMarker.remove();
        }
        
        // Create new marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'location-marker';
        markerEl.title = `Your Location (±${Math.round(accuracy)}m)`;
        
        // Create marker
        this.locationMarker = new maplibregl.Marker({
            element: markerEl,
            anchor: 'bottom'
        })
        .setLngLat([lng, lat])
        .addTo(this.map);
        
        // Update accuracy circle
        // this.updateAccuracyCircle(lat, lng, accuracy);
        
        // Update direction arrow if orientation is available
        if (this.isOrientationSupported) {
            // this.updateDirectionArrow();
        }
    }
    
    // Update accuracy circle
    updateAccuracyCircle(lat, lng, accuracy) {
        if (this.accuracyCircle) {
            this.accuracyCircle.remove();
        }
        
        const circleEl = document.createElement('div');
        circleEl.style.width = `${Math.max(accuracy * 2, 20)}px`;
        circleEl.style.height = `${Math.max(accuracy * 2, 20)}px`;
        circleEl.style.border = '2px solid #007bff';
        circleEl.style.borderRadius = '50%';
        circleEl.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        circleEl.style.position = 'absolute';
        circleEl.style.left = '50%';
        circleEl.style.top = '50%';
        circleEl.style.transform = 'translate(-50%, -50%)';
        circleEl.style.pointerEvents = 'none';
        
        this.accuracyCircle = new maplibregl.Marker({
            element: circleEl
        })
        .setLngLat([lng, lat])
        .addTo(this.map);
    }
    
    // Update direction arrow based on device orientation
    updateDirectionArrow() {
        if (!this.currentPosition || !this.isOrientationSupported) return;
        
        // Remove existing direction arrow
        if (this.directionArrow) {
            this.directionArrow.remove();
        }
        
        // Create direction arrow element
        const arrowEl = document.createElement('div');
        arrowEl.className = 'direction-arrow-marker';
        arrowEl.textContent = this.getDirectionSymbol(this.heading);
        arrowEl.style.transform = `rotate(${this.heading}deg)`;
        
        // Position arrow slightly offset from location marker
        const offsetDistance = 0.0001; // Small offset in degrees
        const offsetLat = this.currentPosition.lat + offsetDistance;
        const offsetLng = this.currentPosition.lng;
        
        this.directionArrow = new maplibregl.Marker({
            element: arrowEl
        })
        .setLngLat([offsetLng, offsetLat])
        .addTo(this.map);
        
        // Update navigation UI direction
        if (this.navigationMode) {
            this.updateNavigationDirection();
        }
    }
    
    // Get direction symbol based on heading
    getDirectionSymbol(heading) {
        const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
        const index = Math.round(heading / 45) % 8;
        return directions[index];
    }
    
    // Calculate route to navigation target
    async calculateRouteToTarget() {
        if (!this.currentPosition || !this.navigationTarget) return;
        
        try {
            // Use cemetery manager's routing system
            const cemeteryManager = this.cemeteryManager;
            
            // Find nearest road nodes
            const startNode = cemeteryManager.findNearestGraphNode({
                lat: this.currentPosition.lat,
                lng: this.currentPosition.lng
            });
            
            const endNode = cemeteryManager.findNearestGraphNode({
                lat: this.navigationTarget.lat,
                lng: this.navigationTarget.lng
            });
            
            if (!startNode || !endNode) {
                throw new Error('Could not find route - no nearby roads');
            }
            
            // Calculate route using Dijkstra
            const route = cemeteryManager.dijkstra(startNode.id, endNode.id);
            
            if (route.pathCoords && route.pathCoords.length > 0) {
                this.currentRoute = route;
                this.generateRouteInstructions(route.pathCoords);
                
                // Render route on map
                cemeteryManager.renderRoute(route.pathCoords, route.distanceMeters);
                
                console.log('Route calculated:', route.distanceMeters, 'meters');
            } else {
                throw new Error('No route found');
            }
            
        } catch (error) {
            console.error('Route calculation error:', error);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning', 'Could not calculate route. Showing direct path.');
            }
            
            // Fallback to direct path
            this.currentRoute = {
                pathCoords: [
                    [this.currentPosition.lat, this.currentPosition.lng],
                    [this.navigationTarget.lat, this.navigationTarget.lng]
                ],
                distanceMeters: this.cemeteryManager.haversineMeters(
                    this.currentPosition.lat, this.currentPosition.lng,
                    this.navigationTarget.lat, this.navigationTarget.lng
                )
            };
        }
    }
    
    // Generate turn-by-turn instructions
    generateRouteInstructions(pathCoords) {
        this.routeInstructions = [];
        
        if (pathCoords.length < 2) return;
        
        for (let i = 0; i < pathCoords.length - 1; i++) {
            const current = pathCoords[i];
            const next = pathCoords[i + 1];
            
            let instruction = 'Continue straight';
            let distance = this.cemeteryManager.haversineMeters(
                current[0], current[1], next[0], next[1]
            );
            
            // Determine turn direction if this isn't the last segment
            if (i < pathCoords.length - 2) {
                const prev = pathCoords[i];
                const curr = pathCoords[i + 1];
                const next = pathCoords[i + 2];
                
                const angle = this.calculateBearing(prev, curr, next);
                
                if (Math.abs(angle) < 15) {
                    instruction = 'Continue straight';
                } else if (angle > 15) {
                    instruction = 'Turn right';
                } else if (angle < -15) {
                    instruction = 'Turn left';
                }
            } else {
                instruction = 'Arrive at destination';
            }
            
            this.routeInstructions.push({
                instruction,
                distance,
                coordinates: next
            });
        }
    }
    
    // Calculate bearing between three points
    calculateBearing(point1, point2, point3) {
        const bearing1 = this.getBearing(point1, point2);
        const bearing2 = this.getBearing(point2, point3);
        return bearing2 - bearing1;
    }
    
    // Get bearing between two points
    getBearing(point1, point2) {
        const lat1 = point1[0] * Math.PI / 180;
        const lat2 = point2[0] * Math.PI / 180;
        const deltaLng = (point2[1] - point1[1]) * Math.PI / 180;
        
        const y = Math.sin(deltaLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }
    
    // Update navigation information
    updateNavigation() {
        if (!this.currentPosition || !this.navigationTarget) return;
        
        // Calculate distance to target
        const distance = this.cemeteryManager.haversineMeters(
            this.currentPosition.lat, this.currentPosition.lng,
            this.navigationTarget.lat, this.navigationTarget.lng
        );
        
        // Update distance display
        this.updateDistanceDisplay(distance);
        
        // Update direction and next turn
        this.updateNavigationDirection();
        
        // Check if arrived
        if (distance < 5) { // Within 5 meters
            this.handleArrival();
        }
    }
    
    // Update distance display
    updateDistanceDisplay(distance) {
        const distanceElement = document.getElementById('distanceToDestination');
        const unitElement = document.getElementById('distanceUnit');
        if (!distanceElement || !unitElement) return;
        
        if (distance < 1000) {
            distanceElement.textContent = Math.round(distance);
            unitElement.textContent = 'm';
        } else {
            distanceElement.textContent = (distance / 1000).toFixed(1);
            unitElement.textContent = 'km';
        }
    }
    
    // Update navigation direction
    updateNavigationDirection() {
        if (!this.currentPosition || !this.navigationTarget) return;
        
        // Calculate bearing to target
        const bearing = this.getBearing(
            [this.currentPosition.lat, this.currentPosition.lng],
            [this.navigationTarget.lat, this.navigationTarget.lng]
        );
        
        // Calculate relative direction based on device orientation
        let relativeBearing = bearing - this.heading;
        if (relativeBearing < 0) relativeBearing += 360;
        if (relativeBearing > 360) relativeBearing -= 360;
        
        // Update direction arrow
        const directionArrow = document.getElementById('directionArrow');
        if (directionArrow) {
            directionArrow.textContent = this.getDirectionSymbol(relativeBearing);
            directionArrow.style.transform = `rotate(${relativeBearing}deg)`;
        }
        
        // Update direction text
        const directionText = document.getElementById('directionText');
        if (directionText) {
            directionText.textContent = this.getDirectionText(relativeBearing);
        }
        
        // Update next turn instruction
        this.updateNextTurnInstruction();
    }
    
    // Get direction text based on relative bearing
    getDirectionText(relativeBearing) {
        if (relativeBearing < 22.5 || relativeBearing > 337.5) {
            return 'Head straight';
        } else if (relativeBearing < 67.5) {
            return 'Slight right';
        } else if (relativeBearing < 112.5) {
            return 'Turn right';
        } else if (relativeBearing < 157.5) {
            return 'Sharp right';
        } else if (relativeBearing < 202.5) {
            return 'Turn around';
        } else if (relativeBearing < 247.5) {
            return 'Sharp left';
        } else if (relativeBearing < 292.5) {
            return 'Turn left';
        } else {
            return 'Slight left';
        }
    }
    
    // Update next turn instruction
    updateNextTurnInstruction() {
        const nextTurnElement = document.getElementById('nextTurn');
        if (!nextTurnElement || !this.routeInstructions.length) return;
        
        // Find current instruction based on position
        let currentInstruction = this.routeInstructions[0];
        let minDistance = Infinity;
        
        for (const instruction of this.routeInstructions) {
            const distance = this.cemeteryManager.haversineMeters(
                this.currentPosition.lat, this.currentPosition.lng,
                instruction.coordinates[0], instruction.coordinates[1]
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                currentInstruction = instruction;
            }
        }
        
        if (currentInstruction && minDistance < 50) { // Within 50 meters of next instruction
            nextTurnElement.innerHTML = `
                <small class="text-muted">${currentInstruction.instruction} in ${Math.round(minDistance)}m</small>
            `;
        } else {
            nextTurnElement.innerHTML = '<small class="text-muted">Continue on current path</small>';
        }
    }
    
    // Handle arrival at destination
    // handleArrival() {
    //     if (typeof CustomToast !== 'undefined') {
    //         const graveName = this.navigationTarget.data?.deceasedName || 'Grave';
    //         CustomToast.show('success', `You have arrived at ${graveName}`);
    //     }
        
    //     // Stop navigation after a delay
    //     setTimeout(() => {
    //         this.stopNavigation();
    //     }, 5000);
    // }
    
 
    // Handle arrival at destination
    async handleArrival() {
        if (typeof CustomToast !== 'undefined') {
            const graveData = this.navigationTarget.data?.record;
            const graveName = this.navigationTarget.data?.deceasedName || 'Grave';
            CustomToast.show('success', `You have arrived at ${graveName}`);
            this.stopNavigation();
            this.showArrivalModal(graveData);
        }

        // Fetch grave details and show modal
  
    }
    
    // Show arrival modal with grave details
    async showArrivalModal(graveData) {
        try {
            const arrivalModal = new bootstrap.Modal(document.getElementById('arrivalModal'));
            arrivalModal.show();
            this.populateArrivalModal(graveData);

        } catch (error) {
            console.error('Error showing arrival modal:', error);
        }
    }
    
    // Populate arrival modal with grave data
    populateArrivalModal(graveData) {
        // Extract the record data from the navigation target
        const record = graveData;
        // Set deceased name
        const deceasedNameEl = document.getElementById('arrivalDeceasedName');
        if (deceasedNameEl) {
            deceasedNameEl.textContent = record.deceased_name || 'Unknown';
        }
        
        // Set grave number
        const graveNumberEl = document.getElementById('arrivalGraveNumber');
        if (graveNumberEl) {
            graveNumberEl.textContent = `Grave Number: ${record.grave_number || 'N/A'}`;
        }
        
        // Populate image gallery
        const imageGalleryEl = document.getElementById('arrivalImageGallery');
        if (imageGalleryEl && record.image_path) {
            // Split multiple image paths (comma-separated)
            const imagePaths = record.image_path.split(',').map(path => path.trim()).filter(path => path);
            
            if (imagePaths.length > 0) {
                imageGalleryEl.innerHTML = `
                    <div class="row g-3">
                        ${imagePaths.map((imagePath, index) => `
                            <div class="col-md-${imagePaths.length === 1 ? '12' : '6'}">
                                <div class="card border-0 shadow-sm">
                                    <img src="${imagePath}" 
                                         class="card-img-top" 
                                         alt="Grave Image ${index + 1}"
                                         style="height: 200px; object-fit: cover; cursor: pointer;"
                                         onclick="showImagePreview('${imagePath}', ${index + 1})">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                imageGalleryEl.innerHTML = '<p class="text-muted text-center">No images available</p>';
            }
        } else {
            imageGalleryEl.innerHTML = '<p class="text-muted text-center">No images available</p>';
        }
        
        // Populate additional information
        const additionalInfoEl = document.getElementById('arrivalAdditionalInfo');
        if (additionalInfoEl) {
            let infoHTML = '<div class="row g-1">';
            
            // Show single record details
            infoHTML += `
                <div class="col-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <small class="text-muted">Date of Birth</small>
                            <small class="mb-0 fw-semibold">
                                ${record.date_of_birth ? new Date(record.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <small class="text-muted">Date of Death</small>
                            <small class="mb-0 fw-semibold">
                                ${record.date_of_death ? new Date(record.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <small class="text-muted">Burial Date</small>
                            <small class="mb-0 fw-semibold">
                                ${record.burial_date ? new Date(record.burial_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <small class="text-muted">Next of Kin</small>
                            <small class="mb-0 fw-semibold">${record.next_of_kin || 'N/A'}</small>
                        </div>
                    </div>
                </div>
                ${record.notes ? `
                    <div class="col-12">
                        <div class="card border-0 bg-light">
                            <div class="card-body">
                                <small class="text-muted">Notes</small>
                                <small class="mb-0">${record.notes}</small>
                            </div>
                        </div>
                    </div>
                ` : ''}
            `;
            
            infoHTML += '</div>';
            additionalInfoEl.innerHTML = infoHTML;
        }
        
        // Setup "View Details" button to open full record details
        const viewDetailsBtn = document.getElementById('arrivalViewDetails');
        if (viewDetailsBtn) {
            viewDetailsBtn.onclick = () => {
                // Close the arrival modal
                const arrivalModal = bootstrap.Modal.getInstance(document.getElementById('arrivalModal'));
                if (arrivalModal) {
                    arrivalModal.hide();
                }
                
                // You can add logic here to open a detailed view page or another modal
                console.log('View details for grave:', record.grave_number);
            };
        }
    }

    // Show navigation panel
    showNavigationPanel() {
        if (this.navigationPanel) {
            this.navigationPanel.style.display = 'block';
            this.navigationPanel.classList.add('show');
        }
    }
    
    // Hide navigation panel
    hideNavigationPanel() {
        if (this.navigationPanel) {
            this.navigationPanel.classList.remove('show');
            this.navigationPanel.style.display = 'none';
        }
    }
    
    // Stop navigation
    stopNavigation() {
        this.navigationMode = false;
        this.navigationTarget = null;
        this.currentRoute = null;
        this.routeInstructions = [];
        
        this.hideNavigationPanel();
        
        // Clear route from map
        this.cemeteryManager.clearRoute();
        
        if (typeof CustomToast !== 'undefined') {
            CustomToast.show('info', 'Navigation stopped');
        }
    }
    
    // Center map on current location
    centerOnLocation() {
        if (this.currentPosition && this.locationMarker) {
            this.map.setCenter([this.currentPosition.lng, this.currentPosition.lat]);
            this.map.setZoom(18);
        }
    }
    
    // Update cemetery manager location
    updateCemeteryManagerLocation() {
        if (!this.currentPosition) return;
        
        // Update cemetery manager's user location
        this.cemeteryManager.userCurrentLocation = this.currentPosition;
        
        // Update start point if routing is active
        if (this.cemeteryManager.graphNodes.length > 0) {
            const snapped = this.cemeteryManager.findNearestGraphNode({
                lat: this.currentPosition.lat,
                lng: this.currentPosition.lng
            });
            
            if (snapped && this.cemeteryManager.startMarker) {
                this.cemeteryManager.startMarker.setLngLat([snapped.lng, snapped.lat]);
                
                // Auto-recalculate route if end point exists
                if (this.cemeteryManager.endPoint) {
                    this.cemeteryManager.findRoute();
                }
            }
        }
    }
    
    // Update navigation info with grave data
    updateNavigationInfo() {
        if (!this.navigationTarget || !this.navigationTarget.data) return;
        
        const graveData = this.navigationTarget.data;
        // Since we removed the header, we can add the grave name to the next turn section
        const nextTurnElement = document.getElementById('nextTurn');
        
        if (nextTurnElement && graveData.deceasedName) {
            nextTurnElement.innerHTML = `
                <small class="text-muted">Navigating to: <strong>${graveData.deceasedName}</strong></small>
            `;
        }
    }
    
    // Get location error message
    getLocationErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please enable location permissions.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information unavailable.';
            case error.TIMEOUT:
                return 'Location request timed out.';
            default:
                return 'Location error: ' + error.message;
        }
    }
    
    // Stop location tracking
    stopLocationTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        
        // Remove markers
        if (this.locationMarker) {
            this.locationMarker.remove();
            this.locationMarker = null;
        }
        
        if (this.accuracyCircle) {
            this.accuracyCircle.remove();
            this.accuracyCircle = null;
        }
        
        if (this.directionArrow) {
            this.directionArrow.remove();
            this.directionArrow = null;
        }
        
        // Stop navigation
        this.stopNavigation();
        
        console.log('Location tracking stopped');
    }
    
    // Get current location
    getCurrentLocation() {
        return this.currentPosition;
    }
    
    // Get location history
    getLocationHistory() {
        return this.locationHistory;
    }
    
    // Check if tracking is active
    isLocationTrackingActive() {
        return this.isTracking;
    }
    
    // Check if navigation is active
    isNavigationActive() {
        return this.navigationMode;
    }
}

// Global function for image preview (accessible from onclick)
function showImagePreview(imagePath, imageNumber) {
    // Create image preview modal if it doesn't exist
    let imageModal = document.getElementById('imagePreviewModal');
    if (!imageModal) {
        imageModal = document.createElement('div');
        imageModal.id = 'imagePreviewModal';
        imageModal.className = 'modal fade';
        imageModal.setAttribute('tabindex', '-1');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Grave Image ${imageNumber}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center p-0">
                        <img id="previewImage" src="${imagePath}" class="img-fluid" style="max-height: 70vh; width: 100%; object-fit: contain;" alt="Grave Image ${imageNumber}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(imageModal);
    }
    
    // Update the image source
    const previewImage = document.getElementById('previewImage');
    if (previewImage) {
        previewImage.src = imagePath;
        previewImage.alt = `Grave Image ${imageNumber}`;
    }
    
    // Update modal title
    const modalTitle = imageModal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Grave Image ${imageNumber}`;
    }
    
    // Update the "Open in New Tab" button
    const openButton = imageModal.querySelector('.btn-primary');
    if (openButton) {
        openButton.onclick = () => window.open(imagePath, '_blank');
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(imageModal);
    modal.show();
}

// Export for global use
if (typeof window !== 'undefined') {
    window.LocationTracker = LocationTracker;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationTracker;
}
