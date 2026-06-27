import { useState } from 'react'

export default function Popup() {
  const [url, setUrl] = useState('')

  const handleOpen = () => {
    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }

    let fullUrl = url.trim()
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl
    }

    // Send message to background script
    chrome.runtime.sendMessage({ action: 'openUrl', url: fullUrl })
    setUrl('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleOpen()
    }
  }

  return (
    <div className="w-80 p-4">
      <h2 className="text-lg font-bold mb-4 mt-0">Open URL</h2>
      <input
        type="text"
        placeholder="Enter URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        onClick={handleOpen}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        Open in New Tab
      </button>
    </div>
  )
}
