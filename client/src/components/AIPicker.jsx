import React from 'react'

const AIPicker = ({prompt, setPrompt, generatingImg,handleSubmit}) => {
  return (
    <div className='aipicker-container'>
      <p className="eyebrow text-ink-500">AI artwork</p>
      <textarea
        placeholder='Ask Ai...'
        rows={5}
        value={prompt}
        onChange={(e)=>setPrompt(e.target.value)}
        className='aipicker-textarea'
      />
      <div className="grid grid-cols-2 gap-2">
        {generatingImg ? (
          <button type="button" className="btn btn-secondary btn-sm col-span-2" disabled>
            Asking AI
          </button>
        ):(
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={()=>handleSubmit('logo')}
            >
              AI logo
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={()=>handleSubmit('full')}
            >
              AI Full
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AIPicker
