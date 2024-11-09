import React from 'react';

const LoadingSpinner = ({ message }) => (
    <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
    </div>
);

export default LoadingSpinner;