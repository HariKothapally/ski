import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import PropTypes from 'prop-types';

const ManagementLayout = ({ title, subtitle, children, actionButtons }) => {
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">{title}</h1>
              {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
            </div>
            {actionButtons && (
              <div className="d-flex gap-2">
                {actionButtons}
              </div>
            )}
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              {children}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

ManagementLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  actionButtons: PropTypes.node
};

export default ManagementLayout;
