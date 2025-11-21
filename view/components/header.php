
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cemetery Locator & Management System</title>
    <link rel="stylesheet" href="../../../css/bootstrap.min.css">
    <link rel="stylesheet" href="../../../css/style.css">
    <link rel="stylesheet" href="../../../css/sidebar.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <link  href="../../../css/boxicons.css" rel="stylesheet">
    <link rel="stylesheet" href="../../../css/fontawesome/css/all.min.css">
    <link rel="icon" href="../../../../assets/images/logo.png" type="image/x-icon" />
    <!-- Leaflet CSS -->
    <!-- <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" /> -->
    <!-- Leaflet Draw CSS -->
    <!-- <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" /> -->
    <!-- <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" /> -->

    <?php if(isset($page) && $page == 'map'): ?>
        <script type="module">
            import * as turf from 'https://esm.sh/@turf/turf@7.1.0';
            window.turf = turf;
        </script>
        <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css' />
        <script src='https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js'></script>
        <!-- <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css' /> -->
        <!-- <script src='https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js'></script> -->
        <!-- Mapbox GL Draw for professional drawing tools -->
        <script src="https://www.unpkg.com/@mapbox/mapbox-gl-draw@1.5.0/dist/mapbox-gl-draw.js"></script>
        <link rel="stylesheet" href="https://www.unpkg.com/@mapbox/mapbox-gl-draw@1.5.0/dist/mapbox-gl-draw.css"/>
        <script src="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-terradraw@1.0.1/dist/maplibre-gl-terradraw.umd.js"></script>
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-terradraw@1.0.1/dist/maplibre-gl-terradraw.css"
        />

    <?php endif; ?>

    <!-- Turf.js for area calculations -->

    <!-- Additional map styling -->
    <style>
        /* MapLibre GL specific styles */
        .maplibregl-map {
            font-family: 'Poppins', sans-serif;
        }
        
        .maplibregl-popup-content {
            margin: 8px 12px;
            line-height: 1.4;
        }
        
        .maplibregl-popup-content .btn {
            margin: 2px;
        }
        
        .maplibregl-ctrl-group {
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .maplibregl-ctrl-group button {
            background-color: #fff;
            border: none;
            color: #333;
        }
        
        .maplibregl-ctrl-group button:hover {
            background-color: #f5f5f5;
        }
        
        /* Custom marker styles */
        .custom-marker {
            background: transparent;
            border: none;
        }
        
        /* Drawing mode cursor */
        .maplibregl-canvas-container.drawing-mode {
            cursor: crosshair !important;
        }
        .calculation-box {
            height: 75px;
            width: 150px;
            position: absolute;
            bottom: 40px;
            left: 10px;
            background-color: rgba(255, 255, 255, 0.9);
            padding: 15px;
            text-align: center;
        }
        
        /* Area calculation box for Mapbox GL Draw */
        .area-calculation-box {
            height: 75px;
            width: 150px;
            position: absolute;
            bottom: 40px;
            left: 10px;
            background-color: rgba(255, 255, 255, 0.9);
            padding: 15px;
            text-align: center;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        }
        
        .area-calculation-box p {
            font-family: 'Open Sans', sans-serif;
            margin: 0;
            font-size: 13px;
        }
    </style>
</head>
<body>


<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

body {
    font-family: 'Poppins', sans-serif;
}
.navbar-brand {
    font-weight: bold;
}

.dashboard-card {
    background-color: white;
    border-radius: 5px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.stat-number a {
    text-decoration: none;
    color: inherit;
}

.stat-number {
    font-size: 3rem;
    font-weight: bold;
    color: #8B4513;
}

.stat-label {
    color: #6c757d;
}

.action-button {
    background-color: #8B4513;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 5px;
    width: 100%;
    margin-top: 10px;
}

.recent-activities {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}

.stats-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.stats-row {
    display: flex;
    flex: 1;
}


.stats-col {
    flex: 1 1 calc(25% - 15px); /* Adjust card size for responsiveness */
    max-width: calc(25% - 15px);
}

@media (max-width: 768px) {
    .stats-col {
        flex: 1 1 calc(50% - 15px); /* Adjust card size for smaller screens */
        max-width: calc(50% - 15px);
    }
}

@media (max-width: 576px) {
    .stats-col {
        flex: 1 1 100%; /* Full width for very small screens */
        max-width: 100%;
    }
}

.stats-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.modal.fade .modal-dialog.modal-dialog-slideright {
    transform: translate(100%, 0);
    transition: transform 0.3s ease-out;
}

.modal.show .modal-dialog.modal-dialog-slideright {
    transform: translate(0, 0);
}

.confirmation-details {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detail-item {
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-item:last-child {
    border-bottom: none;
}

.detail-label {
    font-weight: 600;
    color: #495057;
}

.detail-value {
    color: #212529;
}

.table-responsive {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

</style>

<script>
    // Toggle password visibility
    document.addEventListener('DOMContentLoaded', function() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    });
</script>

<!-- MapLibre GL JavaScript -->
<!-- <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script> -->

</body>
</html>