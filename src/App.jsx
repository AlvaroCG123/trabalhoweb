import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Star, MessageSquare, List, Home, Menu, X } from "lucide-react";
import "./App.css";

// --- URL da API Fake (Json Server) ---
const API_URL = "http://localhost:3001/produtos";

// --- Funções de Acesso à API ---
const getProducts = async () => {
  const res = await fetch(API_URL);
  return await res.json();
};

const addProduct = async (newProductData) => {
  const productToAdd = {
    ...newProductData,
    dataCadastro: new Date().toISOString().split('T')[0],
    comentarios: [],
    estrelas: 0
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productToAdd)
  });
  return await res.json();
};

const updateProduct = async (productId, updatedData) => {
  const res = await fetch(`${API_URL}/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  });
  return await res.json();
};

// --- Funções de Utilitário ---
const calculateAverageRating = (comentarios) => {
  if (!comentarios || comentarios.length === 0) return 0;
  const total = comentarios.reduce((sum, c) => sum + c.nota, 0);
  return (total / comentarios.length).toFixed(1);
};

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="star-rating">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={16} fill="currentColor" className="star-full" />
      ))}
      {hasHalf && <Star key="half" size={16} fill="currentColor" className="star-half" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={16} fill="none" className="star-empty" />
      ))}
      <span className="rating-text">{rating}</span>
    </div>
  );
};

// --- Navbar ---
const Navbar = ({ onNavigate, currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navItemClass = (view) => `nav-item ${currentView === view ? 'nav-item-active' : ''}`;

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-logo-group">
          <Home className="navbar-icon" size={28} />
          <span className="navbar-logo-text">K-CONVENIENCE</span>
        </div>

        <div className="navbar-desktop-menu">
          <button onClick={() => onNavigate('list')} className={navItemClass('list')}>
            <List className="nav-icon-link" size={20} /> Lista de Produtos
          </button>
          <button onClick={() => onNavigate('add')} className={navItemClass('add')}>
            <Plus className="nav-icon-link" size={20} /> Adicionar Produto
          </button>
        </div>

        <div className="navbar-mobile-button">
          <button onClick={() => setIsOpen(!isOpen)} className="menu-button">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="navbar-mobile-menu">
          <button onClick={() => { onNavigate('list'); setIsOpen(false); }}
            className={`nav-item-mobile ${navItemClass('list')}`}>
            <List className="nav-icon-link" size={20} /> Lista de Produtos
          </button>
          <button onClick={() => { onNavigate('add'); setIsOpen(false); }}
            className={`nav-item-mobile ${navItemClass('add')}`}>
            <Plus className="nav-icon-link" size={20} /> Adicionar Produto
          </button>
        </div>
      )}
    </nav>
  );
};

// --- Formulário para Adicionar Produto ---
const AddProductForm = ({ onAddProduct, onNavigate }) => {
  const [formData, setFormData] = useState({
    nome: '', marca: '', preco: '', foto: '', descricao: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newProduct = { ...formData, preco: parseFloat(formData.preco) };
      await onAddProduct(newProduct);
      alert("Produto adicionado com sucesso!");
      onNavigate('list');
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("Erro ao adicionar produto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title"><Plus className="icon-main-color" /> Novo Produto</h2>
      <form onSubmit={handleSubmit} className="form-group-space">
        <input name="nome" placeholder="Nome do Produto" value={formData.nome} onChange={handleChange} required className="form-input" />
        <input name="marca" placeholder="Marca" value={formData.marca} onChange={handleChange} required className="form-input" />
        <input name="preco" type="number" placeholder="Preço" value={formData.preco} onChange={handleChange} required min="0.01" step="0.01" className="form-input" />
        <input name="foto" type="url" placeholder="URL da Foto" value={formData.foto} onChange={handleChange} required className="form-input" />
        <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange} required rows="3" className="form-input form-textarea" />
        <div className="form-actions">
          <button type="button" onClick={() => onNavigate('list')} className="button button-secondary" disabled={isLoading}>
            <Home className="icon-left" size={20} /> Voltar
          </button>
          <button type="submit" className="button button-primary" disabled={isLoading}>
            {isLoading ? 'Salvando...' : (<><Plus className="icon-left" size={20} /> Salvar Produto</>)}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Formulário de Comentário ---
const CommentForm = ({ product, onUpdateProduct }) => {
  const [texto, setTexto] = useState('');
  const [nota, setNota] = useState(5);
  const [usuario, setUsuario] = useState('Anônimo');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const newComment = {
      id: Date.now(),
      usuario,
      texto,
      nota: parseInt(nota),
      data: new Date().toISOString().split('T')[0]
    };

    try {
      const updatedComments = [...product.comentarios, newComment];
      const updatedProduct = await updateProduct(product.id, {
        comentarios: updatedComments,
        estrelas: calculateAverageRating(updatedComments)
      });
      onUpdateProduct(updatedProduct);
      setTexto('');
      setNota(5);
      alert("Comentário e nota salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form-box">
      <h3 className="comment-form-title">
        <MessageSquare className="icon-comment-color" size={20} /> Deixe Seu Comentário
      </h3>
      <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Seu nome" required className="form-input comment-input" />
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva seu comentário..." required rows="3" className="form-input form-textarea comment-input" />
      <div className="comment-rating-group">
        <label className="comment-rating-label">Nota:</label>
        <select value={nota} onChange={(e) => setNota(e.target.value)} className="comment-rating-select">
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Estrelas</option>)}
        </select>
      </div>
      <button type="submit" disabled={isLoading} className="button button-comment">
        {isLoading ? 'Enviando...' : 'Comentar e Avaliar'}
      </button>
    </form>
  );
};

// --- Detalhes do Produto ---
const ProductDetail = ({ product, onNavigate, onUpdateProduct }) => {
  if (!product) return <div className="detail-not-found">Produto não encontrado.</div>;

  return (
    <div className="detail-container">
      <button onClick={() => onNavigate('list')} className="button-back-list">
        <List className="icon-left" size={18} /> Voltar à Lista
      </button>

      <div className="detail-header">
        <div className="detail-image-wrapper">
          <img src={product.foto} alt={product.nome} className="detail-image"
            onError={(e) => e.target.src = 'https://placehold.co/150x150/AAAAAA/FFFFFF?text=Sem+Foto'} />
        </div>
        <div className="detail-info">
          <h1 className="detail-title">{product.nome}</h1>
          <p className="detail-subtitle">Marca: <span className="detail-subtitle-brand">{product.marca}</span></p>
          <p className="detail-price">R$ {product.preco.toFixed(2)}</p>
          <p className="detail-description">{product.descricao}</p>
          <div className="detail-rating-group">
            <StarRating rating={product.estrelas} />
            <span className="detail-rating-count">({product.comentarios.length} avaliações)</span>
          </div>
          <p className="detail-date">Cadastrado em: {product.dataCadastro}</p>
        </div>
      </div>

      <CommentForm product={product} onUpdateProduct={onUpdateProduct} />

      <div className="comment-list-section">
        <h2 className="comment-list-title">Comentários dos Clientes</h2>
        {product.comentarios.length === 0 ? (
          <p className="comment-list-empty">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          <div className="comment-list-wrapper">
            {product.comentarios.slice().reverse().map((c) => (
              <div key={c.id} className="comment-card">
                <div className="comment-card-header">
                  <p className="comment-card-user">{c.usuario}</p>
                  <div className="comment-card-rating">
                    <Star size={14} fill="currentColor" /><span className="comment-card-note">{c.nota}.0</span>
                  </div>
                </div>
                <p className="comment-card-text">{c.texto}</p>
                <p className="comment-card-date">Em: {c.data}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Lista de Produtos ---
const ProductList = ({ products, onNavigate, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        product.nome.toLowerCase().includes(term) ||
        product.descricao.toLowerCase().includes(term) ||
        product.marca.toLowerCase().includes(term);
      const matchesRating = ratingFilter === 0 || Math.floor(product.estrelas) === ratingFilter;
      return matchesSearch && matchesRating;
    });
  }, [products, searchTerm, ratingFilter]);

  return (
    <div className="list-page-container">
      <h1 className="list-page-title">
        <List className="icon-title-color" size={32} /> Catálogo de Produtos Coreanos
      </h1>

      <div className="list-filter-bar">
        <div className="search-group">
          <div className="search-input-wrapper">
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            <Search className="search-icon" size={20} />
          </div>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(parseInt(e.target.value))} className="filter-select">
            <option value={0}>Todas as Estrelas</option>
            <option value={5}>5 Estrelas</option>
            <option value={4}>4 Estrelas</option>
            <option value={3}>3 Estrelas</option>
            <option value={2}>2 Estrelas</option>
            <option value={1}>1 Estrela</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="list-empty-message">
          <p className="list-empty-title">Nenhum item encontrado.</p>
          <p className="list-empty-text">Tente ajustar sua pesquisa.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.foto} alt={product.nome} className="product-image"
                onError={(e) => e.target.src = 'https://placehold.co/300x192/AAAAAA/FFFFFF?text=Sem+Foto'} />
              <div className="product-info-box">
                <h2 className="product-name">{product.nome}</h2>
                <p className="product-brand">{product.marca}</p>
                <div className="product-rating-price">
                  <StarRating rating={product.estrelas} />
                  <span className="product-price">R$ {product.preco.toFixed(2)}</span>
                </div>
                <button onClick={() => onSelectProduct(product)} className="button button-details">
                  <MessageSquare className="icon-left" size={18} /> Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Componente Principal ---
export default function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('list');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await getProducts();
        setProducts(data.map(p => ({
          ...p,
          estrelas: calculateAverageRating(p.comentarios)
        })));
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddProduct = async (newProduct) => {
    const addedProduct = await addProduct(newProduct);
    setProducts(prev => [...prev, addedProduct]);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updatedWithRating = { ...updatedProduct, estrelas: calculateAverageRating(updatedProduct.comentarios) };
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedWithRating : p));
    setSelectedProduct(updatedWithRating);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando produtos...</p>
        </div>
      );
    }

    switch (view) {
      case 'list':
        return <ProductList products={products} onNavigate={setView} onSelectProduct={handleSelectProduct} />;
      case 'add':
        return <AddProductForm onAddProduct={handleAddProduct} onNavigate={setView} />;
      case 'detail':
        return <ProductDetail product={selectedProduct} onNavigate={setView} onUpdateProduct={handleUpdateProduct} />;
      default:
        return <div>Página não encontrada.</div>;
    }
  };

  return (
    <div className="app-container">
      <Navbar onNavigate={setView} currentView={view} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
