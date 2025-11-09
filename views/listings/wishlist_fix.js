// Fixed Wishlist functionality
document.addEventListener('DOMContentLoaded', function () {
    // Wishlist functionality
    const wishlistBtn = document.getElementById('wishlist-btn');
    console.log('Wishlist button element:', wishlistBtn);
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log('Wishlist button clicked');
            const listingId = this.dataset.listingId;
            const icon = document.getElementById('wishlist-icon');
            console.log('Listing ID:', listingId);

            try {
                const response = await fetch('/wishlist/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ listingId })
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (data.success) {
                    if (data.added) {
                        icon.className = 'bi bi-heart-fill';
                        this.classList.add('btn-danger');
                        this.classList.remove('btn-outline-danger');
                        this.innerHTML = '<i class="bi bi-heart-fill" id="wishlist-icon"></i> Saved';
                        showToast('Added to wishlist!');
                    } else {
                        icon.className = 'bi bi-heart';
                        this.classList.remove('btn-danger');
                        this.classList.add('btn-outline-danger');
                        this.innerHTML = '<i class="bi bi-heart" id="wishlist-icon"></i> Save';
                        showToast('Removed from wishlist');
                    }
                } else {
                    showToast(data.message || 'Error updating wishlist', 'error');
                }
            } catch (error) {
                console.error('Wishlist error:', error);
                showToast('Error updating wishlist', 'error');
            }
        });

        // Check initial wishlist status
        checkWishlistStatus();
    } else {
        console.log('Wishlist button not found');
    }
});

async function checkWishlistStatus() {
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (!wishlistBtn) return;

    // Get the listing ID from the button's data attribute
    const listingId = wishlistBtn.dataset.listingId;
    
    try {
        const response = await fetch(`/wishlist/check/${listingId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Wishlist status check response:', data);

            if (data.isInWishlist) {
                const icon = document.getElementById('wishlist-icon');
                icon.className = 'bi bi-heart-fill';
                wishlistBtn.classList.add('btn-danger');
                wishlistBtn.classList.remove('btn-outline-danger');
                // Update button text to indicate it's saved
                wishlistBtn.innerHTML = '<i class="bi bi-heart-fill" id="wishlist-icon"></i> Saved';
            }
        }
    } catch (error) {
        console.error('Error checking wishlist status:', error);
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toast.querySelector('.toast-header');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Update toast style based on type
        if (type === 'error') {
            toastHeader.querySelector('i').className = 'bi bi-exclamation-circle-fill text-danger me-2';
            toastHeader.querySelector('strong').textContent = 'Error';
        } else {
            toastHeader.querySelector('i').className = 'bi bi-check-circle-fill text-success me-2';
            toastHeader.querySelector('strong').textContent = 'Success';
        }
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}