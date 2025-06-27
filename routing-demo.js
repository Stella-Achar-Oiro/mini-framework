/**
 * Comprehensive Routing System Demo
 * Demonstrates all routing features including transitions, lazy loading, guards, and more
 */

import { MiniFramework } from './src/index.js';
import { h, div, button, p, input, span, a, nav, ul, li, h1, h2, h3 } from './src/utils/dom-helpers.js';
import { TRANSITION_TYPES } from './src/core/route-transitions.js';

// Mock user state for authentication demo
let mockUser = null;

// Page components
function HomePage() {
    return div({ class: 'page', id: 'home-page' }, [
        h1({ style: 'color: #007bff; text-align: center; margin-bottom: 30px;' }, '🏠 Home Page'),
        div({ class: 'hero', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px; border-radius: 12px; text-align: center; margin: 20px 0;' }, [
            h2({ style: 'margin: 0 0 20px 0; font-size: 2.5em;' }, 'Welcome to the Routing Demo'),
            p({ style: 'font-size: 1.2em; opacity: 0.9; margin: 0;' }, 'Explore all the powerful routing features of our mini framework!')
        ]),
        div({ class: 'features-grid', style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;' }, [
            div({ class: 'feature-card', style: 'background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745;' }, [
                h3({ style: 'color: #28a745; margin-top: 0;' }, '⚡ Fast Navigation'),
                p({ style: 'color: #666; margin: 0;' }, 'Client-side routing with history API support')
            ]),
            div({ class: 'feature-card', style: 'background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #dc3545;' }, [
                h3({ style: 'color: #dc3545; margin-top: 0;' }, '🛡️ Route Guards'),
                p({ style: 'color: #666; margin: 0;' }, 'Authentication and authorization protection')
            ]),
            div({ class: 'feature-card', style: 'background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ffc107;' }, [
                h3({ style: 'color: #856404; margin-top: 0;' }, '🎭 Transitions'),
                p({ style: 'color: #666; margin: 0;' }, 'Smooth animations between routes')
            ]),
            div({ class: 'feature-card', style: 'background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #17a2b8;' }, [
                h3({ style: 'color: #17a2b8; margin-top: 0;' }, '📦 Lazy Loading'),
                p({ style: 'color: #666; margin: 0;' }, 'Code splitting for better performance')
            ])
        ])
    ]);
}

function AboutPage() {
    return div({ class: 'page', id: 'about-page' }, [
        h1({ style: 'color: #28a745; text-align: center; margin-bottom: 30px;' }, '📖 About Page'),
        div({ style: 'max-width: 800px; margin: 0 auto; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);' }, [
            p({ style: 'font-size: 1.1em; line-height: 1.6; color: #333; margin-bottom: 20px;' }, 
                'This routing system demonstrates a comprehensive client-side router built from scratch with modern features.'),
            h3({ style: 'color: #28a745; margin: 25px 0 15px 0;' }, 'Key Features:'),
            ul({ style: 'color: #666; line-height: 1.8;' }, [
                li({}, 'History API and hash-based routing'),
                li({}, 'Dynamic route parameters and wildcards'),
                li({}, 'Route guards for authentication'),
                li({}, 'Middleware system for custom logic'),
                li({}, 'Nested routing support'),
                li({}, 'Smooth transitions and animations'),
                li({}, 'Lazy loading with code splitting'),
                li({}, 'Programmatic navigation'),
                li({}, 'Query parameter handling'),
                li({}, 'Browser back/forward support')
            ])
        ])
    ]);
}

function UserProfilePage({ params }) {
    const userId = params.id || 'unknown';
    return div({ class: 'page', id: 'profile-page' }, [
        h1({ style: 'color: #6f42c1; text-align: center; margin-bottom: 30px;' }, `👤 User Profile: ${userId}`),
        div({ style: 'max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);' }, [
            div({ style: 'text-align: center; margin-bottom: 25px;' }, [
                div({ style: 'width: 80px; height: 80px; background: #6f42c1; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;' }, '👤'),
                h2({ style: 'margin: 0; color: #333;' }, `User ${userId}`),
                p({ style: 'color: #666; margin: 5px 0 0 0;' }, `user${userId}@example.com`)
            ]),
            div({ class: 'user-stats', style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0;' }, [
                div({ style: 'text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px;' }, [
                    div({ style: 'font-size: 24px; font-weight: bold; color: #007bff;' }, '42'),
                    div({ style: 'color: #666; font-size: 14px;' }, 'Posts')
                ]),
                div({ style: 'text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px;' }, [
                    div({ style: 'font-size: 24px; font-weight: bold; color: #28a745;' }, '128'),
                    div({ style: 'color: #666; font-size: 14px;' }, 'Followers')
                ]),
                div({ style: 'text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px;' }, [
                    div({ style: 'font-size: 24px; font-weight: bold; color: #dc3545;' }, '76'),
                    div({ style: 'color: #666; font-size: 14px;' }, 'Following')
                ])
            ]),
            div({ style: 'text-align: center; margin-top: 25px;' }, [
                button({ 
                    class: 'edit-profile-btn',
                    style: 'padding: 10px 20px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;'
                }, 'Edit Profile'),
                button({ 
                    class: 'message-btn',
                    style: 'padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer;'
                }, 'Send Message')
            ])
        ])
    ]);
}

function ProductsPage({ query }) {
    const category = query.category || 'all';
    const search = query.search || '';
    
    return div({ class: 'page', id: 'products-page' }, [
        h1({ style: 'color: #fd7e14; text-align: center; margin-bottom: 30px;' }, '🛍️ Products'),
        div({ style: 'max-width: 1000px; margin: 0 auto;' }, [
            // Filters
            div({ class: 'filters', style: 'background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);' }, [
                h3({ style: 'margin: 0 0 15px 0; color: #333;' }, 'Filters'),
                div({ style: 'display: flex; gap: 15px; flex-wrap: wrap; align-items: center;' }, [
                    div({}, [
                        span({ style: 'margin-right: 10px; font-weight: bold;' }, 'Category:'),
                        button({ 
                            class: `filter-btn ${category === 'all' ? 'active' : ''}`,
                            'data-category': 'all',
                            style: `padding: 6px 12px; border: 1px solid #ddd; background: ${category === 'all' ? '#007bff' : '#fff'}; color: ${category === 'all' ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; margin-right: 5px;`
                        }, 'All'),
                        button({ 
                            class: `filter-btn ${category === 'electronics' ? 'active' : ''}`,
                            'data-category': 'electronics',
                            style: `padding: 6px 12px; border: 1px solid #ddd; background: ${category === 'electronics' ? '#007bff' : '#fff'}; color: ${category === 'electronics' ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; margin-right: 5px;`
                        }, 'Electronics'),
                        button({ 
                            class: `filter-btn ${category === 'clothing' ? 'active' : ''}`,
                            'data-category': 'clothing',
                            style: `padding: 6px 12px; border: 1px solid #ddd; background: ${category === 'clothing' ? '#007bff' : '#fff'}; color: ${category === 'clothing' ? 'white' : '#333'}; border-radius: 4px; cursor: pointer;`
                        }, 'Clothing')
                    ]),
                    div({}, [
                        span({ style: 'margin-right: 10px; font-weight: bold;' }, 'Search:'),
                        input({ 
                            class: 'search-input',
                            type: 'text',
                            placeholder: 'Search products...',
                            value: search,
                            style: 'padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; width: 200px;'
                        })
                    ])
                ])
            ]),
            // Products grid
            div({ class: 'products-grid', style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;' }, 
                generateProducts(category, search).map(product => 
                    div({ class: 'product-card', style: 'background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease;' }, [
                        div({ style: 'background: #f8f9fa; height: 150px; border-radius: 6px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; font-size: 48px;' }, product.icon),
                        h3({ style: 'margin: 0 0 10px 0; color: #333;' }, product.name),
                        p({ style: 'color: #666; margin: 0 0 15px 0; font-size: 14px;' }, product.description),
                        div({ style: 'display: flex; justify-content: space-between; align-items: center;' }, [
                            span({ style: 'font-size: 18px; font-weight: bold; color: #007bff;' }, product.price),
                            button({ 
                                class: 'add-to-cart-btn',
                                'data-product-id': product.id,
                                style: 'padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;'
                            }, 'Add to Cart')
                        ])
                    ])
                )
            )
        ])
    ]);
}

function ProtectedPage() {
    return div({ class: 'page', id: 'protected-page' }, [
        h1({ style: 'color: #dc3545; text-align: center; margin-bottom: 30px;' }, '🔒 Protected Area'),
        div({ style: 'max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;' }, [
            div({ style: 'background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 6px; margin-bottom: 25px;' }, [
                h2({ style: 'margin: 0 0 10px 0;' }, '✅ Authentication Successful'),
                p({ style: 'margin: 0;' }, `Welcome, ${mockUser?.name || 'User'}! You have access to this protected content.`)
            ]),
            div({ style: 'background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;' }, [
                h3({ style: 'margin: 0 0 15px 0; color: #333;' }, 'Protected Features:'),
                ul({ style: 'text-align: left; color: #666; line-height: 1.6;' }, [
                    li({}, 'Secure data access'),
                    li({}, 'User-specific content'),
                    li({}, 'Admin functionality'),
                    li({}, 'Premium features')
                ])
            ]),
            button({ 
                class: 'logout-btn',
                style: 'padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;'
            }, 'Logout')
        ])
    ]);
}

function NotFoundPage() {
    return div({ class: 'page', id: 'not-found-page' }, [
        div({ style: 'text-align: center; padding: 50px;' }, [
            h1({ style: 'font-size: 8em; margin: 0; color: #dc3545;' }, '404'),
            h2({ style: 'color: #666; margin: 20px 0;' }, 'Page Not Found'),
            p({ style: 'color: #999; margin: 20px 0 30px 0;' }, 'The page you are looking for does not exist.'),
            a({ 
                href: '/',
                style: 'display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;'
            }, 'Go Home')
        ])
    ]);
}

// Login component
function LoginPage() {
    return div({ class: 'page', id: 'login-page' }, [
        h1({ style: 'color: #007bff; text-align: center; margin-bottom: 30px;' }, '🔐 Login'),
        div({ style: 'max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);' }, [
            div({ class: 'login-form' }, [
                div({ style: 'margin-bottom: 20px;' }, [
                    span({ style: 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;' }, 'Username:'),
                    input({ 
                        class: 'login-username',
                        type: 'text',
                        placeholder: 'Enter username',
                        value: 'demo',
                        style: 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;'
                    })
                ]),
                div({ style: 'margin-bottom: 25px;' }, [
                    span({ style: 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;' }, 'Password:'),
                    input({ 
                        class: 'login-password',
                        type: 'password',
                        placeholder: 'Enter password',
                        value: 'demo',
                        style: 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;'
                    })
                ]),
                button({ 
                    class: 'login-btn',
                    style: 'width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;'
                }, 'Login'),
                div({ style: 'margin-top: 15px; padding: 10px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; font-size: 14px; color: #0c5460;' }, [
                    p({ style: 'margin: 0;' }, 'Demo credentials:'),
                    p({ style: 'margin: 5px 0 0 0;' }, 'Username: demo, Password: demo')
                ])
            ])
        ])
    ]);
}

// Navigation component
function NavigationComponent({ currentRoute }) {
    return nav({ style: 'background: white; padding: 15px 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;' }, [
        div({ style: 'max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;' }, [
            h2({ style: 'margin: 0; color: #333;' }, '🚀 Router Demo'),
            ul({ style: 'display: flex; list-style: none; margin: 0; padding: 0; gap: 20px;' }, [
                li({}, [
                    a({ 
                        href: '/',
                        class: currentRoute === '/' ? 'active-link' : '',
                        style: `text-decoration: none; color: ${currentRoute === '/' ? '#007bff' : '#666'}; font-weight: ${currentRoute === '/' ? 'bold' : 'normal'}; padding: 8px 12px; border-radius: 4px; transition: all 0.2s ease;`
                    }, 'Home')
                ]),
                li({}, [
                    a({ 
                        href: '/about',
                        class: currentRoute === '/about' ? 'active-link' : '',
                        style: `text-decoration: none; color: ${currentRoute === '/about' ? '#007bff' : '#666'}; font-weight: ${currentRoute === '/about' ? 'bold' : 'normal'}; padding: 8px 12px; border-radius: 4px; transition: all 0.2s ease;`
                    }, 'About')
                ]),
                li({}, [
                    a({ 
                        href: '/user/123',
                        class: currentRoute?.startsWith('/user') ? 'active-link' : '',
                        style: `text-decoration: none; color: ${currentRoute?.startsWith('/user') ? '#007bff' : '#666'}; font-weight: ${currentRoute?.startsWith('/user') ? 'bold' : 'normal'}; padding: 8px 12px; border-radius: 4px; transition: all 0.2s ease;`
                    }, 'Profile')
                ]),
                li({}, [
                    a({ 
                        href: '/products?category=all',
                        class: currentRoute === '/products' ? 'active-link' : '',
                        style: `text-decoration: none; color: ${currentRoute === '/products' ? '#007bff' : '#666'}; font-weight: ${currentRoute === '/products' ? 'bold' : 'normal'}; padding: 8px 12px; border-radius: 4px; transition: all 0.2s ease;`
                    }, 'Products')
                ]),
                li({}, [
                    a({ 
                        href: '/protected',
                        class: currentRoute === '/protected' ? 'active-link' : '',
                        style: `text-decoration: none; color: ${currentRoute === '/protected' ? '#007bff' : '#666'}; font-weight: ${currentRoute === '/protected' ? 'bold' : 'normal'}; padding: 8px 12px; border-radius: 4px; transition: all 0.2s ease;`
                    }, 'Protected')
                ])
            ]),
            div({ style: 'display: flex; align-items: center; gap: 15px;' }, [
                mockUser ? [
                    span({ style: 'color: #666;' }, `Welcome, ${mockUser.name}`),
                    button({ 
                        class: 'logout-nav-btn',
                        style: 'padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;'
                    }, 'Logout')
                ] : [
                    a({ 
                        href: '/login',
                        style: 'padding: 6px 12px; background: #28a745; color: white; text-decoration: none; border-radius: 4px;'
                    }, 'Login')
                ]
            ])
        ])
    ]);
}

// Utility function to generate mock products
function generateProducts(category, search) {
    const allProducts = [
        { id: 1, name: 'Smartphone', description: 'Latest model with amazing features', price: '$699', category: 'electronics', icon: '📱' },
        { id: 2, name: 'Laptop', description: 'High-performance laptop for work', price: '$1299', category: 'electronics', icon: '💻' },
        { id: 3, name: 'T-Shirt', description: 'Comfortable cotton t-shirt', price: '$19', category: 'clothing', icon: '👕' },
        { id: 4, name: 'Jeans', description: 'Premium denim jeans', price: '$79', category: 'clothing', icon: '👖' },
        { id: 5, name: 'Headphones', description: 'Wireless noise-canceling headphones', price: '$199', category: 'electronics', icon: '🎧' },
        { id: 6, name: 'Sneakers', description: 'Comfortable running shoes', price: '$129', category: 'clothing', icon: '👟' }
    ];

    return allProducts.filter(product => {
        const matchesCategory = category === 'all' || product.category === category;
        const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });
}

// Authentication guard
function authGuard(to, from, next) {
    if (mockUser) {
        next(); // User is authenticated
    } else {
        next('/login'); // Redirect to login
    }
}

// Initialize the routing demo
document.addEventListener('DOMContentLoaded', () => {
    const app = new MiniFramework({
        container: '#app',
        debug: true,
        routing: {
            mode: 'history',
            enableTransitions: true,
            enableGuards: true,
            enableMiddleware: true,
            transition: {
                type: TRANSITION_TYPES.FADE,
                duration: 300
            }
        }
    });

    app.init();

    // Register routes
    app.router.route('/', HomePage, { name: 'home' });
    app.router.route('/about', AboutPage, { name: 'about' });
    app.router.route('/user/:id', UserProfilePage, { name: 'profile' });
    app.router.route('/products', ProductsPage, { name: 'products' });
    app.router.route('/login', LoginPage, { name: 'login' });
    app.router.route('/protected', ProtectedPage, { 
        name: 'protected', 
        guards: [authGuard]
    });
    app.router.route('*', NotFoundPage, { name: 'notFound' });

    // Add global authentication middleware
    app.router.use((to, from) => {
        console.log(`🔄 Navigation: ${from?.route?.path || 'initial'} → ${to.route.path}`);
    }, { name: 'logger', priority: 1 });

    // Set up event handlers
    app.events.on('.login-btn', 'click', () => {
        const username = document.querySelector('.login-username').value;
        const password = document.querySelector('.login-password').value;
        
        if (username === 'demo' && password === 'demo') {
            mockUser = { name: 'Demo User', email: 'demo@example.com' };
            app.router.navigate('/protected');
        } else {
            alert('Invalid credentials. Use: demo/demo');
        }
    });

    app.events.on('.logout-btn, .logout-nav-btn', 'click', () => {
        mockUser = null;
        app.router.navigate('/');
    });

    // Product filtering
    app.events.on('.filter-btn', 'click', (e) => {
        const category = e.currentTarget.dataset.category;
        const search = document.querySelector('.search-input')?.value || '';
        const query = category === 'all' && !search ? '' : `?category=${category}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        app.router.navigate(`/products${query}`);
    });

    app.events.on('.search-input', 'input', (e) => {
        const search = e.target.value;
        const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
        const query = !search && activeCategory === 'all' ? '' : `?category=${activeCategory}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        app.router.navigate(`/products${query}`, { replace: true });
    });

    // Route change handler for updating navigation
    app.router.events.on(window, 'navigate', (event) => {
        const route = event.data.to;
        renderApp(route);
    });

    // Render function
    function renderApp(currentRoute = null) {
        const routePath = currentRoute?.route?.path || app.router.getCurrentRoute()?.route?.path || '/';
        
        const appComponent = div({ style: 'min-height: 100vh; background: #f8f9fa;' }, [
            NavigationComponent({ currentRoute: routePath }),
            div({ id: 'route-content', style: 'max-width: 1200px; margin: 0 auto; padding: 20px;' }, [
                // Route content will be rendered here by the router
            ])
        ]);

        app.render(appComponent);
    }

    // Initial render
    renderApp();

    console.log('🎉 Routing Demo initialized!');
    console.log('📊 Router stats:', app.router.getStats());
    console.log('🎭 Available routes:', Array.from(app.router.routes.keys()));
});