/**
 * State Management System - Placeholder
 * This will be implemented in Prompt 5
 */

export class StateManager {
    constructor(initialState = {}) {
        this.state = initialState;
        this.subscribers = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    destroy() {
        this.subscribers = [];
    }
}