import React from 'react';
import HeroBannerModule from './Modules/HeroBannerModule';
import BgImageTextModule from './Modules/BgImageTextModule';
import SingleImageTextModule from './Modules/SingleImageTextModule'; 
import DualImageTextModule from './Modules/DualImageTextModule';
import FourImageTextModule from './Modules/FourImageTextModule';
import ComparisonTableModule from './Modules/ComparisonTableModule';

export default function ModulePreview({ mode, styles, headerData, modules, faqs }) {
  const isMobile = mode === 'mobile';

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1e293b', fontFamily: styles.fontFamily }} className="w-full">
      
      {/* Light Theme Header Navigation Bar - Switches size and wrapping behavior depending on selected view */}
      <div 
        style={{ backgroundColor: '#f8fafc', color: '#0f172a' }} 
        className={`p-4 flex items-center border-b border-slate-200 ${
          isMobile ? 'flex-col gap-2 text-center text-xs' : 'flex-row justify-between text-sm font-semibold'
        }`}
      >
        <a 
          href={headerData.storeLink} 
          target="_blank" 
          rel="noreferrer" 
          className="text-base font-extrabold tracking-tight shrink-0" 
          style={{ color: styles.primaryColor || '#ea580c' }}
        >
          {headerData.storeName}
        </a>
        <div className={`flex text-slate-600 font-bold ${isMobile ? 'space-x-4 text-xs justify-center w-full' : 'space-x-6'}`}>
          {headerData.shopLinks.map(link => (
            <a key={link.id} href={link.url} className="hover:text-slate-900 transition-colors hover:underline whitespace-nowrap">{link.label}</a>
          ))}
        </div>
      </div>

      {/* Dynamic continuous stream viewport pipeline */}
      <div className="w-full">
        {modules.map((m) => {
          const moduleProps = { data: m, styles, mode };
          
          switch (m.type) {
            case 'hero': 
              return <HeroBannerModule key={m.id} {...moduleProps} />;
            case 'bgText': 
              return <BgImageTextModule key={m.id} {...moduleProps} />;
            case 'singleImage': 
              return <SingleImageTextModule key={m.id} {...moduleProps} />;
            case 'dualImage': 
              return <DualImageTextModule key={m.id} {...moduleProps} />;
            case 'fourImage': 
              return <FourImageTextModule key={m.id} {...moduleProps} />;
            case 'table': 
              return <ComparisonTableModule key={m.id} {...moduleProps} />;
            default: 
              return null;
          }
        })}
      </div>

      {/* Adaptive FAQ layout render container block */}
      {faqs.length > 0 && (
        <div className="p-6 border-t border-slate-200 bg-slate-50/50 w-full">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-center mb-5 text-slate-800" style={{ color: styles.primaryColor || '#ea580c' }}>
            Frequently Asked Questions
          </h3>
          <div className={`space-y-3.5 w-full mx-auto ${isMobile ? 'max-w-full' : 'max-w-3xl'}`}>
            {faqs.map(f => (
              <div key={f.id} className="p-4 border border-slate-200 bg-white rounded-lg">
                <h4 className="text-xs font-bold flex items-start space-x-1.5 text-slate-900">
                  <span className="font-extrabold" style={{ color: styles.primaryColor || '#ea580c' }}>Q:</span>
                  <span>{f.question}</span>
                </h4>
                <p className="text-xs mt-1.5 text-slate-600 pl-4 border-l-2 leading-relaxed" style={{ borderColor: styles.primaryColor || '#ea580c' }}>
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}