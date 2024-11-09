// src/ConfirmationDialog.js
import React from 'react';


function ConfirmationDialog({ estimatedTokens, estimatedCost, onConfirm, onCancel }) {
    return (
      <div className="confirmation-dialog">
        <div className="dialog-content">
          <h2>Analyse bestätigen</h2>
          <p>Die Analyse benötigt {estimatedTokens} Token und kostet etwa {estimatedCost.toFixed(2)} €.</p>
          <div className="dialog-actions">
            <button onClick={onConfirm} className="confirm-button" disabled={false}>Bestätigen</button>
            <button onClick={onCancel} className="cancel-button">Abbrechen</button>
          </div>
        </div>
      </div>
    );
  }
export default ConfirmationDialog;