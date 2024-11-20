import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

const apiBaseUrl = `${import.meta.env.VITE_API_URL}/api`;

const initialItemState = {
  ingredientId: "",
  ingredientName: "",
  unit: "kg", // default unit
  quantity: 0,
  unitPrice: 0,
  totalCost: 0
};

const PurchasesComponent = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]); 
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [items, setItems] = useState([initialItemState]); 
  const [totalAmount, setTotalAmount] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]); // Set default to today
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState([]);

  const fetchIngredients = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/ingredients`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setIngredients(response.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      setError("Failed to fetch ingredients");
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          setError("Please login to view suppliers");
          return;
        }
        console.log('Fetching suppliers with token:', authToken);
        const response = await axios.get(`${apiBaseUrl}/suppliers`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Suppliers response:', response.data);
        setSuppliers(response.data);
        setSupplierOptions(
          response.data.map((supplier) => ({
            value: supplier._id,
            label: supplier.name,
          })),
        );
        setError(null);
      } catch (error) {
        console.error("Error fetching suppliers:", error.response || error);
        if (error.response?.status === 502) {
          setError("Server is starting up. Please try again in a few moments.");
        } else if (error.response?.status === 401) {
          setError("Please login again to continue.");
        } else {
          setError("Failed to fetch suppliers. " + (error.response?.data || error.message));
        }
      }
    };

    const loadPurchases = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await axios.get(`${apiBaseUrl}/purchases`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setPurchases(response.data);
      } catch (error) {
        console.error("Error loading purchases:", error);
        setError("Failed to load purchases");
      }
    };

    fetchSuppliers();
    fetchIngredients();
    loadPurchases(); // Load purchases on component mount
  }, []);

  const createIngredient = async (name) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiBaseUrl}/ingredients`,
        { name },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      await fetchIngredients(); // Refresh ingredients list
      return response.data;
    } catch (error) {
      console.error("Error creating ingredient:", error);
      throw error;
    }
  };

  const getOrCreateIngredient = async (item) => {
    const existingIngredient = ingredients.find(
      ing => ing.name.toLowerCase() === item.ingredientName.toLowerCase()
    );
    
    if (existingIngredient) {
      return existingIngredient;
    }

    // Create new ingredient if it doesn't exist
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiBaseUrl}/ingredients`,
        {
          name: item.ingredientName,
          unit: item.unit,
          costPerUnit: item.unitPrice,
          currentQuantity: 0, // Start with 0 quantity
          reorderPoint: 10,   // Default reorder point
          supplier: selectedSupplier.value // Link to current supplier
        },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      
      await fetchIngredients(); // Refresh ingredients list
      return response.data;
    } catch (error) {
      console.error("Error creating ingredient:", error);
      throw error;
    }
  };

  const handleAddPurchase = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedSupplier || items.length === 0 || !purchaseDate) {
      setError("Please fill all required fields.");
      setLoading(false);
      return;
    }

    try {
      // Validate items first
      const invalidItems = items.filter(item => 
        !item.ingredientName || !item.quantity || !item.unitPrice || !item.unit
      );

      if (invalidItems.length > 0) {
        setError("Please fill all item details (name, quantity, price, and unit)");
        setLoading(false);
        return;
      }

      // Process each item to ensure ingredients exist
      const processedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const ingredient = await getOrCreateIngredient(item);
            return {
              ingredientId: ingredient._id,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalCost: Number(item.quantity) * Number(item.unitPrice)
            };
          } catch (error) {
            console.error("Error processing item:", error);
            throw new Error(`Error with item ${item.ingredientName}: ${error.message}`);
          }
        })
      );

      const newPurchase = {
        supplierId: selectedSupplier.value,
        purchaseDate,
        items: processedItems,
        totalAmount: processedItems.reduce((sum, item) => sum + item.totalCost, 0)
      };

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError("Please login to add purchases");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${apiBaseUrl}/purchases`,
        newPurchase,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      // Reset form
      setItems([initialItemState]);
      setSelectedSupplier(null);
      setPurchaseDate(new Date().toISOString().split('T')[0]); // Reset to today
      setTotalAmount(0);
      setError("");
      
      // Update purchases list with new purchase
      setPurchases(prevPurchases => [...prevPurchases, response.data]);
      
      setLoading(false);

    } catch (error) {
      console.error("Error adding purchase:", error);
      setError(error.response?.data?.message || error.message || "Failed to add purchase");
      setLoading(false);
    }
  };

  const handleRemoveItem = (indexToRemove) => {
    const newItems = items.filter((_, index) => index !== indexToRemove);
    updateItems(newItems);
  };

  const updateItems = (newItems) => {
    setItems(newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setTotalAmount(newTotal);
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Create Purchase</h1>
      
      <form onSubmit={handleAddPurchase}>
        <div className="row g-3 mb-4">
          {/* Supplier Selection */}
          <div className="col-md-6">
            <label className="form-label">Supplier</label>
            <Select
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              options={supplierOptions}
              className="basic-select"
              classNamePrefix="select"
              placeholder="Select Supplier"
              isSearchable={true}
              required
            />
          </div>

          {/* Purchase Date */}
          <div className="col-md-6">
            <label htmlFor="purchaseDate" className="form-label">Purchase Date</label>
            <input
              id="purchaseDate"
              type="date"
              className="form-control"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Items</h5>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setItems([...items, initialItemState])}
            >
              Add Item
            </button>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '25%' }}>Ingredient</th>
                    <th style={{ width: '15%' }}>Unit</th>
                    <th style={{ width: '15%' }}>Quantity</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '15%' }}>Total</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="align-middle">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter ingredient"
                          value={item.ingredientName}
                          list="ingredients-list"
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].ingredientName = e.target.value;
                            const existingIngredient = ingredients.find(
                              ing => ing.name.toLowerCase() === e.target.value.toLowerCase()
                            );
                            if (existingIngredient) {
                              newItems[index].unit = existingIngredient.unit;
                              newItems[index].unitPrice = existingIngredient.costPerUnit;
                            }
                            updateItems(newItems);
                          }}
                          required
                        />
                        <datalist id="ingredients-list">
                          {ingredients.map((ing) => (
                            <option key={ing._id} value={ing.name} />
                          ))}
                        </datalist>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={item.unit}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].unit = e.target.value;
                            updateItems(newItems);
                          }}
                          required
                        >
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Gram (g)</option>
                          <option value="l">Liter (l)</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="pcs">Pieces (pcs)</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].quantity = parseFloat(e.target.value) || 0;
                            updateItems(newItems);
                          }}
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <div style={{ 
                          display: 'flex',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <div style={{ 
                            padding: '6px 8px',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'center',
                            borderRight: '1px solid #ced4da'
                          }}>₹</div>
                          <input
                            type="number"
                            style={{ 
                              textAlign: 'right',
                              border: 'none',
                              padding: '6px 12px',
                              width: '100%',
                              backgroundColor: '#fff',
                              outline: 'none'
                            }}
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                              updateItems(newItems);
                            }}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          display: 'flex',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <div style={{ 
                            padding: '6px 8px',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'center',
                            borderRight: '1px solid #ced4da'
                          }}>₹</div>
                          <input
                            type="text"
                            style={{ 
                              textAlign: 'right',
                              border: 'none',
                              padding: '6px 12px',
                              width: '100%',
                              backgroundColor: '#f8f9fa',
                              outline: 'none'
                            }}
                            value={(item.quantity * item.unitPrice).toFixed(2)}
                            readOnly
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveItem(index)}
                            style={{ width: '100%' }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            <div className="row align-items-center">
              <div className="col">
                <h5 className="mb-0">Total Amount</h5>
              </div>
              <div className="col-auto">
                <div style={{ 
                  display: 'flex',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ 
                    padding: '6px 8px',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'center',
                    borderRight: '1px solid #ced4da'
                  }}>₹</div>
                  <input
                    type="text"
                    style={{ 
                      textAlign: 'right',
                      border: 'none',
                      padding: '6px 12px',
                      width: '100%',
                      backgroundColor: '#f8f9fa',
                      outline: 'none',
                      minWidth: '120px'
                    }}
                    value={totalAmount.toFixed(2)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Purchase...
              </>
            ) : (
              'Create Purchase'
            )}
          </button>
        </div>
      </form>

      {/* Recent Purchases Table */}
      <div className="mt-4">
        <h2 className="mb-3">Recent Purchases</h2>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Items Count</th>
                <th className="text-end">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...purchases]
                .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
                .map((purchase, index) => (
                  <tr key={purchase._id || index}>
                    <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                    <td>{purchase.items.length}</td>
                    <td className="text-end">₹{purchase.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {purchases.length === 0 && (
          <div className="alert alert-info text-center">
            No purchases found
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesComponent;