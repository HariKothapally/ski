import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

const ForgotPassword = () => {
  const { loading, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 text-center">
                <h2 className="mb-4">Check Your Email</h2>
                <p className="mb-4">
                  We've sent password reset instructions to your email address.
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <div className="d-grid gap-2">
                  <Link to="/login" className="btn btn-primary">
                    Return to Login
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Reset Password</h2>
              <p className="text-center mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="mb-3"
                  >
                    {loading ? (
                      <span className="d-flex align-items-center justify-content-center">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Sending...
                      </span>
                    ) : (
                      <span className="d-flex align-items-center justify-content-center">
                        <FaPaperPlane className="me-2" />
                        Send Reset Instructions
                      </span>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
