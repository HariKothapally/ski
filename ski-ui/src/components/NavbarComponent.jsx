import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NavbarComponent = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand href="/">Ski Management System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                <NavDropdown title="Management" id="management-dropdown">
                  <NavDropdown.Item href="/menu">Menu</NavDropdown.Item>
                  <NavDropdown.Item href="/inventory">Inventory</NavDropdown.Item>
                  <NavDropdown.Item href="/recipes">Recipes</NavDropdown.Item>
                  <NavDropdown.Item href="/orders">Orders</NavDropdown.Item>
                  <NavDropdown.Item href="/customers">Customers</NavDropdown.Item>
                  <NavDropdown.Item href="/events">Events</NavDropdown.Item>
                  <NavDropdown.Item href="/quality">Quality</NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title="Finance" id="finance-dropdown">
                  <NavDropdown.Item href="/budget">Budget</NavDropdown.Item>
                  <NavDropdown.Item href="/revenue">Revenue</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link href="/analytics">Analytics</Nav.Link>
              </Nav>
              <Nav>
                <NavDropdown title={user.name || 'Profile'} id="profile-dropdown">
                  <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link href="/login">Login</Nav.Link>
              <Nav.Link href="/register">Register</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
