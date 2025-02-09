import React, { useState, useEffect } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/solid';
import Login from "./Login";
import Register from "./Register";
import { BrowserRouter, Route, Routes, Link, Navigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Moved Home component outside of App
function Home({ items, newItem, handleChange, handleSubmit, handleEdit, handleDelete, editingItem }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Items from FastAPI</h1>

      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-xl mx-auto mt-10 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {editingItem ? "Edit Item" : "Add New Item"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Item Name" value={newItem.name} onChange={handleChange} required className="w-full p-3 border rounded-md" />
          <input type="number" name="price" placeholder="Price" value={newItem.price} onChange={handleChange} required className="w-full p-3 border rounded-md" />
          <input type="text" name="description" placeholder="Description" value={newItem.description} onChange={handleChange} className="w-full p-3 border rounded-md" />
          <button type="submit" className="p-3 bg-green-500 text-white rounded hover:bg-green-600">
            {editingItem ? <PencilIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
          </button>
        </form>
      </div>

      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-center mb-4">Item List</h2>
        <table className="w-full border rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th>ID</th><th>Name</th><th>Price</th><th>Description</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>${item.price}</td>
                <td>{item.description}</td>
                <td>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "" });
  const [editingItem, setEditingItem] = useState(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setItems([]);
  };

  // Consolidated useEffect for fetching items
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");
      fetch(`${API_URL}/items/`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch items");
          return response.json();
        })
        .then((data) => setItems(data))
        .catch((error) => console.error("Error fetching items:", error));
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `${API_URL}/items/${editingItem.id}` : `${API_URL}/items/`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingItem) {
          setItems(items.map((item) => (item.id === data.id ? data : item)));
        } else {
          setItems([...items, data]);
        }
        setNewItem({ name: "", price: "", description: "" });
        setEditingItem(null);
      } else {
        throw new Error("Failed to submit item");
      }
    } catch (error) {
      console.error("Error submitting item:", error);
    }
  };

  const handleEdit = (item) => {
    setNewItem({ name: item.name, price: item.price, description: item.description });
    setEditingItem(item);
  };

  const handleDelete = async (itemId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setItems(items.filter((item) => item.id !== itemId));
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <BrowserRouter>
      <div>
        <nav className="p-4 bg-gray-800 text-white">
          <Link to="/" className="mr-4">Home</Link>
          {!isAuthenticated && <Link to="/login" className="mr-4">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && (
            <button 
              onClick={handleLogout} 
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </nav>

        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleLogin} />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Home
                  items={items}
                  newItem={newItem}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  editingItem={editingItem}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;