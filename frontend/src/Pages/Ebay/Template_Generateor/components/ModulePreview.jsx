import React, { useEffect, useRef, useState } from 'react';
import generateHtml from '../utils/generateHtml';

// Renders the exact same HTML string that Copy/Download produce, inside an iframe.
// This guarantees the live preview and the exported template can never drift apart -
// what you see here is byte-identical to what you copy.
export default function ModulePreview({ mode, styles, headerData, modules }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(400);
  const html = generateHtml({ styles, headerData, modules });

  const resize = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.documentElement) {
      setHeight(doc.documentElement.scrollHeight);
    }
  };

  useEffect(() => {
    // Images loading async can change document height after the initial load fires.
    const id = setInterval(resize, 300);
    const timeout = setTimeout(() => clearInterval(id), 3000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Template preview"
      srcDoc={html}
      onLoad={resize}
      style={{ width: '100%', height, border: 'none', display: 'block' }}
      className={mode === 'mobile' ? 'mx-auto' : ''}
    />
  );
}
