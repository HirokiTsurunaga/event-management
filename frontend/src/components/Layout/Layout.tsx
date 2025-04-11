import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, Container } from '@mui/material';
import AppBar from './AppBar';
import Drawer from './Drawer';

interface LayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar onMenuToggle={handleDrawerToggle} />
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        drawerWidth={drawerWidth} 
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* AppBarの高さ分のスペース */}
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 