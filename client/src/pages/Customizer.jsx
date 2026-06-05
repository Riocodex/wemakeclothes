import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import state from '../store';
import { captureCanvasPreview, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { GARMENT_OPTIONS } from '../config/garments';
import { applyGarmentChange, syncRootFromDesign } from '../config/designSchema';
import { saveDesign } from '../services/designService';
import { AIPicker, ColorPicker, CustomButton, FilePicker, Tab } from '../components';

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

  return (
    <AnimatePresence>
      {!snap.intro && !snap.viewerOpen && (
        <>
          <motion.div
            key="custom"
            className="absolute top-0 left-0 z-10"
            {...slideAnimation('left')}
          >
            <div className="flex items-center min-h-screen">
              <div className="editortabs-container tabs">
                {EditorTabs.map((tab) => (
                  <Tab 
                    key={tab.name}
                    tab={tab}
                    handleClick={() => setActiveEditorTab(tab.name)}
                  />
                ))}

                {generateTabContent()}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <div className="flex items-center gap-2">
              <CustomButton 
                type="outline"
                title={savingDesign ? "Saving..." : "Save Design"}
                handleClick={handleSaveDesign}
                customStyles="w-fit px-4 py-2.5 font-bold text-sm"
              />
            </div>
          </motion.div>

          <motion.div
            className='filtertabs-container'
            {...slideAnimation("up")}
          >
            <div className="glassmorphism rounded-lg px-3 py-2 flex items-center gap-2">
              <CustomButton
                type="outline"
                title={`Style: ${GARMENT_OPTIONS.find((item) => item.name === selectedGarment)?.label || 'Select'}`}
                handleClick={() => setIsGarmentPickerOpen(true)}
                customStyles="w-fit px-3 py-1.5 text-xs font-semibold"
              />
              {themeButtons.map((theme) => (
                <CustomButton
                  key={theme.name}
                  type={snap.sceneTheme === theme.name ? "filled" : "outline"}
                  title={theme.label}
                  handleClick={() => handleThemeChange(theme.name)}
                  customStyles="w-fit px-3 py-1.5 text-xs font-semibold"
                />
              ))}
            </div>
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {isGarmentPickerOpen && (
              <motion.div
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGarmentPickerOpen(false)}
              >
                <motion.div
                  className="glassmorphism rounded-xl p-4 w-[min(92vw,620px)]"
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Choose Garment Style</h3>
                    <CustomButton
                      type="outline"
                      title="Close"
                      handleClick={() => setIsGarmentPickerOpen(false)}
                      customStyles="w-fit px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {GARMENT_OPTIONS.map((item) => {
                      const isActive = selectedGarment === item.name
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className="glassmorphism rounded-lg p-3 text-left transition-all hover:scale-[1.02]"
                          onClick={() => handleGarmentChange(item.name)}
                          style={{
                            borderColor: isActive ? snap.color : "rgba(255,255,255,0.18)",
                            borderWidth: isActive ? "2px" : "1px",
                          }}
                        >
                          <div className="text-2xl mb-1">{item.preview}</div>
                          <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                          <div className="text-[11px] text-gray-600">
                            Tap to apply this style
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}

export default Customizer
