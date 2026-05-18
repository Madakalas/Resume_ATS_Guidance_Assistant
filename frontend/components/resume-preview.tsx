'use client';

import type { ResumeVersion, DesignSettings, SkillGroup } from '@/lib/store';
import { useEffect, useState, useRef } from 'react';

// ─── constants ────────────────────────────────────────────────────────────────
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const LETTER_WIDTH_MM = 215.9;
const LETTER_HEIGHT_MM = 279.4;
const MM_TO_PX = 3.7795;

function px(mm: number) { return mm * MM_TO_PX; }
function nameSizePx(size: string) { return size === 'xs' ? 16 : size === 's' ? 20 : size === 'm' ? 24 : size === 'l' ? 28 : 32; }
function titleSizePx(size: string) { return size === 's' ? 10 : size === 'm' ? 12 : 14; }
function headingSizePx(size: string) { return size === 's' ? 10 : size === 'm' ? 11 : size === 'l' ? 13 : 15; }
function getAccent(d: DesignSettings) { return d.accentColor === 'none' ? '#374151' : d.accentColor; }

// ─── Header link logos (SVG) ───────────────────────────────────────────────────
const LINK_ICONS = {
  linkedin: (color: string, size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0, display: 'block' }}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  github: (color: string, size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0, display: 'block' }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  globe: (color: string, size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

// ─── Google Font loader ───────────────────────────────────────────────────────
function GoogleFontLoader({ fontFamily }: { fontFamily: string }) {
  useEffect(() => {
    const safe = fontFamily.replace(/ /g, '+');
    const id = `gfont-${safe}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id; link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${safe}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [fontFamily]);
  return null;
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ title, d, baseFontSize, type }: { title: string; d: DesignSettings; baseFontSize: number; type: string }) {
  const accent = getAccent(d);
  const textColor = d.accentApplyHeadings ? accent : '#111827';
  const lineColor = d.accentApplyHeadingsLine ? accent : '#374151';
  const text = d.sectionHeadingCaps === 'uppercase' ? title.toUpperCase() : title;
  const fontSize = headingSizePx(d.sectionHeadingSize);

  const ICONS: Record<string, string> = { summary: '👤', experience: '💼', projects: '📁', skills: '🧠', education: '🎓', awards: '🏆' };
  const icon = d.sectionHeadingIcons !== 'none' ? ICONS[type] : null;
  const content = <>{icon && <span style={{ fontSize: fontSize - 1, marginRight: 4 }}>{icon}</span>}{text}</>;

  const base: React.CSSProperties = { fontSize, fontWeight: 700, color: textColor, letterSpacing: '0.06em', display: 'flex', alignItems: 'center' };

  if (d.sectionHeadingStyle === 'underline') return (
    <div style={{ marginBottom: 5 }}><div style={base}>{content}</div><div style={{ height: 1, backgroundColor: lineColor, marginTop: 1 }} /></div>
  );
  if (d.sectionHeadingStyle === 'double-underline') return (
    <div style={{ marginBottom: 5 }}><div style={base}>{content}</div><div style={{ height: 1, backgroundColor: lineColor, marginTop: 1 }} /><div style={{ height: 1, backgroundColor: lineColor, marginTop: 2 }} /></div>
  );
  if (d.sectionHeadingStyle === 'box') return (
    <div style={{ ...base, border: `1px solid ${lineColor}`, padding: '2px 6px', display: 'inline-flex', marginBottom: 6 }}>{content}</div>
  );
  if (d.sectionHeadingStyle === 'filled') return (
    <div style={{ ...base, backgroundColor: textColor, color: '#fff', padding: '2px 6px', borderRadius: 2, marginBottom: 6 }}>{content}</div>
  );
  if (d.sectionHeadingStyle === 'line-left') return (
    <div style={{ marginBottom: 6, display: 'flex', alignItems: 'stretch', gap: 6 }}>
      <div style={{ width: 3, backgroundColor: accent, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch' }} />
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 6 }}>
        <div style={base}>{content}</div>
        <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
      </div>
    </div>
  );
  if (d.sectionHeadingStyle === 'overline') return (
    <div style={{ marginBottom: 5 }}><div style={{ height: 1, backgroundColor: lineColor, marginBottom: 2 }} /><div style={base}>{content}</div></div>
  );
  if (d.sectionHeadingStyle === 'wavy') return (
    <div style={{ ...base, textDecoration: `underline wavy ${accent}`, textUnderlineOffset: 3, marginBottom: 6 }}>{content}</div>
  );
  // plain
  return <div style={{ ...base, marginBottom: 5 }}>{content}</div>;
}

// ─── Shared section renderers ─────────────────────────────────────────────────
function renderBullet(text: string, i: number, d: DesignSettings, s: any) {
  return (
    <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4, paddingLeft: s.indentBody ? 12 : 0 }}>
      <span style={{ flexShrink: 0, marginTop: '0.1em', color: d.accentApplyDots ? getAccent(d) : '#374151' }}>
        {s.listStyle === 'hyphen' ? '–' : '•'}
      </span>
      <span>{text}</span>
    </div>
  );
}

function renderDateLoc(start?: string, end?: string, location?: string, d?: DesignSettings) {
  const dateStr = [start, end].filter(Boolean).join(' – ');
  const parts = [dateStr, location].filter(Boolean).join(' | ');
  if (!parts) return null;
  return <span style={{ color: d?.accentApplyDates ? getAccent(d) : '#6b7280', fontSize: '0.9em', whiteSpace: 'nowrap' }}>{parts}</span>;
}

function titleSubtitleSizePx(size: string, baseFs: number) {
  if (size === 's') return baseFs * 0.88;
  if (size === 'l') return baseFs * 1.08;
  return baseFs; // 'm' = same as base
}

function getSubStyle(s: any, baseFs?: number): React.CSSProperties {
  const fs = baseFs ? titleSubtitleSizePx(s.titleSubtitleSize || 'm', baseFs) : undefined;
  return { fontStyle: s.subtitleStyle === 'italic' ? 'italic' : 'normal', fontWeight: s.subtitleStyle === 'bold' ? 700 : 400, color: '#4b5563', ...(fs ? { fontSize: fs } : {}) };
}

// ─── Section renderers ────────────────────────────────────────────────────────
function PersonalHeader({ section, d, s, baseFs, narrow = false, contactSplit = false }: { section: any; d: DesignSettings; s: any; baseFs: number; narrow?: boolean; contactSplit?: boolean }) {
  const c = section.content;
  const accent = getAccent(d);
  const nameColor = d.accentApplyName ? accent : '#111827';
  const titleColor = d.accentApplyJobTitle ? accent : '#374151';
  const iconColor = d.accentApplyHeaderIcons ? accent : '#6b7280';

  const alignment = d.headerAlignment ?? 'left';
  const arrangement = d.headerArrangement ?? 'inline';

  const contactItems = [
    c.email && { kind: 'plain' as const, icon: '✉', text: c.email, url: null },
    c.phone && { kind: 'plain' as const, icon: '☎', text: c.phone, url: null },
    (c.city || c.country) && { kind: 'plain' as const, icon: '📍', text: [c.city, c.country].filter(Boolean).join(','), url: null },
    c.portfolio && { kind: 'link' as const, icon: 'globe', text: c.portfolio.replace(/^https?:\/\/(www\.)?/, ''), url: c.portfolio },
    c.linkedin && { kind: 'link' as const, icon: 'linkedin', text: c.linkedin.replace(/^https?:\/\/(www\.)?/, ''), url: c.linkedin },
    c.github && { kind: 'link' as const, icon: 'github', text: c.github.replace(/^https?:\/\/(www\.)?/, ''), url: c.github },
  ].filter(Boolean) as { kind: 'plain' | 'link'; icon: string; text: string; url: string | null }[];

  const getSep = () => {
    if (d.headerContactStyle === 'bullet') return <span style={{ color: iconColor, margin: '0 6px' }}>•</span>;
    if (d.headerContactStyle === 'bar') return <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>;
    return null;
  };

  const linkColor = d.linkBlueColor ? '#2563eb' : '#374151';
  const iconSize = Math.max(baseFs * 0.9, 12);

  const renderIcon = (item: typeof contactItems[0]) => {
    if (!d.headerContactStyle || d.headerContactStyle === 'none') return null;
    const wrap = (el: React.ReactNode) => <span style={{ marginRight: 3, display: 'inline-flex', alignItems: 'center' }}>{el}</span>;
    if (item.icon === 'linkedin') return wrap(LINK_ICONS.linkedin(iconColor, iconSize));
    if (item.icon === 'github') return wrap(LINK_ICONS.github(iconColor, iconSize));
    if (item.icon === 'globe') return wrap(LINK_ICONS.globe(iconColor, iconSize));
    return <span style={{ color: iconColor, marginRight: 3, fontSize: baseFs * 0.82 }}>{item.icon}</span>;
  };

  const renderContactItem = (item: typeof contactItems[0], i: number, showSep: boolean) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
      {showSep && getSep()}
      {d.headerContactStyle === 'icon' && renderIcon(item)}
      {item.kind === 'link' && item.url ? (
        <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
      ) : (
        <span style={{ color: linkColor }}>{item.text}</span>
      )}
    </span>
  );

  const photoSizePx = d.photoSize === 'sm' ? 52 : d.photoSize === 'lg' ? 84 : 68;
  const photoEl = d.showPhoto && d.photoUrl ? (
    <img src={d.photoUrl} alt="" style={{
      width: photoSizePx, height: photoSizePx, objectFit: 'cover', flexShrink: 0,
      borderRadius: d.photoShape === 'circle' ? '50%' : d.photoShape === 'rounded' ? 8 : 0,
    }} />
  ) : null;

  const nameEl = (
    <span style={{ fontSize: nameSizePx(d.nameSize), fontWeight: d.nameBold ? 700 : 400, color: nameColor, fontFamily: d.nameFont === 'creative' ? 'Georgia, serif' : 'inherit', lineHeight: 1.1 }}>
      {c.fullName || 'Your Name'}
    </span>
  );
  const titleEl = c.headline ? (
    <span style={{ fontSize: titleSizePx(d.titleSize), color: titleColor, fontStyle: d.titleStyle === 'italic' ? 'italic' : 'normal', fontWeight: d.titleStyle === 'bold' ? 700 : 400, marginLeft: d.titlePlacement === 'same-line' ? 8 : 0 }}>
      {c.headline}
    </span>
  ) : null;

  const nameTitleBlock = (justifyContent: string) => (
    d.titlePlacement === 'same-line' && c.headline ? (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, justifyContent }}>
        {nameEl}{titleEl}
      </div>
    ) : (
      <>
        <div>{nameEl}</div>
        {titleEl && <div>{titleEl}</div>}
      </>
    )
  );

  // ── NARROW mode (two-col layout where header is in a narrow column) ──────────
  if (narrow) {
    const textAlign = alignment === 'center' ? 'center' as const : alignment === 'right' ? 'right' as const : 'left' as const;
    const alignItems = alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';
    return (
      <div style={{ textAlign, display: 'flex', flexDirection: 'column', alignItems }}>
        <div>{nameEl}</div>
        {titleEl && <div>{titleEl}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, alignItems }}>
          {contactItems.map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.85 }}>
              {d.headerContactStyle === 'icon' && renderIcon(item)}
              {item.kind === 'link' && item.url ? (
                <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none', wordBreak: 'break-all' }}>{item.text}</a>
              ) : (
                <span style={{ color: linkColor, wordBreak: 'break-all' }}>{item.text}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── contactSplit (two-col layout, header on top) ─────────────────────────────
  if (contactSplit) {
    return (
      <div>
        {nameTitleBlock('flex-start')}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: 4, width: '100%' }}>
          {contactItems.map((item, i) => renderContactItem(item, i, i > 0))}
        </div>
      </div>
    );
  }

  // ── CENTER alignment — both arrangement options produce same look (Image 5) ──
  if (alignment === 'center') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {photoEl && <div style={{ marginBottom: 8 }}>{photoEl}</div>}
        <div>{nameEl}</div>
        {titleEl && <div style={{ marginTop: 2 }}>{titleEl}</div>}
        {/* Contacts always inline, centered */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 6 }}>
          {contactItems.map((item, i) => renderContactItem(item, i, i > 0))}
        </div>
      </div>
    );
  }

  // ── LEFT alignment ───────────────────────────────────────────────────────────
  if (alignment === 'left') {
    if (arrangement === 'stacked') {
      // Image 1: name+title on left, contacts each on their own line below
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {photoEl && photoEl}
          <div style={{ flex: 1 }}>
            {nameTitleBlock('flex-start')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                  {d.headerContactStyle === 'icon' && renderIcon(item)}
                  {item.kind === 'link' && item.url ? (
                    <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                  ) : (
                    <span style={{ color: linkColor }}>{item.text}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (arrangement === 'inline') {
      // Image 2: name+title on left, all contacts in one horizontal row
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {photoEl && photoEl}
          <div style={{ flex: 1 }}>
            {nameTitleBlock('flex-start')}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginTop: 6 }}>
              {contactItems.map((item, i) => renderContactItem(item, i, i > 0))}
            </div>
          </div>
        </div>
      );
    }
    if (arrangement === 'split') {
      // Image 3: name+title on left, contacts split into 2 columns grid
      const half = Math.ceil(contactItems.length / 2);
      const col1 = contactItems.slice(0, half);
      const col2 = contactItems.slice(half);
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {photoEl && photoEl}
          <div style={{ flex: 1 }}>
            {nameTitleBlock('flex-start')}
            <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {col1.map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                    {d.headerContactStyle === 'icon' && renderIcon(item)}
                    {item.kind === 'link' && item.url ? (
                      <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                    ) : (
                      <span style={{ color: linkColor }}>{item.text}</span>
                    )}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {col2.map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                    {d.headerContactStyle === 'icon' && renderIcon(item)}
                    {item.kind === 'link' && item.url ? (
                      <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                    ) : (
                      <span style={{ color: linkColor }}>{item.text}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── RIGHT alignment ──────────────────────────────────────────────────────────
  if (alignment === 'right') {
    if (arrangement === 'stacked') {
      // Image 7: name+title right-aligned, contacts stacked vertically on right
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            {nameTitleBlock('flex-end')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, alignItems: 'flex-end' }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                  {d.headerContactStyle === 'icon' && renderIcon(item)}
                  {item.kind === 'link' && item.url ? (
                    <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                  ) : (
                    <span style={{ color: linkColor }}>{item.text}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          {photoEl && photoEl}
        </div>
      );
    }
    if (arrangement === 'inline') {
      // Image 8: name+title right-aligned, contacts in one horizontal row on right
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            {nameTitleBlock('flex-end')}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: 6 }}>
              {contactItems.map((item, i) => renderContactItem(item, i, i > 0))}
            </div>
          </div>
          {photoEl && photoEl}
        </div>
      );
    }
    if (arrangement === 'split') {
      // Image 9: name+title right-aligned, contacts split 2 columns on right
      const half = Math.ceil(contactItems.length / 2);
      const col1 = contactItems.slice(0, half);
      const col2 = contactItems.slice(half);
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            {nameTitleBlock('flex-end')}
            <div style={{ display: 'flex', gap: 24, marginTop: 6, justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {col1.map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                    {d.headerContactStyle === 'icon' && renderIcon(item)}
                    {item.kind === 'link' && item.url ? (
                      <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                    ) : (
                      <span style={{ color: linkColor }}>{item.text}</span>
                    )}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {col2.map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: baseFs * 0.88 }}>
                    {d.headerContactStyle === 'icon' && renderIcon(item)}
                    {item.kind === 'link' && item.url ? (
                      <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>{item.text}</a>
                    ) : (
                      <span style={{ color: linkColor }}>{item.text}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {photoEl && photoEl}
        </div>
      );
    }
  }

  // Fallback (left inline)
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {photoEl && photoEl}
      <div style={{ flex: 1 }}>
        {nameTitleBlock('flex-start')}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: 6 }}>
          {contactItems.map((item, i) => renderContactItem(item, i, i > 0))}
        </div>
      </div>
    </div>
  );
}

function ExperienceSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const roles = section.content.roles || [];
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="experience" />
      {roles.map((role: any, i: number) => {
        const titleFirst = d.experienceOrder !== 'company-title';
        const primary = titleFirst ? role.title : role.company;
        const secondary = titleFirst ? role.company : role.title;
        const entrySpacing = Math.max(s.spaceBetweenEntries * 2 + 6, 10);
        return (
          <div key={i} style={{ marginBottom: entrySpacing }}>
            {s.subtitlePlacement === 'same-line' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: baseFs }}>{primary}</span>
                  <span style={getSubStyle(s, baseFs)}>{secondary}</span>
                  {role.location && <span style={{ color: '#9ca3af', fontSize: baseFs * 0.88 }}>{role.location}</span>}
                </div>
                {renderDateLoc(role.startDate, role.endDate, undefined, d)}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: baseFs }}>{primary}</span>
                  {renderDateLoc(role.startDate, role.endDate, role.location, d)}
                </div>
                <div style={getSubStyle(s, baseFs)}>{secondary}</div>
              </>
            )}
            <div style={{ marginTop: 4 }}>{(role.bullets || []).map((b: string, j: number) => renderBullet(b, j, d, s))}</div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectsSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const projects = section.content.projects || [];
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="projects" />
      {projects.map((proj: any, i: number) => (
        <div key={i} style={{ marginBottom: Math.max(s.spaceBetweenEntries * 2 + 6, 10) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: baseFs }}>{proj.name}</span>
              {proj.link && (
                <span style={{ fontSize: baseFs * 0.85, color: d.linkBlueColor ? '#2563eb' : '#6b7280' }}>
                  {d.linkIcon && <span style={{ marginRight: 2 }}>{d.linkIconStyle === 'chain' ? '🔗' : '↗'}</span>}{proj.link}
                </span>
              )}
            </div>
            {renderDateLoc(proj.startDate, proj.endDate, undefined, d)}
          </div>
          {proj.role && <div style={getSubStyle(s, baseFs)}>{proj.role}</div>}
          <div style={{ marginTop: 4 }}>{(proj.bullets || []).map((b: string, j: number) => renderBullet(b, j, d, s))}</div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const groups: SkillGroup[] = section.content.groups || [];
  const accent = getAccent(d);
  const accentDot = d.accentApplyDots ? accent : undefined;
  const subStr = (heading: string) => d.skillsSubinfo === 'colon' ? `${heading}: ` : d.skillsSubinfo === 'bracket' ? `${heading} (` : `${heading} — `;
  const subEnd = () => d.skillsSubinfo === 'bracket' ? ')' : '';

  const renderGroup = (group: SkillGroup) => {
    const layout = d.skillsLayout;

    if (layout === 'bubble') return (
      <div key={group.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: baseFs, flexShrink: 0 }}>{subStr(group.heading)}</span>
        {group.items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 20, padding: '1px 7px', fontSize: baseFs * 0.9 }}>{item}</span>
        ))}
        {d.skillsSubinfo === 'bracket' && <span style={{ fontWeight: 600 }}>)</span>}
      </div>
    );

    if (layout === 'level') {
      const levelStyle = (d as any).skillsLevelStyle || 'text';
      return (
        <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: baseFs, minWidth: 80 }}>{group.heading}</span>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {group.items.map((item, i) => {
              if (levelStyle === 'dots') return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: baseFs }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentDot || '#374151', display: 'inline-block' }} />
                  {item}
                </span>
              );
              if (levelStyle === 'bar') return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: baseFs }}>
                  <span style={{ width: 20, height: 4, borderRadius: 2, background: accentDot || '#374151', display: 'inline-block' }} />
                  {item}
                </span>
              );
              // text (default)
              return <span key={i} style={{ background: accentDot || '#374151', color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: baseFs * 0.85 }}>{item}</span>;
            })}
          </div>
        </div>
      );
    }

    if (layout === 'compact') {
      const compactStyle = (d as any).skillsCompactStyle || 'bullet';
      if (compactStyle === 'pipe') return (
        <div key={group.id} style={{ marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
          {group.items.map((item, i) => <span key={i} style={{ fontSize: baseFs }}>{i > 0 && <span style={{ color: '#d1d5db', margin: '0 4px' }}>|</span>}{item}</span>)}
          {subEnd() && <span style={{ fontWeight: 600 }}>{subEnd()}</span>}
        </div>
      );
      if (compactStyle === 'newline') return (
        <div key={group.id} style={{ marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: baseFs, display: 'block' }}>{group.heading}</span>
          {group.items.map((item, i) => <div key={i} style={{ fontSize: baseFs }}>• {item}</div>)}
        </div>
      );
      if (compactStyle === 'comma') return (
        <div key={group.id} style={{ marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
          <span style={{ fontSize: baseFs }}>{group.items.join(', ')}{subEnd()}</span>
        </div>
      );
      // bullet (default)
      return (
        <div key={group.id} style={{ marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
          <span style={{ fontSize: baseFs }}>• {group.items.join(' • ')}{subEnd()}</span>
        </div>
      );
    }

    if (layout === 'pipe') return (
      <div key={group.id} style={{ marginBottom: 3 }}>
        <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
        {group.items.map((item, i) => <span key={i} style={{ fontSize: baseFs }}>{i > 0 && <span style={{ color: '#d1d5db', margin: '0 4px' }}>|</span>}{item}</span>)}
      </div>
    );
    if (layout === 'newline') return (
      <div key={group.id} style={{ marginBottom: 3 }}>
        <span style={{ fontWeight: 600, fontSize: baseFs, display: 'block' }}>{group.heading}</span>
        {group.items.map((item, i) => <div key={i} style={{ fontSize: baseFs }}>{item}</div>)}
      </div>
    );
    if (layout === 'comma') return (
      <div key={group.id} style={{ marginBottom: 3 }}>
        <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
        <span style={{ fontSize: baseFs }}>{group.items.join(', ')}{subEnd()}</span>
      </div>
    );
    // grid (default) - uses skillsColumns for column count
    return (
      <div key={group.id} style={{ marginBottom: 3 }}>
        <span style={{ fontWeight: 600, fontSize: baseFs }}>{subStr(group.heading)}</span>
        <span style={{ fontSize: baseFs }}>{group.items.join(', ')}{subEnd()}</span>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="skills" />
      {d.skillsLayout === 'grid' && d.skillsColumns > 1 ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${d.skillsColumns}, 1fr)`, gap: '0 12px' }}>
          {groups.map(renderGroup)}
        </div>
      ) : <div>{groups.map(renderGroup)}</div>}
    </div>
  );
}

function EducationSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const schools = section.content.schools || [];
  const schoolFirst = d.educationOrder === 'school-degree';
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="education" />
      {schools.map((edu: any, i: number) => {
        const primary = schoolFirst ? edu.school : `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
        const secondary = schoolFirst ? `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}` : edu.school;
        return (
          <div key={i} style={{ marginBottom: Math.max(s.spaceBetweenEntries * 2 + 6, 10) }}>
            {s.subtitlePlacement === 'same-line' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: baseFs }}>{primary}</span>
                  <span style={getSubStyle(s, baseFs)}>{secondary}</span>
                </div>
                {renderDateLoc(edu.startDate, edu.endDate, edu.location, d)}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: baseFs }}>{primary}</span>
                  {renderDateLoc(edu.startDate, edu.endDate, edu.location, d)}
                </div>
                <div style={getSubStyle(s, baseFs)}>{secondary}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummarySection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {d.showProfileHeading && <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="summary" />}
      <p style={{ fontSize: baseFs, lineHeight: Math.max(Number(s.lineHeight) || 1.2, 1.3), color: '#374151', margin: 0 }}>{section.content.text}</p>
    </div>
  );
}

function AwardsSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const certs = section.content.certifications || [];
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="awards" />
      {certs.map((cert: any, i: number) => (
        <div key={i} style={{ marginBottom: Math.max(s.spaceBetweenEntries * 2 + 6, 10) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: baseFs }}>{cert.name}</span>
            {cert.issueDate && <span style={{ color: '#6b7280', fontSize: baseFs * 0.9 }}>{cert.issueDate}</span>}
          </div>
          <div style={getSubStyle(s, baseFs)}>{cert.issuer}</div>
        </div>
      ))}
    </div>
  );
}

function GenericSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionHeading title={section.title} d={d} baseFontSize={baseFs} type="custom" />
      <p style={{ fontSize: baseFs, color: '#374151', lineHeight: Math.max(Number(s.lineHeight) || 1.2, 1.3), margin: 0 }}>{section.content.text || ''}</p>
    </div>
  );
}

// ─── Dispatch section renderer ────────────────────────────────────────────────
function RenderSection({ section, d, s, baseFs }: { section: any; d: DesignSettings; s: any; baseFs: number }) {
  const props = { section, d, s, baseFs };
  switch (section.type) {
    case 'experience': return <ExperienceSection {...props} />;
    case 'projects': return <ProjectsSection {...props} />;
    case 'skills': return <SkillsSection {...props} />;
    case 'education': return <EducationSection {...props} />;
    case 'summary': return <SummarySection {...props} />;
    case 'awards': return <AwardsSection {...props} />;
    case 'personal-info': return null; // handled separately
    default: return <GenericSection {...props} />;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
const FOOTER_HEIGHT = 18;

export function ResumePreview({ version }: { version: ResumeVersion }) {
  const { settings: s, sections } = version;
  const d = s.design;
  const contentRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(1);

  const paperW = s.paperSize === 'Letter' ? LETTER_WIDTH_MM : A4_WIDTH_MM;
  const paperH = s.paperSize === 'Letter' ? LETTER_HEIGHT_MM : A4_HEIGHT_MM;
  const widthPx = px(paperW);
  const heightPx = px(paperH);
  const marginH = px(s.marginLeftRight);
  const marginV = px(s.marginTopBottom);
  const baseFs = s.fontSize;

  const visibleSections = [...sections].filter(sec => sec.visible).sort((a, b) => a.order - b.order);
  const personalSection = visibleSections.find(sec => sec.type === 'personal-info');
  const bodySections = visibleSections.filter(sec => sec.type !== 'personal-info');

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const h = Math.max(el.offsetHeight, el.scrollHeight);
      // Account for extra marginV * 2 per page added to keep top/bottom margins on each page
      const usableHeight = heightPx - marginV * 2;
      setNumPages(Math.max(1, Math.ceil(h / usableHeight)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [heightPx, version?.id, visibleSections.length]);

  const fontFamily = `'${d.fontFamily}', ${d.fontCategory === 'serif' ? 'Georgia, serif' : d.fontCategory === 'mono' ? 'monospace' : 'Arial, sans-serif'}`;

  const baseStyle: React.CSSProperties = {
    fontFamily,
    fontSize: baseFs,
    lineHeight: Math.max(Number(s.lineHeight) || 1.2, 1.3),
    color: '#111827',
    WebkitFontSmoothing: 'antialiased',
  };

  // ── Determine column split ──────────────────────────────────────────────────
  // For Two/Mix: split body sections into left and right columns
  // For One: all body sections in one column
  const isMultiCol = s.layoutColumns === 'two' || s.layoutColumns === 'mix';
  const leftPct = s.columnWidthLeft / 100;
  const rightPct = 1 - leftPct;
  const gap = 14; // gap between columns in px

  // For Two/Mix split: first half goes left, second goes right (simple split)
  const splitIdx = Math.ceil(bodySections.length / 2);
  const leftSections = bodySections.slice(0, splitIdx);
  const rightSections = bodySections.slice(splitIdx);

  // Content width inside margins
  const contentW = widthPx - marginH * 2;
  const hp = s.headerPosition ?? 'top';

  // ── Render header section ──────────────────────────────────────────────────
  // When Two/Mix + Header Top: contact row is split (left = email/phone, right = location/links)
  const headerEl = personalSection ? (
    <PersonalHeader
      section={personalSection}
      d={d}
      s={s}
      baseFs={baseFs}
      contactSplit={isMultiCol && hp === 'top'}
    />
  ) : null;

  // ── Layout renderer ────────────────────────────────────────────────────────
  const renderSingleCol = (secs: typeof bodySections) => (
    <div>{secs.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}</div>
  );

  const renderTwoCol = (leftSecs: typeof bodySections, rightSecs: typeof bodySections) => {
    const leftW = contentW * leftPct - gap / 2;
    const rightW = contentW * rightPct - gap / 2;
    return (
      <div style={{ display: 'flex', gap, alignItems: 'flex-start' }}>
        <div style={{ width: leftW, flexShrink: 0 }}>
          {leftSecs.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
        </div>
        <div style={{ width: rightW, flexShrink: 0 }}>
          {rightSecs.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
        </div>
      </div>
    );
  };

  // ── Compose final layout based on columns + headerPosition ────────────────
  /*
   * ONE column → header on top, all body in one column (no headerPosition option)
   *
   * TWO columns + headerPosition=top    → header full-width on top, body in 2 cols
   * TWO columns + headerPosition=left   → header in left col, body right col (2 cols side by side)
   * TWO columns + headerPosition=right  → header in right col, body left col (2 cols side by side)
   *
   * MIX columns + headerPosition=top    → header full-width on top, body in ONE column (single column)
   * MIX columns + headerPosition=left   → header in left col, body in single column on right
   * MIX columns + headerPosition=right  → header in right col, body in single column on left
   */

  let bodyEl: React.ReactNode;

  if (!isMultiCol) {
    // ONE column — simple, no header position
    bodyEl = (
      <div style={{ padding: `${marginV}px ${marginH}px` }}>
        {headerEl && <div style={{ marginBottom: 10 }}>{headerEl}</div>}
        {renderSingleCol(bodySections)}
      </div>
    );
  } else if (s.layoutColumns === 'two') {
    if (hp === 'top') {
      // Header full-width on top, body split into 2 cols
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px` }}>
          {headerEl && <div style={{ marginBottom: 10 }}>{headerEl}</div>}
          {renderTwoCol(leftSections, rightSections)}
        </div>
      );
    } else if (hp === 'left') {
      // Header in left col, body sections in right col (but both are full-height columns)
      const leftW = contentW * leftPct - gap / 2;
      const rightW = contentW * rightPct - gap / 2;
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px`, display: 'flex', gap, alignItems: 'flex-start' }}>
          <div style={{ width: leftW, flexShrink: 0 }}>
            {headerEl}
            <div style={{ marginTop: 10 }}>
              {leftSections.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
            </div>
          </div>
          <div style={{ width: rightW, flexShrink: 0 }}>
            {rightSections.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
          </div>
        </div>
      );
    } else {
      // Header in right col
      const leftW = contentW * leftPct - gap / 2;
      const rightW = contentW * rightPct - gap / 2;
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px`, display: 'flex', gap, alignItems: 'flex-start' }}>
          <div style={{ width: leftW, flexShrink: 0 }}>
            {leftSections.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
          </div>
          <div style={{ width: rightW, flexShrink: 0 }}>
            {headerEl}
            <div style={{ marginTop: 10 }}>
              {rightSections.map(sec => <RenderSection key={sec.id} section={sec} d={d} s={s} baseFs={baseFs} />)}
            </div>
          </div>
        </div>
      );
    }
  } else {
    // MIX layout — body always single column
    if (hp === 'top') {
      // Header full-width on top, body in one column
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px` }}>
          {headerEl && <div style={{ marginBottom: 10 }}>{headerEl}</div>}
          {renderSingleCol(bodySections)}
        </div>
      );
    } else if (hp === 'left') {
      // Header on left only; body full width below (like One column)
      const leftW = contentW * leftPct - gap / 2;
      const rightW = contentW * rightPct - gap / 2;
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px` }}>
          <div style={{ display: 'flex', gap, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: leftW, flexShrink: 0 }}>
              {personalSection && <PersonalHeader section={personalSection} d={d} s={s} baseFs={baseFs} narrow={true} />}
            </div>
            <div style={{ width: rightW, flexShrink: 0 }} />
          </div>
          <div style={{ width: '100%' }}>{renderSingleCol(bodySections)}</div>
        </div>
      );
    } else {
      // Header on right only; body full width below (like One column)
      const leftW = contentW * leftPct - gap / 2;
      const rightW = contentW * rightPct - gap / 2;
      bodyEl = (
        <div style={{ padding: `${marginV}px ${marginH}px` }}>
          <div style={{ display: 'flex', gap, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: leftW, flexShrink: 0 }} />
            <div style={{ width: rightW, flexShrink: 0 }}>
              {personalSection && <PersonalHeader section={personalSection} d={d} s={s} baseFs={baseFs} narrow={true} />}
            </div>
          </div>
          <div style={{ width: '100%' }}>{renderSingleCol(bodySections)}</div>
        </div>
      );
    }
  }

  return (
    <>
      <GoogleFontLoader fontFamily={d.fontFamily} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {/* Hidden measurement div — renders all content off-screen to get true height */}
        <div
          ref={contentRef}
          style={{
            ...baseStyle,
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: widthPx,
            height: 'auto',
            visibility: 'hidden',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {bodyEl}
        </div>

        {/* Render one A4/Letter page per numPages — each clips to one page height */}
        {Array.from({ length: numPages }, (_, pageIndex) => (
          <div
            key={pageIndex}
            data-resume-paper
            style={{
              width: widthPx,
              height: heightPx,
              background: '#fff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Slide content so this page shows the right slice */}
            <div style={{
              ...baseStyle,
              position: 'absolute',
              top: -(pageIndex * heightPx) + (pageIndex * marginV * 2),
              left: 0,
              right: 0,
            }}>
              {bodyEl}
            </div>
            {/* White mask to preserve top margin on pages 2+ */}
            {pageIndex > 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: marginV, background: '#fff', zIndex: 3 }} />
            )}
            {/* White mask to preserve bottom margin on all pages except last */}
            {pageIndex < numPages - 1 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: marginV, background: '#fff', zIndex: 3 }} />
            )}

            {/* Footer for this page */}
            {d.showFooter && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: FOOTER_HEIGHT,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `0 ${marginH}px`,
                fontSize: baseFs * 0.8,
                color: '#9ca3af',
                background: '#fff',
                zIndex: 5,
              }}>
                {d.footerEmail && <span>{personalSection?.content.email}</span>}
                {d.footerName && <span>{personalSection?.content.fullName}</span>}
                {d.footerPageNumbers && <span>{pageIndex + 1} / {numPages}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResumePreview;
