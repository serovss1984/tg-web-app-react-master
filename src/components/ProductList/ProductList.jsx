import React, { useState, useEffect } from 'react';
import './ProductList.css';
import ProductCard from '../ProductCard/ProductCard';
import OrderModal from '../OrderModal/OrderModal';
import { useTelegram } from '../hooks/useTelegram';
import { motion } from 'framer-motion';
import Cart from '../Cart/Cart';

const ProductList = () => {
    const [products, setProducts] = useState({
        snacks: [],
        mainMenu: [],
        drinks: [],
        sauces: []
    });
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const { tg, user } = useTelegram();
    const [isCartOpen, setIsCartOpen] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const getCategoryTitle = (category) => {
        const titles = {
            snacks: '🍟 Снеки',
            mainMenu: '🍴 Основное меню',
            drinks: '🥤 Напитки',
            sauces: '🥫 Соусы'
        };
        return titles[category] || category;
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://node.shavukha-aksay.ru/api/api/products');
            const data = await response.json();
            console.log('Received products:', data);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleAddToCart = (product) => {
        setCart(prev => [...prev, product]);
        updateMainButton();
    };

    useEffect(() => {
        updateMainButton();
    }, [cart]); // Зависимость от cart, чтобы useEffect срабатывал при изменении корзины

    const updateMainButton = () => {
        const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice, 0);
        if (cart.length === 0) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
            tg.MainButton.setParams({
                text: `В корзину`
                //text: `Заказать • ${totalPrice}₽`
            });
            //tg.MainButton.onClick(() => setIsModalOpen(true));
            tg.MainButton.onClick(() => setIsCartOpen(true));
        }
    };

    const handleOrderSubmit = async (orderData) => {
        const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice, 0);
        
        console.log('Submitting order with data:', {
            products: cart,
            totalPrice,
            ...orderData,
            userId: user?.id
        });

        try {
            const response = await fetch('https://node.shavukha-aksay.ru/api/web-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: cart,
                    totalPrice,
                    ...orderData,
                    userId: user?.id
                }),
            });

            const result = await response.json();
            console.log('Order submission result:', result);

            if (response.ok) {
                setIsModalOpen(false);
                setCart([]);
                tg.MainButton.hide();
                
                const message = orderData.deliveryType === 'pickup' 
                    ? 'Можете забирать заказ через 15 минут'
                    : 'Доставщик будет в течении часа';
                    
                tg.showPopup({
                    title: 'Заказ принят',
                    message: message,
                    buttons: [{type: 'ok'}]
                });
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            tg.showPopup({
                title: 'Ошибка',
                message: `Произошла ошибка: ${error.message}`,
                buttons: [{type: 'ok'}]
            });
        }
    };

    const handleRemoveFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
        updateMainButton();
    };

    const handleUpdateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prev => prev.map((item, i) => 
            i === index ? { ...item, quantity: newQuantity } : item
        ));
        updateMainButton();
    };

    return (
        <div className="product-list-container">
            <header className="product-list-header">
                <div className="user-info">
                    <img 
                        src={user?.photo_url || '/default-avatar.png'} 
                        alt="User" 
                        className="user-avatar"
                    />
                    <span className="username">{user?.username || 'Гость'}</span>
                </div>
                <div className="cart-info" onClick={() => setIsCartOpen(true)}>
                    {cart.length > 0 && (
                        <span className="cart-count">{cart.length}</span>
                    )}
                    <span className="cart-icon">🛒</span>
                </div>
            </header>

            <nav className="category-nav">
                <button 
                    className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                >
                    Все
                </button>
                <button 
                    className={`category-btn ${activeCategory === 'snacks' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('snacks')}
                >
                    🍟 Снеки
                </button>
                <button 
                    className={`category-btn ${activeCategory === 'mainMenu' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('mainMenu')}
                >
                    🍴 Основное меню
                </button>
                <button 
                    className={`category-btn ${activeCategory === 'drinks' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('drinks')}
                >
                    🍹 Напитки
                </button>
                <button 
                    className={`category-btn ${activeCategory === 'sauces' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('sauces')}
                >
                    🍴 Соусы
                </button>
            </nav>

            <motion.div 
                className="products-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {Object.entries(products).map(([category, items]) => (
                    (activeCategory === 'all' || activeCategory === category) && (
                        <motion.section 
                            key={category}
                            variants={itemVariants}
                        >
                            <h2>{getCategoryTitle(category)}</h2>
                            <div className="products-grid">
                                {items.map(product => (
                                    <ProductCard 
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        </motion.section>
                    )
                ))}
            </motion.div>

            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleOrderSubmit}
                totalPrice={cart.reduce((sum, item) => sum + item.finalPrice, 0)}
                cart={cart}
                user={user}
            />

            <Cart 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cart}
                onRemoveItem={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
            />
        </div>
    );
};

export default ProductList;
