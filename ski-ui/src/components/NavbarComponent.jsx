import React from 'react';
import { Navbar, Container } from 'react-bootstrap';

const NavbarComponent = () => {
  return (
    <Navbar bg="light" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand href="/">SKI Management System</Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
