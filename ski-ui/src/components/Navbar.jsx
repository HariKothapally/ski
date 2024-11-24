import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaUtensils } from 'react-icons/fa';

const NavbarComponent = () => {
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { role, username } = userInfo;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const renderNavLinks = () => {
    if (!authToken) return null;

    const links = [];

    // Common Management Dropdown for all authenticated users
    links.push(
      <NavDropdown title="Management" id="management-dropdown" key="management">
        <NavDropdown.Item as={Link} to="/meal-tracker">
          Meal Tracking
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/expenditure">
          Expenditure
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/stock">
          Stock Movement
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/receipts">
          Receipts
        </NavDropdown.Item>
      </NavDropdown>
    );

    // Resources Dropdown
    links.push(
      <NavDropdown title="Resources" id="resources-dropdown" key="resources">
        <NavDropdown.Item as={Link} to="/images">
          Image Gallery
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/recipes">
          Recipes
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/menu">
          Menu
        </NavDropdown.Item>
      </NavDropdown>
    );

    // Admin-specific links
    if (role === 'ADMIN') {
      links.push(
        <NavDropdown title="Administration" id="admin-dropdown" key="admin">
          <NavDropdown.Item as={Link} to="/admin">
            Admin Panel
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/hr">
            HR Management
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/settings">
            System Settings
          </NavDropdown.Item>
        </NavDropdown>
      );
    }

    // Manager-specific links
    if (role === 'MANAGER' || role === 'ADMIN') {
      links.push(
        <NavDropdown title="Reports" id="reports-dropdown" key="reports">
          <NavDropdown.Item as={Link} to="/reports/revenue">
            Revenue Reports
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/reports/inventory">
            Inventory Reports
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/reports/analytics">
            Analytics Dashboard
          </NavDropdown.Item>
        </NavDropdown>
      );
    }

    return links;
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top shadow-sm">
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaUtensils className="me-2" />
          SKI Kitchen
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbarContent" />

        <Navbar.Collapse id="navbarContent">
          <Nav className="me-auto mb-2 mb-lg-0">
            {renderNavLinks()}
          </Nav>
          
          {authToken && (
            <div className="d-flex align-items-center">
              <span className="text-light me-3 d-none d-sm-inline">
                <FaUser className="me-2" />
                {username}
              </span>
              <Button 
                variant="outline-light"
                size="sm"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>
            </div>
          )}
          {!authToken && (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
