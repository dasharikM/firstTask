// input-controller.js

// === Публичные константы ===
const ACTION_ACTIVATED = 'input-controller:action-activated';
const ACTION_DEACTIVATED = 'input-controller:action-deactivated';

// === Базовый класс плагина ===
class InputPlugin {
    constructor() {
        if (new.target === InputPlugin) {
            throw new Error('InputPlugin is abstract and cannot be instantiated directly.');
        }
        this.controller = null;
        this.target = null;
    }

   
    init(controller) {
        this.controller = controller;
    }

  
    attach(target) {
        throw new Error('Method "attach" must be implemented.');
    }

    detach() {
        throw new Error('Method "detach" must be implemented.');
    }

   
    getActionName(eventData) {
        throw new Error('Method "getActionName" must be implemented.');
    }

   
    getKeyCode(eventData) {
        throw new Error('Method "getKeyCode" must be implemented.');
    }
}

// === Плагин: Клавиатура ===
class KeyboardPlugin extends InputPlugin {
    constructor() {
        super();
        this.onKeyDown = this.handleKeyDown.bind(this);
        this.onKeyUp = this.handleKeyUp.bind(this);
    }

    attach(target) {
        this.target = target;
        this.target.addEventListener('keydown', this.onKeyDown);
        this.target.addEventListener('keyup', this.onKeyUp);
    }

    detach() {
        if (this.target) {
            this.target.removeEventListener('keydown', this.onKeyDown);
            this.target.removeEventListener('keyup', this.onKeyUp);
            this.target = null;
        }
    }

    handleKeyDown(e) {
        const actionName = this.getActionName(e);
        if (actionName) {
            this.controller._recordInput(this, actionName, e.keyCode, true);
        }
    }

    handleKeyUp(e) {
        const actionName = this.getActionName(e);
        if (actionName) {
            this.controller._recordInput(this, actionName, e.keyCode, false);
        }
    }

    getActionName(e) {
        return this.controller._getActionByCode(e.keyCode);
    }

    getKeyCode(e) {
        return e.keyCode;
    }
}

// === Плагин: Мышь ===
class MousePlugin extends InputPlugin {
    constructor() {
        super();
        this.onMouseDown = this.handleMouseDown.bind(this);
        this.onMouseUp = this.handleMouseUp.bind(this);
        this.onContextMenu = this.handleContextMenu.bind(this);
    }

    attach(target) {
        this.target = target;
        this.target.addEventListener('mousedown', this.onMouseDown);
        this.target.addEventListener('mouseup', this.onMouseUp);
        this.target.addEventListener('contextmenu', this.onContextMenu);
    }

    detach() {
        if (this.target) {
            this.target.removeEventListener('mousedown', this.onMouseDown);
            this.target.removeEventListener('mouseup', this.onMouseUp);
            this.target.removeEventListener('contextmenu', this.onContextMenu);
            this.target = null;
        }
    }

    handleMouseDown(e) {
        const actionName = this.getActionName(e);
        if (actionName) {
            e.preventDefault();
            this.controller._recordInput(this, actionName, `mouse_${e.button}`, true);
        }
    }

    handleMouseUp(e) {
        const actionName = this.getActionName(e);
        if (actionName) {
            this.controller._recordInput(this, actionName, `mouse_${e.button}`, false);
        }
    }

    getActionName(e) {
        if (e.button === 0) return 'left';
        if (e.button === 2) return 'right';
        return null;
    }

    getKeyCode(e) {
        return `mouse_${e.button}`;
    }

    handleContextMenu(e) {
        e.preventDefault();
    }
}

// === Основной контроллер ===
class InputController {
    static ACTION_ACTIVATED = ACTION_ACTIVATED;
    static ACTION_DEACTIVATED = ACTION_DEACTIVATED;

    constructor(actionsToBind = null, target = null) {
        this.enabled = true;
        this.focused = document.hasFocus();

        this.actions = new Map();        // actionName → { keys: [...], enabled: bool }
        this.actionsKeys = new Map();    // keyCode → Set<actionName>
        this.activeActions = new Set();  // активные действия
        this.activeInputs = new Set();   // активные вводы: { plugin, keyCode }
        this.plugins = new Set();        // установленные плагины
        this.pluginInstances = new Map(); // pluginClass → instance

        // Привязка методов
        this.onWindowBlur = this.onWindowBlur.bind(this);
        this.onWindowFocus = this.onWindowFocus.bind(this);

        // Биндим действия
        if (actionsToBind) {
            this.bindActions(actionsToBind);
        }

        // Регистрируем стандартный плагин клавиатуры
        this.use(KeyboardPlugin);

        // Подключаемся к DOM
        if (target) {
            this.attach(target);
        }

        // Фокус
        window.addEventListener('blur', this.onWindowBlur);
        window.addEventListener('focus', this.onWindowFocus);
    }

    onWindowBlur() {
        this.focused = false;
    }

    onWindowFocus() {
        this.focused = false; // сначала false
        setTimeout(() => {
            this.focused = document.hasFocus();
        }, 0);
    }

    // === Работа с плагинами ===
    use(PluginClass) {
        if (this.pluginInstances.has(PluginClass)) return;

        const plugin = new PluginClass();
        plugin.init(this);
        this.pluginInstances.set(PluginClass, plugin);
        this.plugins.add(plugin);

        if (this.target) {
            plugin.attach(this.target);
        }
    }

    remove(PluginClass) {
        const plugin = this.pluginInstances.get(PluginClass);
        if (plugin) {
            plugin.detach();
            this.plugins.delete(plugin);
            this.pluginInstances.delete(PluginClass);
        }
    }

    // === Внутренняя логика активации ===
    _recordInput(plugin, actionName, keyCode, isPressed) {
        if (!this.focused || !this.enabled) return;

        const action = this.actions.get(actionName);
        if (!action || !action.enabled) return;

        const inputKey = `${plugin.constructor.name}_${keyCode}`;

        if (isPressed) {
            this.activeInputs.add(inputKey);

            if (!this.activeActions.has(actionName)) {
                this.activeActions.add(actionName);
                this._dispatchEvent(ACTION_ACTIVATED, { act: actionName });
            }
        } else {
            this.activeInputs.delete(inputKey);

            // Проверяем, есть ли другие активные вводы для этого действия
            const isActive = this._isActionStillActive(actionName);
            if (!isActive && this.activeActions.has(actionName)) {
                this.activeActions.delete(actionName);
                this._dispatchEvent(ACTION_DEACTIVATED, { act: actionName });
            }
        }
    }

    _isActionStillActive(actionName) {
        const action = this.actions.get(actionName);
        if (!action) return false;

        // Есть ли зажатые клавиши (клавиатура)?
        const keyActive = action.keys.some(key => this.activeInputs.has(`KeyboardPlugin_${key}`));

        // Есть ли активные плагины (мышь)?
        const pluginActive = [...this.plugins].some(plugin => {
            const keyCode = plugin.getKeyCode ? plugin.getKeyCode({}) : null;
            const fullKey = `${plugin.constructor.name}_${keyCode}`;
            return this.activeInputs.has(fullKey) && plugin.getActionName({}) === actionName;
        });

        return keyActive || pluginActive;
    }

    _dispatchEvent(type, detail) {
        if (this.target) {
            const event = new CustomEvent(type, { detail });
            this.target.dispatchEvent(event);
        }
    }

    _getActionByCode(keyCode) {
        for (const [actionName, config] of this.actions) {
            if (config.keys && config.keys.includes(keyCode)) {
                return actionName;
            }
        }
        return null;
    }

    // === Публичные методы ===
    bindActions(actionsToBind) {
        if (!actionsToBind) return;

        for (const [actionName, config] of Object.entries(actionsToBind)) {
            const keys = config.keys || [];
            const enabled = config.enabled !== false;

            if (!this.actions.has(actionName)) {
                this.actions.set(actionName, { keys, enabled });
                for (const key of keys) {
                    if (!this.actionsKeys.has(key)) {
                        this.actionsKeys.set(key, new Set());
                    }
                    this.actionsKeys.get(key).add(actionName);
                }
            }
        }
    }

    enableAction(actionName) {
        const action = this.actions.get(actionName);
        if (action) {
            action.enabled = true;
        }
    }

    disableAction(actionName) {
        const action = this.actions.get(actionName);
        if (action) {
            action.enabled = false;
            if (this.activeActions.has(actionName)) {
                this.activeActions.delete(actionName);
                this._dispatchEvent(ACTION_DEACTIVATED, { act: actionName });
            }
        }
    }

    attach(target, dontEnable = false) {
        if (this.target) {
            this.detach(true);
        }
        this.target = target;

        for (const plugin of this.plugins) {
            plugin.attach(target);
        }

        if (!dontEnable) {
            this.enabled = true;
        }
    }

    detach(dontEnable = false) {
        for (const plugin of this.plugins) {
            plugin.detach();
        }

        if (!dontEnable) {
            this.enabled = false;
        }

        this.activeInputs.clear();
    }

    isActionActive(actionName) {
        return this.activeActions.has(actionName);
    }

    isKeyPressed(keyCode) {
        return this.activeInputs.has(`KeyboardPlugin_${keyCode}`);
    }
}

