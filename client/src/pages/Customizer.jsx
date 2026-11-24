import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import state from '../store';
import { captureCanvasPreview, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants';
import { slideAnimation } from '../config/motion';
import { syncRootFromDesign } from '../config/designSchema';
import { saveDesign } from '../services/designService';
import { AUTH_CHANGE_EVENT, AUTH_DISMISS_EVENT, hasAuthSession } from '../services/authService';
import { requestSignIn } from '../config/navigation';
import { AIPicker, ColorPicker, FilePicker, Tab } from '../components';
import { SaveIcon } from '../components/Icons';

const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState('');

  const [prompt, setPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const pendingSaveRef = useRef(null)
  const editorTabsRef = useRef(null)

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  })
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
      if (type === 'logo') {
        state.design.textures = { ...state.design.textures, logo: result, full: result }
        state.fullDecal = result
      }
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

  const persistDesign = async (payload) => {
    setSavingDesign(true)
    try {
      const saved = await saveDesign(payload)
      alert(`Design saved successfully. ID: ${saved.id.slice(0, 8)}`)
    } catch {
      alert('Could not save design. Please try again.')
    } finally {
      setSavingDesign(false)
    }
  }

  useEffect(() => {
    if (!activeEditorTab) return

    const closeTool = (event) => {
      if (editorTabsRef.current?.contains(event.target)) return
      setActiveEditorTab("")
    }

    const onKey = (event) => {
      if (event.key === 'Escape') setActiveEditorTab("")
    }

    // Capture so a click on the shirt still closes the tool. The canvas
    // stops that pointer event before it can bubble.
    document.addEventListener('pointerdown', closeTool, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', closeTool, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [activeEditorTab])

  useEffect(() => {
    const onAuth = () => {
      const payload = pendingSaveRef.current
      if (!payload || !hasAuthSession()) return
      pendingSaveRef.current = null
      persistDesign(payload)
    }
    const onDismiss = () => {
      pendingSaveRef.current = null
    }
    window.addEventListener(AUTH_CHANGE_EVENT, onAuth)
    window.addEventListener(AUTH_DISMISS_EVENT, onDismiss)
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuth)
      window.removeEventListener(AUTH_DISMISS_EVENT, onDismiss)
    }
  }, [])

  const handleSaveDesign = async () => {
    if (!snap.design || savingDesign) return
    const inputName = window.prompt('Enter a name for this design:')
    const trimmedName = (inputName || '').trim()
    if (!trimmedName) {
      alert('Please enter a design name before saving.')
      return
    }

    const payload = {
      title: trimmedName,
      design: JSON.parse(JSON.stringify(snap.design)),
      previewImage: captureCanvasPreview(),
      sceneTheme: snap.sceneTheme,
    }

    if (!hasAuthSession()) {
      pendingSaveRef.current = payload
      requestSignIn('Create an account to save this design.', { mode: 'register' })
      return
    }

    await persistDesign(payload)
  }
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
            <div className="editortabs-container tabs" ref={editorTabsRef}>
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
              <div
                className={`theme-toggle dock-theme ${snap.sceneTheme === 'dark' ? 'theme-toggle--dark' : ''}`}
                role="group"
                aria-label="Scene theme"
              >
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
                className="btn btn-brand dock-save"
                onClick={handleSaveDesign}
                disabled={savingDesign}
                style={{ minHeight: '2.75rem' }}
              >
                <SaveIcon />
                {savingDesign ? "Saving..." : "Save design"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}

export default Customizer
