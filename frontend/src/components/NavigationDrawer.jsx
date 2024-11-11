import React from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';

const NavigationDrawer = ({ drawerOpen, setDrawerOpen, allConversations, currentConversationId, handleConversationClick, handleDeleteConversation }) => {
  return (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <List sx={{ width: 300 }}>
        {allConversations.map((conv) => (
          <React.Fragment key={conv.id}>
            <ListItem
              onClick={() => handleConversationClick(conv)}
              selected={currentConversationId === conv.id}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conv.id);
                }}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <>
                    <span>Task: {conv.task.substring(0, 50)}...</span>
                    {conv.followUps.length > 0 && (
                      <span style={{ display: 'block' }}>
                        {conv.followUps.length} follow-up questions
                      </span>
                    )}
                  </>
                }
                secondary={new Date(conv.timestamp).toLocaleString()}
              />
            </ListItem>
            {conv.followUps.map((followUp, index) => (
              <ListItem key={index} sx={{ pl: 4 }}>
                <ListItemText
                  secondary={
                    <Box component="div">
                      Q: {followUp.question.substring(0, 30)}...
                    </Box>
                  }
                />
              </ListItem>
            ))}
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;