class inputController {
    static ACTION_ACTIVATED = 'input-controller:action-activated';
    static ACTION_DEACTIVATED = 'input-controller:action-deactivated';

    constructor(actionsToBind = null, target = null) {
        this.target = target;
        this.focused = document.hasFocus();
        this.enabled = true;
        this.actionsToBind = actionsToBind;

        this.actions = new Map();          
        this.actionsKeys = new Map();       
        this.keysActive = new Set();        
        this.activeActions = new Set();     

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.bindActions(actionsToBind);

        this.attach(this.target);

        window.addEventListener('blur', () => {
            this.focused = false;
        });

        window.addEventListener('focus', () => {
            this.focused = true;
        });
    }

    addActivity(actionsToBind) {
        if (!actionsToBind) return;
        this.bindActions(actionsToBind);
    }

    onKeyDown(e) {
        if (!this.focused || !this.enabled) return;

        // двойное нажатие
        if (this.keysActive.has(e.keyCode)) return;

        this.keysActive.add(e.keyCode);

        if(this.actionsKeys.has(e.keyCode) && e.keyCode === 32){
            let element = document.getElementById('element');
            element.className = 'element color-g';
        }

        const listActionsName = this.actionsKeys.get(e.keyCode);
        if (listActionsName) {
            for (const actionName of listActionsName) {
                const action = this.actions.get(actionName);
                if (!action || !action.enabled) continue;

              
                const wasActive = this.activeActions.has(actionName);

                this.activeActions.add(actionName);

                if (!wasActive) {
                    const event = new CustomEvent(inputController.ACTION_ACTIVATED, {
                        detail: { act: actionName }
                    });
                    this.target.dispatchEvent(event);
                }
            }
        }
    }

    onKeyUp(e) {
        if (!this.focused || !this.enabled) return;

        if (!this.keysActive.has(e.keyCode)) return;

        if( this.actionsKeys.has(e.keyCode) && e.keyCode == 32){
            let element = document.getElementById('element');
            element.className = 'element ';
        }
        
        this.keysActive.delete(e.keyCode);

        const listActionsName = this.actionsKeys.get(e.keyCode);
        if (listActionsName) {
            for (const actionName of listActionsName) {
                const action = this.actions.get(actionName);
                if (!action || !action.enabled) continue;

                const otherKeysStillPressed = action.keys.some(key => 
                    key !== e.keyCode && this.keysActive.has(key)
                );

                if (!otherKeysStillPressed) {
                    this.activeActions.delete(actionName);

                    const event = new CustomEvent(inputController.ACTION_DEACTIVATED, {
                        detail: { act: actionName }
                    });
                    this.target.dispatchEvent(event);
                }
            }
        }
    }

    bindActions(actionsToBind) {
        if (!actionsToBind) return;

        for (const [actionName, config] of Object.entries(actionsToBind)) {
            const keys = config.keys || [];
            const enabled = config.enabled !== false; // по умолчанию true

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

            // действие отключено, было активно — деактивируем
            if (this.activeActions.has(actionName)) {
                this.activeActions.delete(actionName);
                const event = new CustomEvent(inputController.ACTION_DEACTIVATED, {
                    detail: { act: actionName }
                });
                this.target.dispatchEvent(event);
            }
        }
    }

    attach(target, dontEnable = false) {
        if (this.target) {
            this.detach(true);
        }
        this.target = target;
        this.target.addEventListener('keyup', this.onKeyUp);
        this.target.addEventListener('keydown', this.onKeyDown);

        if (!dontEnable) {
            this.enabled = true;
            for (const [actionName, actionConfig] of this.actions) {
                this.enableAction(actionName);
            }
        }
    }

    detach(dontEnable = false) {
        if (this.target) {
            this.target.removeEventListener('keydown', this.onKeyDown);
            this.target.removeEventListener('keyup', this.onKeyUp);
        }

        this.keysActive.clear();
        this.activeActions.clear();
    }

    isKeyPressed(key) {
        return this.keysActive.has(key);
    }

    isActionActive(actionName) {
        return this.activeActions.has(actionName);
    }
}