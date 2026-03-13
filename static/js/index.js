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

function updateSceneVideoPreview(videoId, sourceId, emptyId, payload, options) {
    const video = document.getElementById(videoId);
    const source = document.getElementById(sourceId);
    const empty = document.getElementById(emptyId);
    if (!video || !source) return;

    const sceneUrl = payload && payload.scene ? (payload.scene.sceneUrl || '') : '';

    if (!sceneUrl) {
        source.removeAttribute('src');
        video.pause();
        video.currentTime = 0;
        video.load();
        video.hidden = true;
        if (empty) empty.hidden = false;
        return;
    }

    if (source.getAttribute('src') !== sceneUrl) {
        source.setAttribute('src', sceneUrl);
        video.load();
    }
    autoplayMutedVideo(video, options);
    video.hidden = false;
    if (empty) empty.hidden = true;
}

function initializeSceneVideoSelector(options) {
    const opts = options || {};
    const container = document.getElementById(opts.selectorId);
    if (!container) return;
    if (typeof DatasetSceneSelector === 'undefined') {
        console.warn('DatasetSceneSelector module is not loaded.');
        return;
    }

    const config = window[opts.dataKey] || {};
    const datasets = Array.isArray(config.datasets) ? config.datasets : [];

    const selector = new DatasetSceneSelector(container, {
        datasets: datasets,
        onSelect: function(payload) {
            const sceneUrl = payload && payload.scene ? payload.scene.sceneUrl || '' : '';
            container.dataset.selectedSceneUrl = sceneUrl;
            updateSceneVideoPreview(opts.videoId, opts.sourceId, opts.emptyId, payload, opts);
            container.dispatchEvent(new CustomEvent('scenechange', { detail: payload }));
        }
    });

    selector.init();
    if (opts.instanceKey) {
        window[opts.instanceKey] = selector;
    }
}

function initializeViz0SceneSelector() {
    initializeSceneVideoSelector({
        selectorId: 'viz0-scene-selector',
        dataKey: 'XSIM_VIZ0_DRIVE_THROUGH_DATA',
        videoId: 'viz0-scene-video',
        sourceId: 'viz0-scene-video-source',
        emptyId: 'viz0-scene-video-empty',
        instanceKey: 'xsimViz0SceneSelector',
        loop: false
    });
}

function initializeViz1SceneSelector() {
    initializeSceneVideoSelector({
        selectorId: 'viz1-scene-selector',
        dataKey: 'XSIM_VIZ1_SCENE_SELECTOR_DATA',
        videoId: 'viz1-scene-video',
        sourceId: 'viz1-scene-video-source',
        emptyId: 'viz1-scene-video-empty',
        instanceKey: 'xsimViz1SceneSelector'
    });
}

function syncVideoPair(videoA, videoB) {
    if (!videoA || !videoB) return;
    if (videoA.dataset.syncedWith === videoB.id && videoB.dataset.syncedWith === videoA.id) {
        return;
    }

    var isSyncing = false;
    var syncThreshold = 0.25;

    function syncTime(src, dst, threshold) {
        if (isSyncing) return;
        var delta = Math.abs((dst.currentTime || 0) - (src.currentTime || 0));
        if (delta < threshold) return;
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

    videoA.addEventListener('play', function() {
        syncPlayState(videoA, videoB);
    });
    videoA.addEventListener('pause', function() {
        if (!videoB.paused) {
            videoB.pause();
        }
    });
    videoA.addEventListener('seeking', function() {
        syncTime(videoA, videoB, 0.01);
    });
    videoA.addEventListener('timeupdate', function() {
        syncTime(videoA, videoB, syncThreshold);
    });
    videoA.addEventListener('ratechange', function() {
        if (videoB.playbackRate !== videoA.playbackRate) {
            videoB.playbackRate = videoA.playbackRate;
        }
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

function autoplayMutedVideo(videoEl, options) {
    if (!videoEl) return;
    var opts = options || {};
    videoEl.muted = true;
    videoEl.loop = opts.loop !== false;
    var p = videoEl.play();
    if (p && typeof p.catch === 'function') {
        p.catch(function() {});
    }
}

var VIZ2_MIN_BUFFER_SECONDS = 2;
var VIZ2_BUFFER_POLL_MS = 200;
var viz2PlaybackGateTimer = 0;
var viz2PlaybackGateRequest = 0;

function clearViz2PlaybackGate() {
    if (viz2PlaybackGateTimer) {
        window.clearInterval(viz2PlaybackGateTimer);
        viz2PlaybackGateTimer = 0;
    }
    viz2PlaybackGateRequest += 1;
}

function getBufferedAhead(videoEl) {
    if (!videoEl || !videoEl.buffered) return 0;

    var currentTime = Math.max(0, videoEl.currentTime || 0);
    for (var i = 0; i < videoEl.buffered.length; i += 1) {
        var start = videoEl.buffered.start(i);
        var end = videoEl.buffered.end(i);
        if (start <= currentTime + 0.05 && end > currentTime) {
            return Math.max(0, end - currentTime);
        }
    }

    return 0;
}

function hasViz2PlaybackBuffer(videoEl) {
    if (!videoEl || !videoEl.currentSrc || videoEl.readyState < 2) {
        return false;
    }

    var currentTime = Math.max(0, videoEl.currentTime || 0);
    var remainingDuration = Number.isFinite(videoEl.duration)
        ? Math.max(0, videoEl.duration - currentTime)
        : VIZ2_MIN_BUFFER_SECONDS;
    var requiredBuffer = Math.min(VIZ2_MIN_BUFFER_SECONDS, remainingDuration || VIZ2_MIN_BUFFER_SECONDS);

    return getBufferedAhead(videoEl) >= Math.max(0.1, requiredBuffer - 0.05);
}

function prepareViz2Video(videoEl) {
    if (!videoEl) return;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.preload = 'auto';
}

function scheduleViz2Playback(colorVideo, depthVideo) {
    if (!colorVideo || !depthVideo) return;

    clearViz2PlaybackGate();
    prepareViz2Video(colorVideo);
    prepareViz2Video(depthVideo);
    colorVideo.pause();
    depthVideo.pause();

    var requestId = viz2PlaybackGateRequest;

    function maybeStartPlayback() {
        if (requestId !== viz2PlaybackGateRequest) return;
        if (!hasViz2PlaybackBuffer(colorVideo) || !hasViz2PlaybackBuffer(depthVideo)) {
            return;
        }

        clearViz2PlaybackGate();
        autoplayMutedVideo(colorVideo);
        autoplayMutedVideo(depthVideo);
    }

    maybeStartPlayback();
    if (!viz2PlaybackGateTimer) {
        viz2PlaybackGateTimer = window.setInterval(maybeStartPlayback, VIZ2_BUFFER_POLL_MS);
    }
}

function bindViz2PlaybackGuard(colorVideo, depthVideo) {
    if (!colorVideo || !depthVideo) return;
    if (colorVideo.dataset.bufferGuardBound === '1' && depthVideo.dataset.bufferGuardBound === '1') {
        return;
    }

    function handlePlaybackStall() {
        if (!colorVideo.currentSrc || !depthVideo.currentSrc) return;
        scheduleViz2Playback(colorVideo, depthVideo);
    }

    [colorVideo, depthVideo].forEach(function(videoEl) {
        videoEl.addEventListener('waiting', handlePlaybackStall);
        videoEl.addEventListener('stalled', handlePlaybackStall);
        videoEl.dataset.bufferGuardBound = '1';
    });
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
        colorVideo.style.clipPath = 'inset(0 0 0 ' + value + '%)';
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
    var colorVideo = document.getElementById('viz2-color-video');
    var depthVideo = document.getElementById('viz2-depth-video');

    initializeViz2RevealInteraction();
    prepareViz2Video(colorVideo);
    prepareViz2Video(depthVideo);
    syncVideoPair(colorVideo, depthVideo);
    bindViz2PlaybackGuard(colorVideo, depthVideo);

    var selector = new DatasetSceneSelector(container, {
        datasets: datasets,
        onSelect: function(payload) {
            updateViz2ColorDepth(payload);
            container.dispatchEvent(new CustomEvent('scenechange', { detail: payload }));
        }
    });

    selector.init();
    window.xsimViz2SceneSelector = selector;
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
        clearViz2PlaybackGate();
        setVideoSource(colorVideo, colorSource, '');
        setVideoSource(depthVideo, depthSource, '');
        return;
    }

    setVideoSource(colorVideo, colorSource, colorUrl);
    setVideoSource(depthVideo, depthSource, depthUrl);
    scheduleViz2Playback(colorVideo, depthVideo);

    if (viewer) viewer.hidden = false;
    if (empty) empty.hidden = true;
}

function initializePageFeatures() {
    // Initialize data-driven blocks first so they don't depend on carousel/plugin success.
    initializeViz0SceneSelector();
    initializeViz1SceneSelector();
    initializeViz2ColorDepth();

    var defaultCarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 5000,
    };
    var viz3CarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: false,
        centerMode: false,
        autoplay: false,
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
