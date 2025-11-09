// Enhanced Reviews JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize review filters
    initReviewFilters();
    
    // Initialize helpful buttons
    initHelpfulButtons();
    
    // Initialize star ratings
    initStarRatings();
    
    // Initialize character counter
    initCharacterCounter();
    
    // Re-initialize helpful buttons after a short delay to ensure DOM is ready
    setTimeout(() => {
        initHelpfulButtons();
    }, 500);
});

// Also initialize when page is fully loaded
window.addEventListener('load', function() {
    initHelpfulButtons();
});

// Review Filters
function initReviewFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const reviewCards = document.querySelectorAll('.review-card');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter reviews
            reviewCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const rating = parseInt(card.dataset.rating);
                    if (filter === '5' && rating === 5) {
                        card.style.display = 'block';
                    } else if (filter === '4' && rating >= 4 && rating < 5) {
                        card.style.display = 'block';
                    } else if (filter === '3' && rating >= 3 && rating < 4) {
                        card.style.display = 'block';
                    } else if (filter === '2' && rating >= 2 && rating < 3) {
                        card.style.display = 'block';
                    } else if (filter === '1' && rating === 1) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

// Helpful Button
function initHelpfulButtons() {
    const helpfulButtons = document.querySelectorAll('.helpful-btn:not([data-initialized])');
    
    helpfulButtons.forEach(btn => {
        // Mark as initialized to prevent duplicate listeners
        btn.setAttribute('data-initialized', 'true');
        
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const reviewId = this.dataset.reviewId;
            const listingId = this.dataset.listingId;
            
            if (!reviewId || !listingId) {
                console.error('Missing review or listing ID');
                return;
            }
            
            // Disable button during request
            this.disabled = true;
            const countElement = this.querySelector('.helpful-count');
            const currentCount = countElement ? countElement.textContent : '0';
            const isCurrentlyActive = this.classList.contains('active');
            this.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Loading...</span>';
            
            try {
                const response = await fetch(`/listings/${listingId}/reviews/${reviewId}/helpful`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.isHelpful) {
                        this.classList.add('active');
                        this.innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> <span class="helpful-count">${data.helpfulCount}</span> <span>Helpful</span>`;
                    } else {
                        this.classList.remove('active');
                        this.innerHTML = `<i class="bi bi-hand-thumbs-up"></i> <span class="helpful-count">${data.helpfulCount}</span> <span>Helpful</span>`;
                    }
                    
                    // Update the data attribute
                    const reviewCard = this.closest('.review-card');
                    if (reviewCard) {
                        reviewCard.setAttribute('data-helpful', data.helpfulCount);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 401) {
                        alert('Please log in to mark reviews as helpful');
                        window.location.href = '/login';
                    } else {
                        alert(errorData.error || 'Failed to update helpful status');
                    }
                    // Restore original state on error
                    if (isCurrentlyActive) {
                        this.classList.add('active');
                        this.innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> <span class="helpful-count">${currentCount}</span> <span>Helpful</span>`;
                    } else {
                        this.classList.remove('active');
                        this.innerHTML = `<i class="bi bi-hand-thumbs-up"></i> <span class="helpful-count">${currentCount}</span> <span>Helpful</span>`;
                    }
                }
            } catch (error) {
                console.error('Error toggling helpful:', error);
                alert('An error occurred. Please try again.');
                // Restore original state on error
                if (isCurrentlyActive) {
                    this.classList.add('active');
                    this.innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> <span class="helpful-count">${currentCount}</span> <span>Helpful</span>`;
                } else {
                    this.classList.remove('active');
                    this.innerHTML = `<i class="bi bi-hand-thumbs-up"></i> <span class="helpful-count">${currentCount}</span> <span>Helpful</span>`;
                }
            } finally {
                this.disabled = false;
            }
        });
    });
}

// Star Rating Input - Fill from left to right
function initStarRatings() {
    const starContainers = document.querySelectorAll('.star-rating-input');
    
    starContainers.forEach(container => {
        const inputs = Array.from(container.querySelectorAll('input[type="radio"]'));
        const labels = Array.from(container.querySelectorAll('label'));
        
        // Function to update star colors based on value
        function updateStars(selectedValue) {
            inputs.forEach(inputEl => {
                const labelEl = inputEl.nextElementSibling;
                if (labelEl && labelEl.tagName === 'LABEL') {
                    if (parseInt(inputEl.value) <= selectedValue) {
                        labelEl.style.color = '#ffc107';
                    } else {
                        labelEl.style.color = '#dee2e6';
                    }
                }
            });
        }
        
        // Handle input change
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                updateStars(parseInt(this.value));
            });
        });
        
        // Handle hover on labels - fill stars from left to right
        labels.forEach((label, index) => {
            const input = label.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                label.addEventListener('mouseenter', function() {
                    const hoverValue = parseInt(input.value);
                    updateStars(hoverValue);
                });
            }
        });
        
        // Handle mouse leave on the entire container
        container.addEventListener('mouseleave', function() {
            const checkedInput = container.querySelector('input[type="radio"]:checked');
            if (checkedInput) {
                updateStars(parseInt(checkedInput.value));
            } else {
                updateStars(0);
            }
        });
    });
    
    // Category star ratings
    const categoryRatings = document.querySelectorAll('.category-star-rating');
    categoryRatings.forEach(rating => {
        const inputs = rating.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                const value = this.value;
                const labels = rating.querySelectorAll('label');
                
                labels.forEach((label, index) => {
                    if (index < value) {
                        label.style.color = '#ffc107';
                    } else {
                        label.style.color = '#dee2e6';
                    }
                });
            });
        });
    });
}

// Character Counter
function initCharacterCounter() {
    const textareas = document.querySelectorAll('.review-textarea');
    
    textareas.forEach(textarea => {
        const maxLength = 2000;
        const counter = textarea.parentElement.querySelector('.char-count');
        
        if (counter) {
            textarea.addEventListener('input', function() {
                const remaining = maxLength - this.value.length;
                counter.textContent = `${this.value.length} / ${maxLength} characters`;
                
                if (remaining < 50) {
                    counter.style.color = '#dc3545';
                } else {
                    counter.style.color = '#6c757d';
                }
            });
        }
    });
}

// Show More Reviews (global function)
window.showMoreReviews = function() {
    const reviewsContainer = document.querySelector('.reviews-grid');
    const allReviews = reviewsContainer.querySelectorAll('.review-card');
    const showMoreBtn = document.querySelector('.show-more-reviews-btn');
    
    allReviews.forEach((review, index) => {
        if (review.style.display === 'none') {
            review.style.display = 'block';
        }
    });
    
    if (showMoreBtn) {
        showMoreBtn.style.display = 'none';
    }
}

// Sort Reviews
function sortReviews(sortBy) {
    const reviewsContainer = document.querySelector('.reviews-grid');
    const reviews = Array.from(reviewsContainer.querySelectorAll('.review-card'));
    
    reviews.sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.dataset.date) - new Date(a.dataset.date);
        } else if (sortBy === 'oldest') {
            return new Date(a.dataset.date) - new Date(b.dataset.date);
        } else if (sortBy === 'highest') {
            return parseInt(b.dataset.rating) - parseInt(a.dataset.rating);
        } else if (sortBy === 'lowest') {
            return parseInt(a.dataset.rating) - parseInt(b.dataset.rating);
        } else if (sortBy === 'most-helpful') {
            return parseInt(b.dataset.helpful) - parseInt(a.dataset.helpful);
        }
        return 0;
    });
    
    reviews.forEach(review => reviewsContainer.appendChild(review));
}

