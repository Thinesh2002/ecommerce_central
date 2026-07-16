import React, { useState } from 'react';
import HeaderEditor from '../components/HeaderEditor';
import StyleCustomizer from '../components/StyleCustomizer';
import ModuleControls from '../components/ModuleControls';
import ModulePreview from '../components/ModulePreview';
import OutputManager from '../components/OutputManager';

export default function TemplateGeneratorView() {
  const [activeTab, setActiveTab] = useState('editor');
  
  // NEW: Editor canvas-kulla live-ah mode change panna intha state help pannum
  const [editorPreviewMode, setEditorPreviewMode] = useState('pc'); 

  const [styles, setStyles] = useState({
    primaryColor: '#ff9900',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    fontFamily: 'sans-serif',
    headerBg: '#131921',
    headerText: '#ffffff'
  });

  const [headerData, setHeaderData] = useState({
    storeName: 'My Store',
    storeLink: 'https://amazon.com/mystore',
    shopLinks: [
      { id: '1', label: 'Home', url: '#' },
      { id: '2', label: 'All Products', url: '#' }
    ]
  });

  const [modules, setModules] = useState([
    {
      id: 'initial-hero',
      type: 'hero',
      pcImage: 'https://images-na.ssl-images-amazon.com/images/G/01/aplus/premium/aplus-logo-1464x600._CB485934521_.jpg',
      mobileImage: 'https://images-na.ssl-images-amazon.com/images/G/01/aplus/premium/aplus-logo-600x450._CB485934521_.jpg',
      altText: 'Hero banner asset'
    }
  ]);

  const [faqs, setFaqs] = useState([
    { id: 'f1', question: 'How do I use this product?', answer: 'Follow the comprehensive usage manual instructions carefully.' }
  ]);

  const addModule = (type) => {
    if (modules.length >= 7) {
      alert('Maximum of 7 modules can be added.');
      return;
    }
    
    const newModule = {
      id: Date.now().toString(),
      type,
      pcImage: 'https://placehold.co/1464x600?text=Upload+PC+Image',
      mobileImage: 'https://placehold.co/600x450?text=Upload+Mobile+Image',
      title: type === 'hero' ? '' : 'New Module Title',
      description: type === 'hero' ? '' : 'Enter your custom benefit or asset description here.',
      extraData: type === 'table' ? {
        title: "Product Comparison",
        currency: "$",
        headers: ['Features', 'Our Product', 'Competitor A'],
        images: ['https://placehold.co/300 rounded?text=Our+Product', 'https://placehold.co/300 rounded?text=Comp+A'],
        altTexts: ['Product display image for Our Product.', 'Product display image for Competitor A.'],
        cartLinks: ['#', '#'],
        rows: [['Price', '39.99', '44.99'], ['Quality', '✓', '✕']]
      } : type === 'fourImage' ? {
        title: 'Core Product Features',
        description: 'Explore the architectural advantages and engineered highlights designed specifically to optimize your day-to-day workflow.',
        items: [
          { img: 'https://placehold.co/300x225', text: 'Feature 1 Title', desc: 'Short description text explaining feature item one details.', altText: 'Detailed close-up view highlighting feature item one.' },
          { img: 'https://placehold.co/300x225', text: 'Feature 2 Title', desc: 'Short description text explaining feature item two details.', altText: 'Detailed close-up view highlighting feature item two.' },
          { img: 'https://placehold.co/300x225', text: 'Feature 3 Title', desc: 'Short description text explaining feature item three details.', altText: 'Detailed close-up view highlighting feature item three.' },
          { img: 'https://placehold.co/300x225', text: 'Feature 4 Title', desc: 'Short description text explaining feature item four details.', altText: 'Detailed close-up view highlighting feature item four.' }
        ]
      } : type === 'dualImage' ? {
        title: 'Dual Feature Showcase',
        description: 'Compare and analyze core integrated design structures built to deliver smooth efficiency.',
        items: [
          { img: 'https://placehold.co/600x600', text: 'Left Asset Title', desc: 'Short descriptive details regarding the left component.', altText: 'Close up overview highlighting the primary left asset.' },
          { img: 'https://placehold.co/600x600', text: 'Right Asset Title', desc: 'Short descriptive details regarding the right component.', altText: 'Close up overview highlighting the secondary right asset.' }
        ]
      } : type === 'bgText' ? {
        boxTheme: 'dark',
        boxPosition: 'right',
        altText: 'Background graphic scene highlighting product feature descriptions.'
      } : null
    };

    setModules([...modules, newModule]);
  };

  const removeModule = (id) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const moveModule = (index, direction) => {
    const nextModules = [...modules];
    if (direction === 'up' && index > 0) {
      [nextModules[index], nextModules[index - 1]] = [nextModules[index - 1], nextModules[index]];
    } else if (direction === 'down' && index < nextModules.length - 1) {
      [nextModules[index], nextModules[index + 1]] = [nextModules[index + 1], nextModules[index]];
    }
    setModules(nextModules);
  };

  const updateModule = (id, fields) => {
    setModules(modules.map(m => m.id === id ? { ...m, ...fields } : m));
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Template Generator</p>
          <h1 className="text-xl font-bold text-slate-900">A+ Content Builder</h1>
        </div>
        <div className="flex gap-1 rounded-sm border border-slate-200 bg-white p-1">
          {['editor', 'pc', 'mobile', 'html'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab === 'pc' || tab === 'mobile' ? `${tab} View` : tab}
            </button>
          ))}
        </div>
      </div>

      <main className="w-full flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full h-full overflow-hidden">
            <div className="xl:col-span-4 space-y-5 h-full overflow-y-auto pr-2">
              <HeaderEditor headerData={headerData} setHeaderData={setHeaderData} />
              <StyleCustomizer styles={styles} setStyles={setStyles} />
              <ModuleControls
                modules={modules}
                addModule={addModule}
                removeModule={removeModule}
                moveModule={moveModule}
                updateModule={updateModule}
                faqs={faqs}
                setFaqs={setFaqs}
              />
            </div>

            {/* Live Canvas Viewport Section with active inline toggle triggers */}
            <div className="xl:col-span-8 rounded-sm border border-[#D5D9D9] bg-white p-5 h-full overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-widest">Live Preview</div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
                  <button
                    onClick={() => setEditorPreviewMode('pc')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      editorPreviewMode === 'pc' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    PC
                  </button>
                  <button
                    onClick={() => setEditorPreviewMode('mobile')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      editorPreviewMode === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto w-full flex justify-center items-start">
                <div className={`transition-all duration-300 w-full ${
                  editorPreviewMode === 'mobile' ? 'max-w-95 border-x border-slate-200 shadow-md rounded-sm overflow-hidden bg-white' : 'max-w-full'
                }`}>
                  <ModulePreview
                    mode={editorPreviewMode}
                    styles={styles}
                    headerData={headerData}
                    modules={modules}
                    faqs={faqs}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'pc' ? (
          <div className="rounded-sm border border-[#D5D9D9] bg-white w-full h-full overflow-y-auto">
            <ModulePreview mode="pc" styles={styles} headerData={headerData} modules={modules} faqs={faqs} />
          </div>
        ) : activeTab === 'mobile' ? (
          <div className="w-full h-full overflow-y-auto">
            <div className="max-w-105 mx-auto bg-white rounded-[40px] p-3 border-12 border-slate-900 shadow-xl relative my-4">
              <div className="h-4 w-28 bg-slate-900 absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-xl z-20"></div>
              <div className="overflow-y-auto max-h-175 scrollbar-none rounded-2xl">
                <ModulePreview mode="mobile" styles={styles} headerData={headerData} modules={modules} faqs={faqs} />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto">
            <OutputManager styles={styles} headerData={headerData} modules={modules} faqs={faqs} />
          </div>
        )}
      </main>
    </div>
  );
}