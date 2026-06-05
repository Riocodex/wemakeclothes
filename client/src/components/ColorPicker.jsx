import React from 'react'
import { SketchPicker } from 'react-color'
import { useSnapshot } from 'valtio'

import state from '../store'
import { setDesignColor } from '../config/designSchema'

const ColorPicker = () => {
  const snap = useSnapshot(state)
  const activeColor = snap.design?.colors?.body || snap.color

  const handleColorChange = (color) => {
    setDesignColor(state, 'body', color.hex)
  }

  return (
      <div className="absolute left-full ml-3">
        <SketchPicker
          color={activeColor}
          disableAlpha
          onChange={handleColorChange}
        />
      </div>
  )
}

export default ColorPicker
