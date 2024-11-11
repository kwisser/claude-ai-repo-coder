import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from '../CopyButton';

const CodeBlock = ({ language, code }) => {
  return (
    <div className="code-block-container">
      <div className="code-header">
        <span className="language-label">{language}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;