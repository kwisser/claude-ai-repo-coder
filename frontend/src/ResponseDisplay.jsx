import React from 'react';
import CodeBlock from './CodeBlock';

const ResponseDisplay = ({ content }) => {
  if (!content) return null;

  // Split content by code blocks (marked by ```)
  const blocks = content.split('```');

  return (
    <div className="response-container">
      {blocks.map((block, index) => {
        if (index % 2 === 0) {
          // Text block - Split by newlines and render paragraphs
          return block.split('\n').map((line, i) => (
            line.trim() && <p key={`${index}-${i}`}>{line}</p>
          ));
        } else {
          // Code block - First line is language, rest is code
          const [language, ...codeLines] = block.split('\n');
          return (
            <CodeBlock
              key={`code-${index}`}
              language={language.trim()}
              code={codeLines.join('\n').trim()}
            />
          );
        }
      })}
    </div>
  );
};

export default ResponseDisplay;