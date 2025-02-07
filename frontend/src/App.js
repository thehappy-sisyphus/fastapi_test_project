import React, { useState, useEffect } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/solid';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "" });
  const [editingItem, setEditingItem] = useState(null);


  // Fetch items from FastAPI
  useEffect(() => {
    fetch(`${API_URL}/items/`)
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (editingItem) {
      // Update existing item
      fetch(`${API_URL}/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })
        .then((response) => response.json())
        .then((updatedItem) => {
          setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
          setNewItem({ name: "", price: "", description: "" });
          setEditingItem(null);
        })
        .catch((error) => console.error("Error updating item:", error));
    } else {
      // Add new item
      fetch(`${API_URL}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })
        .then((response) => response.json())
        .then((data) => {
          setItems([...items, data]); // Add new item to the UI
          setNewItem({ name: "", price: "", description: "" });
        })
        .catch((error) => console.error("Error adding item:", error));
    }
  };
  


  // Handle Edit Button Click
const handleEdit = (item) => {
  setNewItem({ name: item.name, price: item.price, description: item.description });
  setEditingItem(item);
};

// Handle Delete Button Click
const handleDelete = (itemId) => {
  fetch(`${API_URL}/items/${itemId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then(() => {
      setItems(items.filter((item) => item.id !== itemId)); // Remove item from UI
    })
    .catch((error) => console.error("Error deleting item:", error));
};


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Items from FastAPI</h1>
  
      {/* Form to Add New Items */}
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-xl mx-auto mt-10 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-center">Add New Item</h2>
        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent accidental double submit
              handleSubmit(e); // Manually triggersubmit
              }
            }} 
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Item Name"
              value={newItem.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={newItem.price}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus-ring-blue-400"
            />
          </div>
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={newItem.description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
          />
          {/* Submit Button */}
          <div className="flex justify-center">
            <button type="submit" className="p-3 bg-green-500 text-white rounded hover:bg-green-600 transition">
              <PlusIcon className="h-6 w-6" />
            </button>
          </div>
        </form>
      </div>
  
      {/* Table for Displaying Items */}
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-center mb-4">Item List</h2>
        <table className="w-full border border-gray-300 shadow-sm rounded-lg">
        <thead className="bg-gray-100 text-black-700 font-semibold">
            <tr className="bg-gray-200 text-left">
              <th className="p-3">id</th>
              <th className="p-3">Item Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Description</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
<tbody className="divide-y divide-gray-200">
  {items.length > 0 ? (
    items.map((item) => (
      <tr key={item.id} className="border-t hover:bg-gray-100 transition">
        <td className="px-6 py-2">{item.id}</td>
        <td className="px-6 py-2 font-semibold">{item.name}</td>
        <td className="px-6 py-2 text-green-600">${item.price}</td>
        <td className="px-6 py-2">{item.description}</td>
        <td className="px-6 py-2 flex space-x-2">
          
          {/* Edit Button */}
          <button 
            onClick={() => { 
              handleEdit(item);
            }}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            <PencilIcon className="h-5 w-5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => { 
              console.log("Delete button clicked for item:", item.id);
              handleDelete(item.id)
            }}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
            <TrashIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="4" className="text-center text-gray-500 p-4">No items found.</td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
  
}

export default App;
