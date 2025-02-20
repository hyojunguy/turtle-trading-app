import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">
          터틀 트레이딩
        </Button>
        <Button color="inherit" component={Link} to="/journal">
          트레이딩 일지
        </Button>
        <Button color="inherit" component={Link} to="/profit">
          수익률 일지
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 