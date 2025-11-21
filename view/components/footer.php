    <!-- Bootstrap JS and dependencies (jQuery and Popper.js) -->
    <script>
        // Helper function to clean up modal backdrops
        function cleanupModalBackdrops() {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
            });
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        // Helper function to show modal with proper cleanup
        function showModal(modalId) {
            cleanupModalBackdrops();
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }

        function setDeleteId(button) {
            var id = button.getAttribute('data-id');
            document.getElementById('deleteId').value = id;
            showModal('deleteModal');
        }
        function setCreateId(button) {
            var id = button.getAttribute('data-id');
            document.getElementById('contentID').value = id;
            showModal('createContentModal');
        }

        function setEditTimelineData(timelineItem) {
            document.getElementById('edit_timeline_id').value = timelineItem.id;
            document.getElementById('edit_timeline_title').value = timelineItem.timeline_title;
            document.getElementById('edit_history_date').value = timelineItem.history_date;
            showModal('editTimelineModal');
        }

        function setDeleteTimelineId(id) {
            document.getElementById('delete_timeline_id').value = id;
            showModal('deleteModal');
        }

        function setEditContentData(contentItem) {
            document.getElementById('edit_content').value = contentItem.content; // Update to match contentItem properties
            document.getElementById('edit_status').value = contentItem.status;   // Update to match contentItem properties
            document.getElementById('edit_id').value = contentItem.id; // Correct hidden input for content ID
            showModal('editContentModal'); // Show modal
        }
        function setDeleteContent(id) {
            document.getElementById('delete_content_id').value = id;
            showModal('deleteContentModal');
        }
    </script>
    
    <!-- Axios -->
    <script src="../../../js/axios.js"></script>
    <script>
        window.addEventListener('pageshow', function(event) {
            if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
                window.location.reload();
            }
        });
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
    <!-- <script src="../../../js/system_script.js"></script> -->
    
</body>
</html>