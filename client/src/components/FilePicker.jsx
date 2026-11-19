import React from 'react'

const FilePicker = ({ file, setFile, readFile }) => {
  return (
    <div className="filepicker-container">
      <p className="eyebrow mb-2 text-ink-500">Artwork</p>
      <div className="flex-1 flex flex-col">
        <input 
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-upload" className="filepicker-label">
          Upload File
        </label>

        <p className="mt-2 text-ink-500 text-xs truncate">
          {file === '' ? "No file selected" : file.name}
        </p>
      </div>

      <p className="mt-3 text-[0.6875rem] font-medium text-ink-500">Apply as</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => readFile('logo')}
        >
          Logo
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => readFile('full')}
        >
          Full
        </button>
      </div>
    </div>
  )
}

export default FilePicker
