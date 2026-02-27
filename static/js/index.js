window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    if (!dropdown || !button) return;
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        if (!dropdown || !button) return;
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    if (!bibtexElement || !button) return;
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (!scrollButton) return;
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

function initializeViz1SceneSelector() {
    const container = document.getElementById('viz1-scene-selector');
    if (!container) return;
    if (typeof DatasetSceneSelector === 'undefined') {
        console.warn('DatasetSceneSelector module is not loaded.');
        return;
    }

    const config = window.XSIM_VIZ1_SCENE_SELECTOR_DATA || {};
    const datasets = Array.isArray(config.datasets) ? config.datasets : [];

    const selector = new DatasetSceneSelector(container, {
        datasets: datasets,
        onSelect: function(payload) {
            const sceneUrl = payload && payload.scene ? payload.scene.sceneUrl || '' : '';
            container.dataset.selectedSceneUrl = sceneUrl;
            updateViz1ScenePreview(payload);
            container.dispatchEvent(new CustomEvent('scenechange', { detail: payload }));
        }
    });

    selector.init();
    window.xsimViz1SceneSelector = selector;
}

function updateViz1ScenePreview(payload) {
    const video = document.getElementById('viz1-scene-video');
    const source = document.getElementById('viz1-scene-video-source');
    const label = document.getElementById('viz1-scene-video-label');
    const empty = document.getElementById('viz1-scene-video-empty');
    if (!video || !source) return;

    const datasetLabel = payload && payload.dataset ? (payload.dataset.label || payload.dataset.id || '') : '';
    const sceneLabel = payload && payload.scene ? (payload.scene.label || payload.scene.id || '') : '';
    const sceneUrl = payload && payload.scene ? (payload.scene.sceneUrl || '') : '';

    if (label) {
        if (datasetLabel && sceneLabel) {
            label.textContent = datasetLabel + ' - ' + sceneLabel;
        } else if (sceneLabel) {
            label.textContent = sceneLabel;
        } else {
            label.textContent = 'Selected scene video';
        }
    }

    if (!sceneUrl) {
        source.removeAttribute('src');
        video.load();
        video.hidden = true;
        if (empty) empty.hidden = false;
        return;
    }

    if (source.getAttribute('src') !== sceneUrl) {
        source.setAttribute('src', sceneUrl);
        video.load();
    }
    video.hidden = false;
    if (empty) empty.hidden = true;
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

	// Initialize all div with carousel class
    if (typeof bulmaCarousel !== 'undefined') {
        bulmaCarousel.attach('.carousel', options);
    }
	
    if (typeof bulmaSlider !== 'undefined') {
        bulmaSlider.attach();
    }
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Dataset + scene selector (Viz 1)
    initializeViz1SceneSelector();

})
