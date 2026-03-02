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
            label.textContent = 'Selected circle video';
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

function syncVideoPair(videoA, videoB) {
    if (!videoA || !videoB) return;
    if (videoA.dataset.syncedWith === videoB.id && videoB.dataset.syncedWith === videoA.id) {
        return;
    }

    var isSyncing = false;

    function syncTime(src, dst) {
        if (isSyncing) return;
        var delta = Math.abs((dst.currentTime || 0) - (src.currentTime || 0));
        if (delta < 0.06) return;
        isSyncing = true;
        try {
            dst.currentTime = src.currentTime;
        } catch (e) {
            // no-op
        }
        isSyncing = false;
    }

    function syncPlayState(src, dst) {
        if (src.paused) return;
        var p = dst.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function() {});
        }
    }

    [videoA, videoB].forEach(function(video, index) {
        var other = index === 0 ? videoB : videoA;
        video.addEventListener('play', function() {
            syncPlayState(video, other);
        });
        video.addEventListener('pause', function() {
            if (!other.paused) {
                other.pause();
            }
        });
        video.addEventListener('seeking', function() {
            syncTime(video, other);
        });
        video.addEventListener('timeupdate', function() {
            syncTime(video, other);
        });
        video.addEventListener('ratechange', function() {
            if (other.playbackRate !== video.playbackRate) {
                other.playbackRate = video.playbackRate;
            }
        });
    });

    videoA.dataset.syncedWith = videoB.id || 'paired';
    videoB.dataset.syncedWith = videoA.id || 'paired';
}

function setVideoSource(videoEl, sourceEl, url) {
    if (!videoEl || !sourceEl) return;
    if (!url) {
        sourceEl.removeAttribute('src');
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.load();
        return;
    }
    if (sourceEl.getAttribute('src') !== url) {
        sourceEl.setAttribute('src', url);
        videoEl.load();
    }
}

function autoplayMutedVideo(videoEl) {
    if (!videoEl) return;
    videoEl.muted = true;
    videoEl.loop = true;
    var p = videoEl.play();
    if (p && typeof p.catch === 'function') {
        p.catch(function() {});
    }
}

function setViz2Reveal(percent) {
    var value = Number(percent);
    if (Number.isNaN(value)) value = 50;
    if (value < 0) value = 0;
    if (value > 100) value = 100;

    var colorVideo = document.getElementById('viz2-color-video');
    var divider = document.getElementById('viz2-color-depth-divider');
    var viewer = document.getElementById('viz2-color-depth-viewer');
    if (colorVideo) {
        colorVideo.style.clipPath = 'inset(0 ' + (100 - value) + '% 0 0)';
    }
    if (divider) {
        divider.style.left = value + '%';
    }
    if (viewer) {
        viewer.dataset.reveal = String(value);
    }
}

function initializeViz2RevealInteraction() {
    var viewer = document.getElementById('viz2-color-depth-viewer');
    if (!viewer || viewer.dataset.boundReveal === '1') return;

    var isDragging = false;

    function setRevealFromClientX(clientX) {
        var rect = viewer.getBoundingClientRect();
        if (!rect.width) return;
        var x = clientX - rect.left;
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        setViz2Reveal((x / rect.width) * 100);
    }

    viewer.addEventListener('pointerdown', function(event) {
        isDragging = true;
        viewer.classList.add('is-dragging');
        if (typeof viewer.setPointerCapture === 'function') {
            try {
                viewer.setPointerCapture(event.pointerId);
            } catch (e) {
                // no-op
            }
        }
        setRevealFromClientX(event.clientX);
    });

    viewer.addEventListener('pointermove', function(event) {
        if (!isDragging) return;
        setRevealFromClientX(event.clientX);
    });

    function stopDrag(event) {
        if (!isDragging) return;
        isDragging = false;
        viewer.classList.remove('is-dragging');
        if (event && typeof viewer.releasePointerCapture === 'function') {
            try {
                viewer.releasePointerCapture(event.pointerId);
            } catch (e) {
                // no-op
            }
        }
    }

    viewer.addEventListener('pointerup', stopDrag);
    viewer.addEventListener('pointercancel', stopDrag);
    viewer.addEventListener('click', function(event) {
        setRevealFromClientX(event.clientX);
    });

    viewer.dataset.boundReveal = '1';
    setViz2Reveal(50);
}

function initializeViz2ColorDepth() {
    var container = document.getElementById('viz2-scene-selector');
    if (!container) return;
    if (typeof DatasetSceneSelector === 'undefined') {
        console.warn('DatasetSceneSelector module is not loaded.');
        return;
    }

    var config = window.XSIM_VIZ2_COLOR_DEPTH_DATA || {};
    var datasets = Array.isArray(config.datasets) ? config.datasets : [];

    var selector = new DatasetSceneSelector(container, {
        datasets: datasets,
        onSelect: function(payload) {
            updateViz2ColorDepth(payload);
            container.dispatchEvent(new CustomEvent('scenechange', { detail: payload }));
        }
    });

    selector.init();
    window.xsimViz2SceneSelector = selector;

    initializeViz2RevealInteraction();

    var colorVideo = document.getElementById('viz2-color-video');
    var depthVideo = document.getElementById('viz2-depth-video');
    autoplayMutedVideo(colorVideo);
    autoplayMutedVideo(depthVideo);
    syncVideoPair(colorVideo, depthVideo);
}

function updateViz2ColorDepth(payload) {
    var empty = document.getElementById('viz2-color-depth-empty');
    var viewer = document.getElementById('viz2-color-depth-viewer');
    var colorVideo = document.getElementById('viz2-color-video');
    var depthVideo = document.getElementById('viz2-depth-video');
    var colorSource = document.getElementById('viz2-color-video-source');
    var depthSource = document.getElementById('viz2-depth-video-source');

    var colorUrl = payload && payload.scene ? (payload.scene.colorUrl || payload.scene.sceneUrl || '') : '';
    var depthUrl = payload && payload.scene ? (payload.scene.depthUrl || '') : '';

    if (!colorUrl || !depthUrl) {
        if (viewer) viewer.hidden = true;
        if (empty) empty.hidden = false;
        setVideoSource(colorVideo, colorSource, '');
        setVideoSource(depthVideo, depthSource, '');
        return;
    }

    setVideoSource(colorVideo, colorSource, colorUrl);
    setVideoSource(depthVideo, depthSource, depthUrl);
    autoplayMutedVideo(colorVideo);
    autoplayMutedVideo(depthVideo);

    if (viewer) viewer.hidden = false;
    if (empty) empty.hidden = true;
}

function initializePageFeatures() {
    // Initialize data-driven blocks first so they don't depend on carousel/plugin success.
    initializeViz1SceneSelector();
    initializeViz2ColorDepth();

    var defaultCarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
    };
    var viz3CarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
        breakpoints: [{
            changePoint: 480,
            slidesToShow: 1,
            slidesToScroll: 1,
        }, {
            changePoint: 640,
            slidesToShow: 1,
            slidesToScroll: 1,
        }, {
            changePoint: 768,
            slidesToShow: 1,
            slidesToScroll: 1,
        }],
    };

    // Initialize standard carousels; Viz3 is pinned to 1 slide for mobile breakpoints.
    try {
      if (typeof bulmaCarousel !== 'undefined') {
          bulmaCarousel.attach('.carousel:not(.viz3-carousel)', defaultCarouselOptions);
          bulmaCarousel.attach('.viz3-carousel', viz3CarouselOptions);
      }
    } catch (error) {
      console.error('Carousel initialization failed:', error);
    }
	
    try {
      if (typeof bulmaSlider !== 'undefined') {
          bulmaSlider.attach();
      }
    } catch (error) {
      console.error('Slider initialization failed:', error);
    }
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();
}

if (window.jQuery && typeof window.jQuery.fn === 'object') {
    window.jQuery(function() {
        initializePageFeatures();
    });
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageFeatures);
} else {
    initializePageFeatures();
}
