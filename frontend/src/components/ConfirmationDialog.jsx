import React from "react";

const ConfirmationDialog = ({
  estimatedTokens,
  estimatedCost,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="confirmation-dialog">
      <div className="dialog-content">
        <h2>Confirm Analysis</h2>
        <p>
          The analysis requires {estimatedTokens} tokens and costs approximately{" "}
          {estimatedCost.toFixed(2)} €.
        </p>
        <div className="dialog-actions">
          <button
            onClick={onConfirm}
            className="confirm-button"
            disabled={false}
          >
            Confirm
          </button>
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
