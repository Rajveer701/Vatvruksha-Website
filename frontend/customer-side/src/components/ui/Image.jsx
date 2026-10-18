// Image component — resolves a Firebase Storage path to a download URL,
// with graceful placeholder fallback when the bucket/path is unavailable.
// Images in Firestore are Storage paths, not URLs.
import { useState, useEffect } from 'react'
import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase.js'
import { STORAGE_IMAGE_PLACEHOLDER } from '../../../../shared/constants.js'

export default function Image({ src, className = '', alt = '', ...props }) {
  const [url, setUrl] = useState(STORAGE_IMAGE_PLACEHOLDER)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) {
      setUrl(STORAGE_IMAGE_PLACEHOLDER)
      return
    }
    const storageRef = ref(storage, src)
    getDownloadURL(storageRef)
      .then(setUrl)
      .catch(() => {
        // Bucket not configured or path missing — show placeholder.
        setFailed(true)
      })
  }, [src])

  const finalSrc = failed || !url ? STORAGE_IMAGE_PLACEHOLDER : url

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
      loading="lazy"
      decoding="async"
    />
  )
}
