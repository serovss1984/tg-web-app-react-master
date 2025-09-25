import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Cart.css';
import OrderModal from '../OrderModal/OrderModal';
import { useTelegram } from '../hooks/useTelegram';

const Cart = ({ isOpen, onClose, items, setItems, onRemoveItem, onUpdateQuantity }) => {
    const { user, tg } = useTelegram(); // Получаем user и tg
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false); // Состояние для OrderModal
    const total = items.reduce((sum, item) => sum + item.finalPrice * (item.quantity || 1), 0);

    const [cart, setCart] = useState([]);

    // Обработчик для кнопки "Оформить заказ"
    const handleCheckout = () => {
        onClose(); // Закрываем корзину
        setIsOrderModalOpen(true); // Открываем OrderModal
    };

    // Обработчик для закрытия OrderModal
    const handleOrderModalClose = () => {
        setIsOrderModalOpen(false); // Закрываем OrderModal
    };

    const handleClearItems = () => {
        setItems([]);
    };

    // Обработчик для подтверждения заказа
    const handleOrderSubmit = async (orderData) => {
    const totalPrice = items.reduce((sum, item) => sum + item.finalPrice, 0);

    console.log('Submitting order with data:', {
        products: items,
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
                products: items,
                totalPrice,
                ...orderData,
                userId: user?.id
            }),
        });

        const result = await response.json();
        console.log('Order submission result:', result);

        if (response.ok) {
            setIsOrderModalOpen(false); // Закрываем модалку
            //setItems([]); // Очищаем корзину
            setCart([]);
            tg.MainButton.hide();
            
            const message = orderData.deliveryType === 'pickup' 
                ? 'Можете забирать заказ через 15 минут'
                : 'Ожидайте принятия заказа, с вами свяжутся';
                
            tg.showPopup({
                title: 'Заказ принят',
                message: message,
                buttons: [{type: 'ok'}]
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);

            tg.showPopup({
                title: 'Ошибка',
                message: `Ошибка сервера: ${response.status}`,
                buttons: [{ type: 'ok' }]
            });
        return;
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

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            className="cart-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />
                        <motion.div 
                            className="cart-modal"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                        >
                            <div className="cart-header">
                                <h3>Корзина</h3>
                                <button className="close-btn" onClick={onClose}>✕</button>
                            </div>

                            {items.length === 0 ? (
                                <div className="cart-empty">
                                    <span className="cart-empty-icon">🛒</span>
                                    <p>Корзина пуста</p>
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {items.map((item, index) => (
                                            <motion.div 
                                                key={index}
                                                className="cart-item"
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <img src={item.photoUrl} alt={item.name} />
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <div className="item-customization">
                                                        {item.addedIngredients?.length > 0 && (
                                                            <small>
                                                                Добавки: {item.addedIngredients.map(i => i.name).join(', ')}
                                                            </small>
                                                        )}
                                                        {item.removedIngredients?.length > 0 && (
                                                            <small>
                                                                Убрать: {item.removedIngredients.map(i => i.name).join(', ')}
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className="item-price">
                                                        {item.finalPrice}₽
                                                    </div>
                                                </div>
                                                <div className="item-controls">
                                                    <button 
                                                        className="quantity-btn"
                                                        onClick={() => onUpdateQuantity(index, (item.quantity || 1) - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="quantity">{item.quantity || 1}</span>
                                                    <button 
                                                        className="quantity-btn"
                                                        onClick={() => onUpdateQuantity(index, (item.quantity || 1) + 1)}
                                                    >
                                                        +
                                                    </button>
                                                    <button 
                                                        className="remove-btn"
                                                        onClick={() => onRemoveItem(index)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="cart-footer">
                                        <div className="cart-total">
                                            <span>Итого:</span>
                                            <span className="total-price">{total}₽</span>
                                        </div>
                                        <div className="checkout-btn-1">
                                            <button 
                                                className="checkout-btn"
                                                onClick={handleCheckout} // Используем handleCheckout
                                            >
                                                Оформить заказ
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* OrderModal */}
            <OrderModal
                isOpen={isOrderModalOpen} // Управление видимостью
                onClose={handleOrderModalClose} // Закрытие модального окна
                onSubmit={handleOrderSubmit} // Обработка данных заказа
                totalPrice={total} // Передаем общую сумму
            />
        </>
    );
};

export default Cart;


