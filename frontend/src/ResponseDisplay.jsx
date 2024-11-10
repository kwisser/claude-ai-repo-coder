import React from "react";
import { Typography, Paper, Box } from "@mui/material";
import CodeBlock from "./CodeBlock";

function ResponseDisplay({ content }) {
  if (!content) return null;

  const renderContent = () => {
    let inCodeBlock = false;
    let codeContent = "";
    const elements = [];

    content.split("\n").forEach((line, index) => {
      // Start of code block
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeContent = "";
        } else {
          // End of code block
          elements.push(
            <CodeBlock
              key={`code-${index}`}
              code={codeContent.trim()}
              language={line.slice(3).trim()}
            />
          );
          inCodeBlock = false;
        }
        return;
      }

      // Inside code block
      if (inCodeBlock) {
        codeContent += line + "\n";
        return;
      }

      // Regular text
      if (line.trim()) {
        elements.push(
          <Typography
            key={`text-${index}`}
            variant="body1"
            component="div"
            sx={{
              mb: 1,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {line}
          </Typography>
        );
      } else {
        // Empty line
        elements.push(<Box key={`space-${index}`} sx={{ height: "1rem" }} />);
      }
    });

    return elements;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mt: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "background.paper" : "#fff",
        "& pre": {
          margin: 0,
          padding: 2,
          borderRadius: 1,
          overflow: "auto",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
        },
      }}
    >
      <Box sx={{ "& > :last-child": { mb: 0 } }}>{renderContent()}</Box>
    </Paper>
  );
}

export default ResponseDisplay;
