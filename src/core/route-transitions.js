/**
 * Route Transition System
 * Handles route transitions with animations and lifecycle hooks
 * @module core/route-transitions
 */

import { Logger } from '../utils/logger.js';
import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';

/**
 * Transition types
 */
export const TRANSITION_TYPES = {
    SLIDE: 'slide',
    FADE: 'fade',
    SCALE: 'scale',
    FLIP: 'flip',
    CUSTOM: 'custom'
};

/**
 * Transition directions
 */
export const TRANSITION_DIRECTIONS = {
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down',
    IN: 'in',
    OUT: 'out'
};

/**
 * Transition phases
 */
export const TRANSITION_PHASES = {
    BEFORE_LEAVE: 'beforeLeave',
    LEAVING: 'leaving',
    AFTER_LEAVE: 'afterLeave',
    BEFORE_ENTER: 'beforeEnter',
    ENTERING: 'entering',
    AFTER_ENTER: 'afterEnter'
};

/**
 * Route transition class
 */
export class RouteTransition {
    constructor(options = {}) {
        this.options = {
            type: TRANSITION_TYPES.FADE,
            direction: TRANSITION_DIRECTIONS.IN,
            duration: 300,
            easing: 'ease-in-out',
            delay: 0,
            overlap: false,
            disabled: false,
            ...options
        };

        this.logger = new Logger(this.options.debug);
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        
        this.activeTransitions = new Set();
        this.transitionQueue = [];
        this.isTransitioning = false;
    }

    /**
     * Execute transition between routes
     */
    async transition(fromElement, toElement, fromRoute, toRoute) {
        if (this.options.disabled) {
            return this._instantTransition(fromElement, toElement);
        }

        const transitionId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeTransitions.add(transitionId);

        try {
            this.logger.debug(`Starting transition ${transitionId}`, { fromRoute, toRoute });

            // Execute lifecycle hooks
            await this._executePhase(TRANSITION_PHASES.BEFORE_LEAVE, fromElement, fromRoute);
            await this._executePhase(TRANSITION_PHASES.BEFORE_ENTER, toElement, toRoute);

            // Perform the actual transition
            if (this.options.overlap) {
                await this._overlappingTransition(fromElement, toElement, transitionId);
            } else {
                await this._sequentialTransition(fromElement, toElement, transitionId);
            }

            // Execute completion hooks
            await this._executePhase(TRANSITION_PHASES.AFTER_LEAVE, fromElement, fromRoute);
            await this._executePhase(TRANSITION_PHASES.AFTER_ENTER, toElement, toRoute);

            this.logger.debug(`Transition ${transitionId} completed`);
            return true;

        } catch (error) {
            this.errorBoundary.handleError(`Transition ${transitionId} failed`, error, ERROR_TYPES.ROUTER);
            return false;
        } finally {
            this.activeTransitions.delete(transitionId);
            this.isTransitioning = this.activeTransitions.size > 0;
        }
    }

    /**
     * Create transition CSS classes
     */
    createTransitionClasses() {
        const css = `
            .route-transition-container {
                position: relative;
                overflow: hidden;
                width: 100%;
                height: 100%;
            }

            .route-transition-element {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transition: all ${this.options.duration}ms ${this.options.easing};
            }

            /* Fade transitions */
            .route-fade-enter {
                opacity: 0;
            }
            .route-fade-enter-active {
                opacity: 1;
            }
            .route-fade-leave {
                opacity: 1;
            }
            .route-fade-leave-active {
                opacity: 0;
            }

            /* Slide transitions */
            .route-slide-left-enter {
                transform: translateX(100%);
            }
            .route-slide-left-enter-active {
                transform: translateX(0);
            }
            .route-slide-left-leave {
                transform: translateX(0);
            }
            .route-slide-left-leave-active {
                transform: translateX(-100%);
            }

            .route-slide-right-enter {
                transform: translateX(-100%);
            }
            .route-slide-right-enter-active {
                transform: translateX(0);
            }
            .route-slide-right-leave {
                transform: translateX(0);
            }
            .route-slide-right-leave-active {
                transform: translateX(100%);
            }

            .route-slide-up-enter {
                transform: translateY(100%);
            }
            .route-slide-up-enter-active {
                transform: translateY(0);
            }
            .route-slide-up-leave {
                transform: translateY(0);
            }
            .route-slide-up-leave-active {
                transform: translateY(-100%);
            }

            .route-slide-down-enter {
                transform: translateY(-100%);
            }
            .route-slide-down-enter-active {
                transform: translateY(0);
            }
            .route-slide-down-leave {
                transform: translateY(0);
            }
            .route-slide-down-leave-active {
                transform: translateY(100%);
            }

            /* Scale transitions */
            .route-scale-enter {
                transform: scale(0.8);
                opacity: 0;
            }
            .route-scale-enter-active {
                transform: scale(1);
                opacity: 1;
            }
            .route-scale-leave {
                transform: scale(1);
                opacity: 1;
            }
            .route-scale-leave-active {
                transform: scale(1.2);
                opacity: 0;
            }

            /* Flip transitions */
            .route-flip-enter {
                transform: rotateY(-90deg);
                opacity: 0;
            }
            .route-flip-enter-active {
                transform: rotateY(0);
                opacity: 1;
            }
            .route-flip-leave {
                transform: rotateY(0);
                opacity: 1;
            }
            .route-flip-leave-active {
                transform: rotateY(90deg);
                opacity: 0;
            }
        `;

        // Inject CSS if not already present
        if (!document.getElementById('route-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'route-transition-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    /**
     * Get CSS class names for transition
     * @private
     */
    _getTransitionClasses(phase, element) {
        const type = this.options.type;
        const direction = this.options.direction;
        
        const baseClass = `route-${type}`;
        
        if (type === TRANSITION_TYPES.SLIDE) {
            return {
                enter: `${baseClass}-${direction}-enter`,
                enterActive: `${baseClass}-${direction}-enter-active`,
                leave: `${baseClass}-${direction}-leave`,
                leaveActive: `${baseClass}-${direction}-leave-active`
            };
        }
        
        return {
            enter: `${baseClass}-enter`,
            enterActive: `${baseClass}-enter-active`,
            leave: `${baseClass}-leave`,
            leaveActive: `${baseClass}-leave-active`
        };
    }

    /**
     * Execute transition phase
     * @private
     */
    async _executePhase(phase, element, route) {
        if (route && route.transition && route.transition[phase]) {
            try {
                await route.transition[phase](element, route);
            } catch (error) {
                this.logger.error(`Transition phase ${phase} error:`, error);
            }
        }
    }

    /**
     * Instant transition without animation
     * @private
     */
    async _instantTransition(fromElement, toElement) {
        if (fromElement) {
            fromElement.style.display = 'none';
        }
        if (toElement) {
            toElement.style.display = 'block';
        }
        return true;
    }

    /**
     * Sequential transition (leave then enter)
     * @private
     */
    async _sequentialTransition(fromElement, toElement, transitionId) {
        const classes = this._getTransitionClasses();

        // Phase 1: Leave transition
        if (fromElement) {
            await this._animateElement(fromElement, classes.leave, classes.leaveActive, 'leave');
            fromElement.style.display = 'none';
        }

        // Phase 2: Enter transition
        if (toElement) {
            toElement.style.display = 'block';
            await this._animateElement(toElement, classes.enter, classes.enterActive, 'enter');
        }
    }

    /**
     * Overlapping transition (leave and enter simultaneously)
     * @private
     */
    async _overlappingTransition(fromElement, toElement, transitionId) {
        const classes = this._getTransitionClasses();
        const promises = [];

        // Setup container for overlapping
        const container = this._createTransitionContainer(fromElement, toElement);

        // Start both transitions simultaneously
        if (fromElement) {
            promises.push(this._animateElement(fromElement, classes.leave, classes.leaveActive, 'leave'));
        }

        if (toElement) {
            toElement.style.display = 'block';
            promises.push(this._animateElement(toElement, classes.enter, classes.enterActive, 'enter'));
        }

        // Wait for both to complete
        await Promise.all(promises);

        // Cleanup
        this._cleanupTransitionContainer(container, fromElement, toElement);
    }

    /**
     * Animate element with CSS classes
     * @private
     */
    async _animateElement(element, startClass, activeClass, type) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            // Add transition element class
            element.classList.add('route-transition-element');
            
            // Set initial state
            element.classList.add(startClass);
            
            // Force layout
            element.offsetHeight;
            
            // Add active class for transition
            element.classList.add(activeClass);
            
            // Wait for transition to complete
            const cleanup = () => {
                element.classList.remove('route-transition-element', startClass, activeClass);
                element.removeEventListener('transitionend', onTransitionEnd);
                clearTimeout(timeoutId);
                resolve();
            };

            const onTransitionEnd = (event) => {
                if (event.target === element) {
                    cleanup();
                }
            };

            element.addEventListener('transitionend', onTransitionEnd);
            
            // Fallback timeout
            const timeoutId = setTimeout(cleanup, this.options.duration + 50);
        });
    }

    /**
     * Create container for overlapping transitions
     * @private
     */
    _createTransitionContainer(fromElement, toElement) {
        const container = document.createElement('div');
        container.className = 'route-transition-container';
        
        if (fromElement && fromElement.parentNode) {
            fromElement.parentNode.insertBefore(container, fromElement);
            container.appendChild(fromElement);
        }
        
        if (toElement) {
            container.appendChild(toElement);
        }
        
        return container;
    }

    /**
     * Cleanup transition container
     * @private
     */
    _cleanupTransitionContainer(container, fromElement, toElement) {
        if (!container || !container.parentNode) return;

        const parent = container.parentNode;
        
        // Move elements back to parent
        if (fromElement && fromElement.parentNode === container) {
            fromElement.style.display = 'none';
            parent.appendChild(fromElement);
        }
        
        if (toElement && toElement.parentNode === container) {
            parent.appendChild(toElement);
        }
        
        // Remove container
        parent.removeChild(container);
    }
}

/**
 * Lazy route loader
 */
export class LazyRouteLoader {
    constructor(options = {}) {
        this.options = {
            timeout: 30000,
            retries: 3,
            cache: true,
            debug: false,
            ...options
        };

        this.logger = new Logger(this.options.debug);
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        
        this.loadedRoutes = new Map();
        this.loadingPromises = new Map();
        this.stats = {
            totalLoads: 0,
            successfulLoads: 0,
            failedLoads: 0,
            cacheHits: 0,
            totalLoadTime: 0
        };
    }

    /**
     * Load a route component lazily
     */
    async loadRoute(routeConfig) {
        const routeId = routeConfig.path || routeConfig.name || 'unknown';
        
        // Check cache first
        if (this.options.cache && this.loadedRoutes.has(routeId)) {
            this.stats.cacheHits++;
            this.logger.debug(`Route ${routeId} loaded from cache`);
            return this.loadedRoutes.get(routeId);
        }

        // Check if already loading
        if (this.loadingPromises.has(routeId)) {
            return this.loadingPromises.get(routeId);
        }

        // Start loading
        const loadPromise = this._loadRouteWithRetry(routeConfig, routeId);
        this.loadingPromises.set(routeId, loadPromise);

        try {
            const component = await loadPromise;
            
            // Cache the result
            if (this.options.cache) {
                this.loadedRoutes.set(routeId, component);
            }
            
            this.stats.successfulLoads++;
            this.logger.debug(`Route ${routeId} loaded successfully`);
            return component;
            
        } catch (error) {
            this.stats.failedLoads++;
            this.errorBoundary.handleError(`Failed to load route ${routeId}`, error, ERROR_TYPES.ROUTER);
            throw error;
        } finally {
            this.loadingPromises.delete(routeId);
            this.stats.totalLoads++;
        }
    }

    /**
     * Preload routes
     */
    async preloadRoutes(routeConfigs) {
        const preloadPromises = routeConfigs.map(config => 
            this.loadRoute(config).catch(error => {
                this.logger.warn(`Failed to preload route ${config.path}:`, error);
                return null;
            })
        );

        const results = await Promise.allSettled(preloadPromises);
        const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
        
        this.logger.debug(`Preloaded ${successful}/${routeConfigs.length} routes`);
        return successful;
    }

    /**
     * Get loader statistics
     */
    getStats() {
        return {
            ...this.stats,
            averageLoadTime: this.stats.totalLoads > 0 ? 
                this.stats.totalLoadTime / this.stats.totalLoads : 0,
            cacheSize: this.loadedRoutes.size,
            activeLoads: this.loadingPromises.size,
            successRate: this.stats.totalLoads > 0 ? 
                (this.stats.successfulLoads / this.stats.totalLoads) * 100 : 0
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.loadedRoutes.clear();
        this.logger.debug('Route cache cleared');
    }

    /**
     * Load route with retry logic
     * @private
     */
    async _loadRouteWithRetry(routeConfig, routeId) {
        const startTime = performance.now();
        let lastError;

        for (let attempt = 1; attempt <= this.options.retries; attempt++) {
            try {
                const component = await this._loadRouteSingle(routeConfig, attempt);
                const loadTime = performance.now() - startTime;
                this.stats.totalLoadTime += loadTime;
                return component;
            } catch (error) {
                lastError = error;
                this.logger.warn(`Route ${routeId} load attempt ${attempt} failed:`, error);
                
                if (attempt < this.options.retries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Single route load attempt
     * @private
     */
    async _loadRouteSingle(routeConfig, attempt) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Route load timeout after ${this.options.timeout}ms (attempt ${attempt})`));
            }, this.options.timeout);

            try {
                if (typeof routeConfig.component === 'function') {
                    // Dynamic import function
                    const importPromise = routeConfig.component();
                    
                    if (importPromise && typeof importPromise.then === 'function') {
                        importPromise
                            .then(module => {
                                clearTimeout(timeout);
                                // Handle both default and named exports
                                const component = module.default || module;
                                resolve(component);
                            })
                            .catch(error => {
                                clearTimeout(timeout);
                                reject(error);
                            });
                    } else {
                        clearTimeout(timeout);
                        resolve(importPromise);
                    }
                } else if (typeof routeConfig.component === 'string') {
                    // Module path string
                    import(routeConfig.component)
                        .then(module => {
                            clearTimeout(timeout);
                            const component = module.default || module;
                            resolve(component);
                        })
                        .catch(error => {
                            clearTimeout(timeout);
                            reject(error);
                        });
                } else {
                    // Direct component
                    clearTimeout(timeout);
                    resolve(routeConfig.component);
                }
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
}