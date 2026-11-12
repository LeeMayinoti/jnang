import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Ju|'hoan terms appear as "word (gloss)", e.g. "zo (honey)"
const TERM_REGEX = /([\w!\|\/\'\-]+\s*\([\w\s\-\/\'\!]+\))/g;

const renderFormattedStory = (text) => {
  if (!text) return null;
  return text.split('\n').filter((p) => p.trim()).map((para, pIdx) => (
    <p key={pIdx}>
      {para.split(TERM_REGEX).map((part, idx) =>
        idx % 2 === 1 ? <span key={idx} className="juhoansi-term">{part}</span> : part
      )}
    </p>
  ));
};

export default function StoryCard({ story }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(story.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {}
  };

  return (
    <article className="story-card">
      <header className="story-card__header">
        <h3 className="story-card__title">{story.title}</h3>
        <button className="icon-btn icon-btn--sm" onClick={handleCopy} title="Copy story" aria-label="Copy story">
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </header>
      <div className="story-card__body">{renderFormattedStory(story.text)}</div>
    </article>
  );
}
