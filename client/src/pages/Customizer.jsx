import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import state from '../store';
import { captureCanvasPreview, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants';
import { slideAnimation } from '../config/motion';
import { GARMENT_OPTIONS } from '../config/garments';
import { applyGarmentChange, syncRootFromDesign } from '../config/designSchema';
import { saveDesign } from '../services/designService';
import { AIPicker, ColorPicker, FilePicker, Tab } from '../components';
import { CloseIcon, SaveIcon } from '../components/Icons';

const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState('');

  const [prompt, setPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  })
  const [isGarmentPickerOpen, setIsGarmentPickerOpen] = useState(false)
  const selectedGarment = snap.design?.catalogId || 'tshirt_short'
  const themeButtons = [
    { name: 'light', label: 'Light' },
    { name: 'dark', label: 'Dark' },
  ]

  // show tab content depending on the activeTab
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />
      case "filepicker":
        return <FilePicker
          file={file}
          setFile={setFile}
          readFile={readFile}
        />
      case "aipicker":
        return <AIPicker 
          prompt={prompt}
          setPrompt={setPrompt}
          generatingImg={generatingImg}
          handleSubmit={handleSubmit}
        />
      default:
        return null;
    }
  }

  const handleSubmit = async (type) => {
    if(!prompt) return alert("Please enter a prompt");

    try {
      setGeneratingImg(true);

      const response = await fetch('https://wemakeclothes.onrender.com//api/v1/dalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
        })
      })

      const data = await response.json();

      handleDecals(type, `data:image/png;base64,${data.photo}`)
    } catch (error) {
      alert(error)
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab("");
    }
  }

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];

    state[decalType.stateProperty] = result;
    if (state.design) {
      if (type === 'logo') state.design.textures = { ...state.design.textures, logo: result }
      if (type === 'full') state.design.textures = { ...state.design.textures, full: result }
      const layerId = `${type}-layer`
      const existingLayerIndex = state.design.layers.findIndex((layer) => layer.id === layerId)
      const layerPayload = {
        id: layerId,
        type: 'image',
        placement: type,
        src: result,
      }
      if (existingLayerIndex >= 0) state.design.layers[existingLayerIndex] = layerPayload
      else state.design.layers.push(layerPayload)
    }
    syncRootFromDesign(state);

    if(!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab)
    }
  }

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
          state.isLogoTexture = !activeFilterTab[tabName];
        if (state.design) state.design.isLogoTexture = state.isLogoTexture
        break;
      case "stylishShirt":
        state.isFullTexture = !activeFilterTab[tabName];
        if (state.design) state.design.isFullTexture = state.isFullTexture
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        if (state.design) {
          state.design.isLogoTexture = true
          state.design.isFullTexture = false
        }
        break;
    }

    // after setting the state, activeFilterTab is updated

    setActiveFilterTab((prevState) => {
      return {
        ...prevState,
        [tabName]: !prevState[tabName]
      }
    })
  }

  const readFile = (type) => {
    reader(file)
      .then((result) => {
        handleDecals(type, result);
        setActiveEditorTab("");
      })
  }

  const handleThemeChange = (themeName) => {
    state.sceneTheme = themeName
  }

  const handleGarmentChange = (newCatalogId) => {
    applyGarmentChange(state, newCatalogId, {
      keepColors: true,
      keepTextures: true,
      keepLayers: true
    })
    setIsGarmentPickerOpen(false)
  }

  const handleSaveDesign = async () => {
    if (!snap.design || savingDesign) return
    const inputName = window.prompt('Enter a name for this design:')
    const trimmedName = (inputName || '').trim()
    if (!trimmedName) {
      alert('Please enter a design name before saving.')
      return
    }
    setSavingDesign(true)
    try {
      const previewImage = captureCanvasPreview()
      const saved = await saveDesign({
        title: trimmedName,
        design: JSON.parse(JSON.stringify(snap.design)),
        previewImage,
        sceneTheme: snap.sceneTheme,
      })

      alert(`Design saved successfully. ID: ${saved.id.slice(0, 8)}`)
    } catch {
      alert('Could not save design. Please try again.')
    } finally {
      setSavingDesign(false)
    }
  }
  const garmentLabel = GARMENT_OPTIONS.find((item) => item.name === selectedGarment)?.label || 'Select'
  const garmentPreview = GARMENT_OPTIONS.find((item) => item.name === selectedGarment)?.preview

  return (
    <>
    <AnimatePresence>
      {!snap.intro && !snap.viewerOpen && (
        <>
          <motion.div
            key="custom"
            className="customizer-rail"
            {...slideAnimation('left')}
          >
            <div className="editortabs-container tabs">
              <span className="editortabs-label">Tools</span>
              {EditorTabs.map((tab) => (
                <Tab 
                  key={tab.name}
                  tab={tab}
                  isActiveTab={activeEditorTab === tab.name}
                  handleClick={() => setActiveEditorTab((current) => (current === tab.name ? "" : tab.name))}
                />
              ))}

              {generateTabContent()}
            </div>
          </motion.div>

          <motion.div
            className='customizer-dock'
            {...slideAnimation("up")}
          >
            <div className="customizer-dock-inner">
              <button
                type="button"
                className="dock-btn dock-garment"
                onClick={() => setIsGarmentPickerOpen(true)}
                aria-haspopup="dialog"
              >
                <span className="dock-swatch" style={{ backgroundColor: snap.color }} aria-hidden="true" />
                <span className="text-ink-500 font-medium hidden sm:inline">Style</span>
                <span className="truncate">{garmentPreview} {garmentLabel}</span>
              </button>

              <span className="dock-divider" aria-hidden="true" />

              <div className="theme-toggle dock-theme" role="group" aria-label="Scene theme">
                {themeButtons.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    className="theme-toggle-btn"
                    aria-pressed={snap.sceneTheme === theme.name}
                    onClick={() => handleThemeChange(theme.name)}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>

              <span className="dock-divider" aria-hidden="true" />

              <div className="filter-group dock-filters" role="group" aria-label="Texture placement">
                {FilterTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    isFilterTab
                    isActiveTab={activeFilterTab[tab.name]}
                    handleClick={() => handleActiveFilterTab(tab.name)}
                  />
                ))}
              </div>

              <span className="dock-divider" aria-hidden="true" />

              <button
                type="button"
                className="btn btn-primary dock-save"
                onClick={handleSaveDesign}
                disabled={savingDesign}
                style={{ minHeight: '2.75rem' }}
              >
                <SaveIcon />
                {savingDesign ? "Saving..." : "Save Design"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {!snap.intro && !snap.viewerOpen && isGarmentPickerOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsGarmentPickerOpen(false)}
        >
          <motion.div
            className="modal-panel sm:max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="garment-picker-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="eyebrow text-ink-500">Garment</p>
                <h3 id="garment-picker-title" className="mt-1 text-lg font-bold tracking-tight">Choose Garment Style</h3>
                <p className="mt-0.5 text-xs text-ink-500">Your colors and artwork carry over.</p>
              </div>
              <button
                type="button"
                className="icon-btn text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                onClick={() => setIsGarmentPickerOpen(false)}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GARMENT_OPTIONS.map((item) => {
                const isActive = selectedGarment === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={isActive}
                    className={`group flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white hover:border-ink-400 hover:shadow-card'
                    }`}
                    onClick={() => handleGarmentChange(item.name)}
                  >
                    <span className={`flex h-12 w-full items-center justify-center rounded-xl text-2xl ${isActive ? 'bg-white/10' : 'bg-ink-50'}`}>
                      {item.preview}
                    </span>
                    <span className="mt-2.5 text-sm font-semibold">{item.label}</span>
                    <span className={`text-[0.6875rem] ${isActive ? 'text-white/60' : 'text-ink-500'}`}>
                      {isActive ? 'Current style' : 'Tap to apply this style'}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

export default Customizer
