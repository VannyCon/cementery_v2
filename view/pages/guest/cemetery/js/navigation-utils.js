// Navigation Utilities for Cemetery Management System
class NavigationUtils {
    constructor() {
        this.earthRadius = 6371000; // Earth radius in meters
    }
    
    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return this.earthRadius * c;
    }
    
    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    // Convert radians to degrees
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    // Calculate bearing between two points
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = this.toRadians(lng2 - lng1);
        
        const y = Math.sin(dLng) * Math.cos(this.toRadians(lat2));
        const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
                  Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLng);
        
        let bearing = this.toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }
    
    // Calculate relative bearing (difference between device heading and target bearing)
    calculateRelativeBearing(deviceHeading, targetBearing) {
        let relativeBearing = targetBearing - deviceHeading;
        if (relativeBearing < 0) relativeBearing += 360;
        if (relativeBearing > 360) relativeBearing -= 360;
        return relativeBearing;
    }
    
    // Get compass direction from bearing
    getCompassDirection(bearing) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                           'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(bearing / 22.5) % 16;
        return directions[index];
    }
    
    // Get navigation instruction from relative bearing
    getNavigationInstruction(relativeBearing, distance) {
        let instruction = '';
        let distanceText = '';
        
        // Format distance
        if (distance < 1000) {
            distanceText = `${Math.round(distance)}m`;
        } else {
            distanceText = `${(distance / 1000).toFixed(1)}km`;
        }
        
        // Determine direction instruction
        if (relativeBearing < 22.5 || relativeBearing > 337.5) {
            instruction = `Head straight for ${distanceText}`;
        } else if (relativeBearing < 67.5) {
            instruction = `Slight right for ${distanceText}`;
        } else if (relativeBearing < 112.5) {
            instruction = `Turn right for ${distanceText}`;
        } else if (relativeBearing < 157.5) {
            instruction = `Sharp right for ${distanceText}`;
        } else if (relativeBearing < 202.5) {
            instruction = `Turn around for ${distanceText}`;
        } else if (relativeBearing < 247.5) {
            instruction = `Sharp left for ${distanceText}`;
        } else if (relativeBearing < 292.5) {
            instruction = `Turn left for ${distanceText}`;
        } else {
            instruction = `Slight left for ${distanceText}`;
        }
        
        return instruction;
    }
    
    // Get arrow symbol for direction
    getDirectionArrow(relativeBearing) {
        if (relativeBearing < 22.5 || relativeBearing > 337.5) {
            return '↑'; // Straight
        } else if (relativeBearing < 67.5) {
            return '↗'; // Slight right
        } else if (relativeBearing < 112.5) {
            return '→'; // Right
        } else if (relativeBearing < 157.5) {
            return '↘'; // Sharp right
        } else if (relativeBearing < 202.5) {
            return '↓'; // Turn around
        } else if (relativeBearing < 247.5) {
            return '↙'; // Sharp left
        } else if (relativeBearing < 292.5) {
            return '←'; // Left
        } else {
            return '↖'; // Slight left
        }
    }
    
    // Calculate estimated time of arrival
    calculateETA(distance, speed) {
        if (!speed || speed <= 0) {
            // Assume walking speed of 1.4 m/s (5 km/h)
            speed = 1.4;
        }
        
        const timeInSeconds = distance / speed;
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    // Smooth location updates using Kalman filter-like approach
    smoothLocationUpdate(newLocation, previousLocation, alpha = 0.3) {
        if (!previousLocation) {
            return newLocation;
        }
        
        return {
            lat: previousLocation.lat + alpha * (newLocation.lat - previousLocation.lat),
            lng: previousLocation.lng + alpha * (newLocation.lng - previousLocation.lng),
            accuracy: Math.max(newLocation.accuracy, previousLocation.accuracy),
            timestamp: newLocation.timestamp
        };
    }
    
    // Check if location has moved significantly
    hasLocationChanged(location1, location2, threshold = 5) {
        if (!location1 || !location2) return true;
        
        const distance = this.calculateDistance(
            location1.lat, location1.lng,
            location2.lat, location2.lng
        );
        
        return distance > threshold;
    }
    
    // Generate turn-by-turn instructions for a route
    generateTurnByTurnInstructions(routeCoords) {
        if (!routeCoords || routeCoords.length < 2) {
            return [];
        }
        
        const instructions = [];
        
        for (let i = 0; i < routeCoords.length - 1; i++) {
            const current = routeCoords[i];
            const next = routeCoords[i + 1];
            
            let instruction = {
                distance: this.calculateDistance(current[0], current[1], next[0], next[1]),
                bearing: this.calculateBearing(current[0], current[1], next[0], next[1]),
                coordinates: next,
                action: 'continue'
            };
            
            // Determine turn direction if this isn't the last segment
            if (i < routeCoords.length - 2) {
                const prev = routeCoords[i];
                const curr = routeCoords[i + 1];
                const next = routeCoords[i + 2];
                
                const angle1 = this.calculateBearing(prev[0], prev[1], curr[0], curr[1]);
                const angle2 = this.calculateBearing(curr[0], curr[1], next[0], next[1]);
                
                let turnAngle = angle2 - angle1;
                if (turnAngle > 180) turnAngle -= 360;
                if (turnAngle < -180) turnAngle += 360;
                
                if (Math.abs(turnAngle) < 15) {
                    instruction.action = 'straight';
                } else if (turnAngle > 15) {
                    instruction.action = 'right';
                } else if (turnAngle < -15) {
                    instruction.action = 'left';
                }
            } else {
                instruction.action = 'arrive';
            }
            
            instructions.push(instruction);
        }
        
        return instructions;
    }
    
    // Get the next instruction based on current position
    getNextInstruction(currentLat, currentLng, instructions) {
        if (!instructions || instructions.length === 0) {
            return null;
        }
        
        let closestInstruction = instructions[0];
        let minDistance = Infinity;
        
        for (const instruction of instructions) {
            const distance = this.calculateDistance(
                currentLat, currentLng,
                instruction.coordinates[0], instruction.coordinates[1]
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestInstruction = instruction;
            }
        }
        
        return {
            ...closestInstruction,
            distanceToInstruction: minDistance
        };
    }
    
    // Format distance for display
    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }
    
    // Check if user has arrived at destination
    hasArrived(currentLat, currentLng, targetLat, targetLng, threshold = 5) {
        const distance = this.calculateDistance(currentLat, currentLng, targetLat, targetLng);
        return distance <= threshold;
    }
    
    // Calculate route statistics
    calculateRouteStatistics(routeCoords) {
        if (!routeCoords || routeCoords.length < 2) {
            return {
                totalDistance: 0,
                estimatedTime: 0,
                waypoints: 0
            };
        }
        
        let totalDistance = 0;
        
        for (let i = 0; i < routeCoords.length - 1; i++) {
            const current = routeCoords[i];
            const next = routeCoords[i + 1];
            totalDistance += this.calculateDistance(current[0], current[1], next[0], next[1]);
        }
        
        // Estimate time based on walking speed (1.4 m/s)
        const estimatedTime = totalDistance / 1.4;
        
        return {
            totalDistance,
            estimatedTime,
            waypoints: routeCoords.length
        };
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.NavigationUtils = NavigationUtils;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationUtils;
}

