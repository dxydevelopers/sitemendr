'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Package, 
  Tag, 
  Trash2, 
  Edit, 
  Check,
  Truck
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import DrillShell from '@/components/ui/DrillShell';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isActive: boolean;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
  id: string;
  quantity: number;
  price: number;
  product: Product;
  }>;
}

interface EcommerceManagerProps {
  subscriptionId?: string;
  isAdmin?: boolean;
}

export default function EcommerceManager({ subscriptionId, isAdmin = false }: EcommerceManagerProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  image: ''
  });

  useEffect(() => {
  fetchData();
  }, [subscriptionId]);

  const fetchData = async () => {
  setIsLoading(true);
  try {
  const [productsData, ordersData] = await Promise.all([
  apiClient.getAllProducts(subscriptionId),
  apiClient.getUserOrders(subscriptionId)
  ]);
  setProducts(productsData as Product[] || []);
  setOrders(ordersData as Order[] || []);
  } catch (error) {
  console.error('Failed to fetch ecommerce data:', error);
  } finally {
  setIsLoading(false);
  }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
  if (editingProduct) {
  await apiClient.updateProduct(editingProduct.id, {
  ...newProduct,
  price: parseFloat(newProduct.price),
  stock: parseInt(newProduct.stock)
  });
  } else {
  await apiClient.createProduct({
  ...newProduct,
  price: parseFloat(newProduct.price),
  stock: parseInt(newProduct.stock),
  subscriptionId
  });
  }
  setShowAddProduct(false);
  setEditingProduct(null);
  setNewProduct({ name: '', description: '', price: '', category: '', stock: '', image: '' });
  fetchData();
  } catch (error) {
  console.error('Failed to save product:', error);
  alert('Operation failed. Please check the store details and try again.');
  } finally {
  setIsSubmitting(false);
  }
  };

  const handleDeleteProduct = async (id: string) => {
  if (!confirm('Remove this product from the store record?')) return;
  try {
  await apiClient.deleteProduct(id);
  fetchData();
  } catch (error) {
  console.error('Failed to delete product:', error);
  }
  };

  const handleEditInitiate = (product: Product) => {
  setEditingProduct(product);
  setNewProduct({
  name: product.name,
  description: product.description,
  price: product.price.toString(),
  category: product.category,
  stock: product.stock.toString(),
  image: product.image
  });
  setShowAddProduct(true);
  };

  if (isLoading) {
  return (
  <div className="flex items-center justify-center h-64">
  <div className="w-8 h-8 border-2 border-ai-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
  );
  }

  return (
  <div className="space-y-6 lg:space-y-8 animate-fade-in">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
  <button
  onClick={() => setActiveTab('products')}
  className={`px-4 lg:px-6 py-2 rounded-lg font-semibold text-[9px] lg:text-[10px] transition-all ${
  activeTab === 'products' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
  }`}
  >
  Products
  </button>
  <button
  onClick={() => setActiveTab('orders')}
  className={`px-4 lg:px-6 py-2 rounded-lg font-semibold text-[9px] lg:text-[10px] transition-all ${
  activeTab === 'orders' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
  }`}
  >
  Orders
  </button>
  </div>
  {isAdmin && activeTab === 'products' && (
  <button
  onClick={() => {
  setEditingProduct(null);
  setNewProduct({ name: '', description: '', price: '', category: '', stock: '', image: '' });
  setShowAddProduct(true);
  }}
  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-expert-green text-dark-bg rounded-xl hover:scale-105 transition-all text-[10px] font-semibold "
  >
  <Plus className="w-4 h-4" />
  Add product
  </button>
  )}
  </div>

  {isAdmin && showAddProduct ? (
  <DrillShell
  title={editingProduct ? `Edit ${editingProduct.name}` : 'Add product'}
  icon={Package}
  backLabel="Products"
  onBack={() => { setShowAddProduct(false); setEditingProduct(null); }}
  >
  <form onSubmit={handleAddProduct} className="max-w-2xl space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
  <div className="space-y-6">
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Product name</label>
  <input
  type="text"
  required
  value={newProduct.name}
  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
  placeholder="e.g. Enterprise Core v2"
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Selling price ($)</label>
  <input
  type="number"
  required
  value={newProduct.price}
  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
  placeholder="0.00"
  />
  </div>
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Stock</label>
  <input
  type="number"
  required
  value={newProduct.stock}
  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
  placeholder="0"
  />
  </div>
  </div>
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Category</label>
  <input
  type="text"
  required
  value={newProduct.category}
  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
  placeholder="e.g. Service / Module"
  />
  </div>
  </div>
  <div className="space-y-6">
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Description</label>
  <textarea
  required
  value={newProduct.description}
  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all h-32 lg:h-[188px] resize-none text-sm font-medium leading-relaxed"
  placeholder="Describe what the buyer needs to understand..."
  />
  </div>
  <div className="space-y-2">
  <label className="text-[12px] font-medium text-white/50 ml-1">Product image URL (optional)</label>
  <input
  type="text"
  value={newProduct.image}
  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
  placeholder="https://..."
  />
  </div>
  </div>
  </div>
  <div className="flex flex-col sm:flex-row gap-3 mt-8">
  <button
  type="button"
  onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}
  className="order-2 sm:order-1 flex-1 px-6 py-3.5 border border-white/10 rounded-lg font-medium text-sm hover:bg-white/5 transition-all"
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={isSubmitting}
  className="order-1 sm:order-2 flex-[2] px-6 py-3.5 bg-ai-blue text-white rounded-lg font-medium text-sm hover:bg-white hover:text-black transition-all disabled:opacity-50"
  >
  {isSubmitting ? 'Saving...' : editingProduct ? 'Save updates' : 'Add product'}
  </button>
  </div>
  </form>
  </DrillShell>
  ) : activeTab === 'products' ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {products.map((product) => (
  <div key={product.id} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden group hover:border-ai-blue/30 transition-all flex flex-col">
  <div className="aspect-[16/10] bg-white/5 relative flex items-center justify-center overflow-hidden">
  {product.image ? (
  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
  ) : (
  <Package className="w-12 h-12 text-white/5" />
  )}
  <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-semibold text-ai-blue ">
  {product.category}
  </div>
  </div>
  <div className="p-6 lg:p-8 flex-1 flex flex-col">
  <div className="flex justify-between items-start mb-4">
  <h3 className="font-semibold text-white text-base lg:text-lg ">{product.name}</h3>
  <span className="text-ai-blue font-semibold text-lg">${product.price}</span>
  </div>
  <p className="text-white/40 text-[11px] lg:text-xs mb-8 line-clamp-3 leading-relaxed font-medium">{product.description}</p>
  <div className="mt-auto flex items-center justify-between gap-3">
  <div className="flex items-center gap-2 text-[9px] font-semibold text-white/40 ">
  <Tag className="w-3.5 h-3.5" />
  Stock: {product.stock}
  </div>
  {isAdmin && <div className="flex gap-2">
  <button 
  onClick={() => handleEditInitiate(product)}
  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-ai-blue/10 hover:border-ai-blue/30 text-white/60 hover:text-ai-blue transition-all"
  >
  <Edit className="w-4 h-4" />
  </button>
  <button 
  onClick={() => handleDeleteProduct(product.id)}
  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-white/60 hover:text-red-500 transition-all"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  </div>}
  </div>
  </div>
  </div>
  ))}
  {products.length === 0 && (
  <div className="col-span-full py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-lg">
  <ShoppingBag className="w-16 h-16 text-white/5 mx-auto mb-6" />
  <p className="text-white/20 font-semibold text-[10px] ">No products connected yet</p>
  </div>
  )}
  </div>
  ) : (
  <div className="space-y-4">
  {orders.map((order) => (
  <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-6 lg:p-8 hover:border-ai-blue/30 transition-all group">
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
  <div className="flex items-center gap-6">
  <div className="w-14 h-14 bg-ai-blue/10 border border-ai-blue/20 rounded-2xl flex items-center justify-center">
  <Truck className="w-7 h-7 text-ai-blue" />
  </div>
  <div>
  <div className="text-[10px] font-semibold text-white/40 mb-1">Order {order.id.slice(0, 12)}</div>
  <div className="text-xl font-semibold text-white">${order.totalAmount}</div>
  </div>
  </div>
  <div className="flex flex-wrap items-center gap-6 lg:gap-12">
  <div className="flex-1 lg:flex-none">
  <div className="text-[8px] font-semibold text-white/40 mb-1">Status</div>
  <div className={`flex items-center gap-2 text-[10px] font-semibold ${
  order.status.toLowerCase() === 'completed' ? 'text-expert-green' : 'text-orange-500'
  }`}>
  <Check className="w-3.5 h-3.5" />
  {order.status}
  </div>
  </div>
  <div className="flex-1 lg:flex-none">
  <div className="text-[8px] font-semibold text-white/40 mb-1">Date</div>
  <div className="text-white text-[10px] font-semibold ">{new Date(order.createdAt).toLocaleDateString()}</div>
  </div>
  <div className="w-full min-w-0 border-t border-white/5 pt-4 lg:w-56 lg:border-0 lg:pt-0">
  <p className="mb-2 text-[8px] font-semibold text-white/40">Items</p>
  <ul className="space-y-1">
  {order.items.map(item => (
  <li key={item.id} className="flex min-w-0 justify-between gap-3 text-[10px] text-white/65">
  <span className="min-w-0 truncate">{item.product?.name || 'Product'}</span>
  <span className="shrink-0">×{item.quantity}</span>
  </li>
  ))}
  </ul>
  </div>
  </div>
  </div>
  </div>
  ))}
  {orders.length === 0 && (
  <div className="py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-lg">
  <Truck className="w-16 h-16 text-white/5 mx-auto mb-6" />
  <p className="text-white/20 font-semibold text-[10px] ">No orders recorded yet</p>
  </div>
  )}
  </div>
  )}

  </div>
  );
}
