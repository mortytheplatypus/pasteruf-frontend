import { useState } from 'react';
import './Copy.css';

export default function Copy( {copyText = null} ) {

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        navigator.clipboard.writeText(copyText ?? window.location.href);
    }

    return (
        <div>
            <button type="button" title="Copy" onClick={handleCopy} className="copy-btn">
                {copied ? <span className="copy-toast">Copied!</span> 
                : 
                <img 
                    src="/assets/copy.png" 
                    alt="Copy" 
                    width="20" 
                    height="20"
                /> }
            </button>
        </div>
    );
}