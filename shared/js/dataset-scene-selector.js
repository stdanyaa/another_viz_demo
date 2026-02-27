(function (global) {
  "use strict";

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeDataset(rawDataset, index) {
    if (!rawDataset || typeof rawDataset !== "object") return null;
    const datasetId = String(rawDataset.id || rawDataset.label || ("dataset-" + index)).trim();
    if (!datasetId) return null;

    const scenes = toArray(rawDataset.scenes)
      .map(function (rawScene, sceneIndex) {
        if (!rawScene || typeof rawScene !== "object") return null;
        const sceneId = String(rawScene.id || rawScene.label || ("scene-" + sceneIndex)).trim();
        if (!sceneId) return null;
        return {
          id: sceneId,
          label: String(rawScene.label || sceneId),
          thumbnail: String(rawScene.thumbnail || ""),
          sceneUrl: String(rawScene.sceneUrl || "")
        };
      })
      .filter(Boolean);

    return {
      id: datasetId,
      label: String(rawDataset.label || datasetId),
      scenes: scenes
    };
  }

  class DatasetSceneSelector {
    constructor(container, options) {
      if (!container) {
        throw new Error("DatasetSceneSelector: missing container");
      }

      const opts = options || {};
      this.container = container;
      this.datasets = toArray(opts.datasets)
        .map(normalizeDataset)
        .filter(Boolean)
        .filter(function (dataset) {
          return dataset.scenes.length > 0;
        });
      this.onSelect = typeof opts.onSelect === "function" ? opts.onSelect : null;
      this.baseUrl = opts.baseUrl || window.location.href;

      this.activeDatasetId = "";
      this.selectedSceneId = "";

      this.elDatasets = null;
      this.elStrip = null;
      this.elPrev = null;
      this.elNext = null;
      this.elLabel = null;
    }

    init() {
      this._renderSkeleton();

      if (this.datasets.length === 0) {
        this._setEmptyState("No scenes configured");
        return;
      }

      this._renderDatasetChips();
      this._setActiveDataset(this.datasets[0].id, { preserveScene: false, emit: true });
    }

    _renderSkeleton() {
      this.container.innerHTML = "";
      this.container.classList.add("scene-selector");

      const datasetsRow = document.createElement("div");
      datasetsRow.className = "scene-selector__datasets";
      this.elDatasets = datasetsRow;

      const filmRow = document.createElement("div");
      filmRow.className = "scene-selector__film";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "scene-selector__nav";
      prev.textContent = "<";
      prev.setAttribute("aria-label", "Previous scene");
      prev.addEventListener("click", () => this._step(-1));
      this.elPrev = prev;

      const strip = document.createElement("div");
      strip.className = "scene-selector__strip";
      this.elStrip = strip;

      const next = document.createElement("button");
      next.type = "button";
      next.className = "scene-selector__nav";
      next.textContent = ">";
      next.setAttribute("aria-label", "Next scene");
      next.addEventListener("click", () => this._step(1));
      this.elNext = next;

      filmRow.appendChild(prev);
      filmRow.appendChild(strip);
      filmRow.appendChild(next);

      const label = document.createElement("p");
      label.className = "scene-selector__label";
      this.elLabel = label;

      this.container.appendChild(datasetsRow);
      this.container.appendChild(filmRow);
      this.container.appendChild(label);
    }

    _setEmptyState(message) {
      if (!this.elLabel) return;
      this.elLabel.textContent = message;
      if (this.elPrev) this.elPrev.disabled = true;
      if (this.elNext) this.elNext.disabled = true;
    }

    _renderDatasetChips() {
      if (!this.elDatasets) return;
      this.elDatasets.innerHTML = "";

      if (this.datasets.length <= 1) {
        this.elDatasets.classList.add("scene-selector__datasets--single");
      } else {
        this.elDatasets.classList.remove("scene-selector__datasets--single");
      }

      this.datasets.forEach((dataset) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "scene-selector__chip";
        chip.textContent = dataset.label;
        chip.dataset.datasetId = dataset.id;
        chip.addEventListener("click", () => {
          if (dataset.id === this.activeDatasetId) return;
          this._setActiveDataset(dataset.id, { preserveScene: false, emit: true });
        });
        this.elDatasets.appendChild(chip);
      });
    }

    _setActiveDataset(datasetId, options) {
      const opts = options || {};
      const dataset = this.datasets.find((item) => item.id === datasetId);
      if (!dataset) return;

      this.activeDatasetId = dataset.id;
      this._syncDatasetChipState();
      this._renderSceneTiles(dataset.scenes);

      const sceneExists = dataset.scenes.some((scene) => scene.id === this.selectedSceneId);
      if (opts.preserveScene && sceneExists) {
        this._setSelectedScene(this.selectedSceneId, { emit: opts.emit !== false, scroll: true });
      } else {
        const firstScene = dataset.scenes[0];
        this._setSelectedScene(firstScene ? firstScene.id : "", { emit: opts.emit !== false, scroll: false });
      }
    }

    _syncDatasetChipState() {
      if (!this.elDatasets) return;
      const chips = this.elDatasets.querySelectorAll(".scene-selector__chip");
      chips.forEach((chip) => {
        const selected = chip.dataset.datasetId === this.activeDatasetId;
        chip.classList.toggle("is-selected", selected);
        chip.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    _renderSceneTiles(scenes) {
      if (!this.elStrip) return;
      this.elStrip.innerHTML = "";

      scenes.forEach((scene) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "scene-selector__tile";
        tile.dataset.sceneId = scene.id;
        tile.title = scene.label;
        tile.addEventListener("click", () => {
          this._setSelectedScene(scene.id, { emit: true, scroll: false });
        });

        if (scene.thumbnail) {
          const image = document.createElement("img");
          image.className = "scene-selector__thumb";
          image.loading = "lazy";
          image.alt = scene.label;
          image.src = this._resolveAsset(scene.thumbnail);
          tile.appendChild(image);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "scene-selector__thumb scene-selector__thumb--placeholder";

          const icon = document.createElement("span");
          icon.className = "scene-selector__camera-icon";
          icon.setAttribute("aria-hidden", "true");

          const text = document.createElement("span");
          text.className = "scene-selector__placeholder-text";
          text.textContent = "Front Camera";

          placeholder.appendChild(icon);
          placeholder.appendChild(text);
          tile.appendChild(placeholder);
        }

        const badge = document.createElement("span");
        badge.className = "scene-selector__badge";
        badge.textContent = scene.id;
        tile.appendChild(badge);

        this.elStrip.appendChild(tile);
      });

      this._updateNavState();
    }

    _setSelectedScene(sceneId, options) {
      const opts = options || {};
      const activeDataset = this.datasets.find((dataset) => dataset.id === this.activeDatasetId);
      const scenes = activeDataset ? activeDataset.scenes : [];
      const selectedScene = scenes.find((scene) => scene.id === sceneId);
      if (!selectedScene) return;

      this.selectedSceneId = selectedScene.id;
      this._syncSceneTileState();
      this._updateLabel(selectedScene, activeDataset);
      this._updateNavState();

      if (opts.scroll !== false) {
        this._scrollSelectionIntoView();
      }

      if (opts.emit !== false && this.onSelect) {
        this.onSelect({
          dataset: activeDataset,
          scene: selectedScene
        });
      }
    }

    _syncSceneTileState() {
      if (!this.elStrip) return;
      const tiles = this.elStrip.querySelectorAll(".scene-selector__tile");
      tiles.forEach((tile) => {
        const selected = tile.dataset.sceneId === this.selectedSceneId;
        tile.classList.toggle("is-selected", selected);
        tile.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    _updateLabel(scene, dataset) {
      if (!this.elLabel) return;
      const datasetLabel = dataset && dataset.label ? dataset.label : "";
      const sceneLabel = scene && scene.label ? scene.label : "";
      this.elLabel.textContent = datasetLabel && sceneLabel ? datasetLabel + " - " + sceneLabel : sceneLabel;
    }

    _updateNavState() {
      if (!this.elPrev || !this.elNext) return;
      const activeDataset = this.datasets.find((dataset) => dataset.id === this.activeDatasetId);
      const scenes = activeDataset ? activeDataset.scenes : [];
      const index = scenes.findIndex((scene) => scene.id === this.selectedSceneId);
      this.elPrev.disabled = index <= 0;
      this.elNext.disabled = index === -1 || index >= scenes.length - 1;
    }

    _step(delta) {
      const activeDataset = this.datasets.find((dataset) => dataset.id === this.activeDatasetId);
      const scenes = activeDataset ? activeDataset.scenes : [];
      const index = scenes.findIndex((scene) => scene.id === this.selectedSceneId);
      if (index === -1) return;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= scenes.length) return;
      const scene = scenes[nextIndex];
      if (!scene) return;
      this._setSelectedScene(scene.id, { emit: true, scroll: true });
    }

    _scrollSelectionIntoView() {
      if (!this.elStrip) return;
      const selected = this.elStrip.querySelector(".scene-selector__tile.is-selected");
      if (!selected) return;
      selected.scrollIntoView({
        block: "nearest",
        inline: "center"
      });
    }

    _resolveAsset(path) {
      try {
        return new URL(path, this.baseUrl).toString();
      } catch (error) {
        return path;
      }
    }
  }

  global.DatasetSceneSelector = DatasetSceneSelector;
})(window);
