import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Form,
  Button,
  Table,
  Row,
  Col,
  Alert,
  Badge,
  ListGroup
} from 'react-bootstrap';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchRecipes();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recipes');
      setRecipes(response.data);
    } catch (err) {
      setError('Failed to fetch recipes');
    }
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { recipeId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    newItems[index][field] = value;
    setSelectedItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        customerName,
        orderDate,
        deliveryDate,
        items: selectedItems,
        status: 'PENDING'
      };

      await axios.post('http://localhost:5000/api/orders', orderData);
      setSuccess('Order created successfully');
      fetchOrders();
      
      // Reset form
      setCustomerName('');
      setOrderDate('');
      setDeliveryDate('');
      setSelectedItems([]);
    } catch (err) {
      setError('Failed to create order');
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (err) {
      setError('Failed to delete order');
    }
  };

  return (
    <Container className="mt-4">
      <h2>Recipe Order Management</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit} className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Order Date</Form.Label>
              <Form.Control
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Delivery Date</Form.Label>
              <Form.Control
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <h4>Order Items</h4>
        {selectedItems.map((item, index) => (
          <Row key={index} className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Recipe</Form.Label>
                <Form.Select
                  value={item.recipeId}
                  onChange={(e) => handleItemChange(index, 'recipeId', e.target.value)}
                  required
                >
                  <option value="">Select Recipe</option>
                  {recipes.map((recipe) => (
                    <option key={recipe._id} value={recipe._id}>
                      {recipe.name} (Est. Cost: ${recipe.estimatedCost})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="danger"
                onClick={() => handleRemoveItem(index)}
                className="mb-3"
              >
                Remove
              </Button>
            </Col>
          </Row>
        ))}

        <Button variant="secondary" onClick={handleAddItem} className="mb-3">
          Add Recipe
        </Button>

        <div>
          <Button type="submit" variant="primary">
            Create Order
          </Button>
        </div>
      </Form>

      <h3>Orders</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order Date</th>
            <th>Delivery Date</th>
            <th>Items</th>
            <th>Total Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.customerName}</td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
              <td>{new Date(order.deliveryDate).toLocaleDateString()}</td>
              <td>
                <ListGroup variant="flush">
                  {order.currentEstimates.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <div className="fw-bold">{item.name} x {item.quantity}</div>
                      <div className="text-muted">Cost: ${item.totalCost}</div>
                      <small>
                        <div>Ingredients needed:</div>
                        <ul className="mb-0">
                          {item.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              {ing.name}: {ing.required} units
                            </li>
                          ))}
                        </ul>
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </td>
              <td>${order.totalCost}</td>
              <td>
                <Badge bg={
                  order.status === 'COMPLETED' ? 'success' :
                  order.status === 'PENDING' ? 'warning' :
                  'info'
                }>
                  {order.status}
                </Badge>
              </td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(order._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default OrderManagement;
