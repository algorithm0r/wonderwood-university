// Item - a single item stack in inventory
class Item {
    constructor(id, name, type, quantity = 1, effect = null) {
        this.id       = id;
        this.name     = name;
        this.type     = type;     // 'key', 'book', 'food', 'consumable', 'equipment'
        this.quantity = quantity;
        this.effect   = effect;   // null or { stat: 'wellbeing', amount: 10 }
    }
}

// Inventory component - item storage for player (and eventually NPCs/shops)
class Inventory {
    constructor(maxSlots = 20) {
        this.items    = [];
        this.maxSlots = maxSlots;
    }

    // Add an item. Stackable types (not 'key') merge by id.
    add(item) {
        if (item.type !== 'key') {
            const existing = this.items.find(i => i.id === item.id);
            if (existing) {
                existing.quantity += item.quantity;
                return true;
            }
        }
        if (this.items.length >= this.maxSlots) return false;
        this.items.push(item);
        return true;
    }

    // Remove quantity of item by id. Returns true if successful.
    remove(id, quantity = 1) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx === -1) return false;
        this.items[idx].quantity -= quantity;
        if (this.items[idx].quantity <= 0) this.items.splice(idx, 1);
        return true;
    }

    has(id) {
        return this.items.some(i => i.id === id && i.quantity > 0);
    }

    count(id) {
        const item = this.items.find(i => i.id === id);
        return item ? item.quantity : 0;
    }
}
