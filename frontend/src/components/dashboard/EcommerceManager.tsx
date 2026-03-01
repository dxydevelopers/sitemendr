'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Package, 
  Tag, 
  Trash2, 
  Edit, 
  CheckCircle,
  Truck
} from 'lucide-react';
import { apiClient } from '@/lib/api';

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
}

export default function EcommerceManager({ subscriptionId }: EcommerceManagerProps) {
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
      alert('Operation failed. Please verify neural link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Permanently decommission this asset?')) return;
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
            className={`px-4 lg:px-6 py-2 rounded-lg font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'products' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
            }`}
          >
            ASSETS
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 lg:px-6 py-2 rounded-lg font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'orders' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
            }`}
          >
            TRANSACTIONS
          </button>
        </div>
        {activeTab === 'products' && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setNewProduct({ name: '', description: '', price: '', category: '', stock: '', image: '' });
              setShowAddProduct(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-expert-green text-dark-bg rounded-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Provision Asset
          </button>
        )}
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden group hover:border-ai-blue/30 transition-all flex flex-col">
              <div className="aspect-[16/10] bg-white/5 relative flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <Package className="w-12 h-12 text-white/5" />
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black text-ai-blue uppercase tracking-widest">
                  {product.category}
                </div>
              </div>
              <div className="p-6 lg:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-white text-base lg:text-lg uppercase tracking-tight">{product.name}</h3>
                  <span className="text-ai-blue font-black text-lg">${product.price}</span>
                </div>
                <p className="text-white/40 text-[11px] lg:text-xs mb-8 line-clamp-3 uppercase leading-relaxed font-medium">{product.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                    <Tag className="w-3.5 h-3.5" />
                    Stock: {product.stock}
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-[40px]">
              <ShoppingBag className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">No products yet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8 hover:border-ai-blue/30 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-ai-blue/10 border border-ai-blue/20 rounded-2xl flex items-center justify-center">
                    <Truck className="w-7 h-7 text-ai-blue" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">TX-{order.id.slice(0, 12)}</div>
                    <div className="text-xl font-black text-white">${order.totalAmount}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 lg:gap-12">
                  <div className="flex-1 lg:flex-none">
                    <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Status</div>
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${
                      order.status.toLowerCase() === 'completed' ? 'text-expert-green' : 'text-orange-500'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {order.status}
                    </div>
                  </div>
                  <div className="flex-1 lg:flex-none">
                    <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Date</div>
                    <div className="text-white text-[10px] font-black uppercase">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button className="w-full lg:w-auto px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Detail_Log
                  </button>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-[40px]">
              <Truck className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">No transactions recorded in neural ledger</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-2xl">
          <div className="absolute inset-0" onClick={() => setShowAddProduct(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-[40px] w-full max-w-2xl p-8 lg:p-12 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-black mb-8 lg:mb-10 tracking-tighter uppercase">
              {editingProduct ? 'Update' : 'Provision'} <span className="text-ai-blue italic">Product</span>
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Enterprise Core v2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Unit Value ($)</label>
                      <input
                        type="number"
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Ledger Qty</label>
                      <input
                        type="number"
                        required
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Operational Tier</label>
                    <input
                      type="text"
                      required
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Service / Module"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all h-32 lg:h-[188px] resize-none text-sm font-medium leading-relaxed"
                      placeholder="Detail the technical capabilities of this asset..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Visual Manifest URL (Optional)</label>
                    <input
                      type="text"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="order-2 sm:order-1 flex-1 px-8 py-5 border border-white/10 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="order-1 sm:order-2 flex-[2] px-8 py-5 bg-ai-blue text-white rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,102,255,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : editingProduct ? 'Commit Updates' : 'Authorize Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
