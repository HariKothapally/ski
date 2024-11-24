import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import { createApiService } from '../../utils/api';
import { FaBox, FaChartLine, FaBell, FaTruck, FaSync } from 'react-icons/fa';

const stockMovementApi = createApiService('stockmovements');

const StockAnalytics = () => {
  const [visualData, setVisualData] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [supplierOrders, setSupplierOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visualResponse, monitoringResponse] = await Promise.all([
        stockMovementApi.get('/analytics/enhanced-visualizations'),
        stockMovementApi.get('/analytics/monitoring')
      ]);
      setVisualData(visualResponse.data);
      setMonitoringData(monitoringResponse.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
    setLoading(false);
  };

  const generateOrders = async () => {
    try {
      const response = await stockMovementApi.get('/orders/generate');
      setSupplierOrders(response.data);
    } catch (error) {
      console.error('Error generating orders:', error);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="p-4">
      {/* Header with Refresh Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Stock Analytics Dashboard</h4>
        <Button variant="outline-primary" onClick={fetchData}>
          <FaSync className="me-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Today's Movements</h6>
                  <h3>{monitoringData?.metrics?.today?.total || 0}</h3>
                </div>
                <FaBox className="text-primary" size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Active Alerts</h6>
                  <h3>{monitoringData?.metrics?.alerts?.total || 0}</h3>
                </div>
                <FaBell className="text-warning" size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* Add more summary cards */}
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Stock Value Trend</Card.Header>
            <Card.Body>
              {visualData?.valueData && (
                <Line
                  data={visualData.valueData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Movement Types Distribution</Card.Header>
            <Card.Body>
              {visualData?.movementData && (
                <Bar
                  data={visualData.movementData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alerts and Orders */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Active Alerts</span>
              <div>
                <Badge bg="danger" className="me-2">
                  High: {monitoringData?.metrics?.alerts?.high || 0}
                </Badge>
                <Badge bg="warning" className="me-2">
                  Medium: {monitoringData?.metrics?.alerts?.medium || 0}
                </Badge>
                <Badge bg="info">
                  Low: {monitoringData?.metrics?.alerts?.low || 0}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringData?.alerts?.map((alert, index) => (
                    <tr key={index}>
                      <td>{alert.type}</td>
                      <td>{alert.message}</td>
                      <td>
                        <Badge bg={
                          alert.priority === 'HIGH' ? 'danger' :
                          alert.priority === 'MEDIUM' ? 'warning' : 'info'
                        }>
                          {alert.priority}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Supplier Orders</span>
              <Button variant="primary" onClick={generateOrders}>
                <FaTruck className="me-2" />
                Generate Orders
              </Button>
            </Card.Header>
            <Card.Body>
              {supplierOrders ? (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Items</th>
                      <th>Total Value</th>
                      <th>Expected Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(supplierOrders).map(([supplierId, order]) => (
                      <tr key={supplierId}>
                        <td>{order.supplierName}</td>
                        <td>{order.items.length} items</td>
                        <td>${order.totalValue.toFixed(2)}</td>
                        <td>{new Date(Date.now() + order.expectedDeliveryTime * 3600000).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  Click 'Generate Orders' to create new supplier orders
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StockAnalytics;
