import React from 'react'
import { useSnapshot } from 'valtio';

import state from '../store'

const TAB_LABELS = {
  colorpicker: 'Color',
  filepicker: 'Upload artwork',
  aipicker: 'AI artwork',
  logoShirt: 'Toggle logo',
  stylishShirt: 'Toggle full print',
}

const Tab = ({tab, isFilterTab, isActiveTab, handleClick}) => {
  const snap = useSnapshot(state)
  const activeColor = snap.design?.colors?.body || snap.color

  const activeStyles = isFilterTab && isActiveTab 
  ? { backgroundColor: activeColor, opacity: 0.5 }
  : { backgroundColor: "transparent", opacity: 1 }
  const label = TAB_LABELS[tab.name] || tab.name

  return (
    <button
    type="button"
    key={tab.name}
    className={`tab-btn ${isFilterTab ? 'tab-btn--filter' : ''} ${isActiveTab ? 'tab-btn--active' : ''}`}
    onClick={handleClick}
    style={activeStyles}
    aria-label={label}
    aria-pressed={Boolean(isActiveTab)}
    title={label}
    >
      <img 
      src={tab.icon} 
      alt=""
      className={`${isFilterTab ? 'w-2/3 h-2/3 object-contain': 'w-7 h-7 object-contain'}`}/>

    </button>
  )
}

export default Tab
