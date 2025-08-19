class mouseController {
    constructor(){
        this.controller = null;
        this.target = null;
        this.mouseDown = this.handleMouseDown.bind(this);
        this.mouseUp = this.handleMouseUp.bind(this);
        this.contextMenu = this.handleContextMenu.bind(this);
    }
    init(controller){
        this.controller = controller;
    }
    

    attach(target){
        this.target = target;

        target.addEventListener('mousedown', this.mouseDown);
        target.addEventListener('mouseup', this.mouseUp);
        target.addEventListener('contextmenu', this.contextMenu);
    }

    detach(){
        if(this.target){
            this.target.removeEventListener('mousedown', this.mouseDown);
            this.target.removeEventListener('mouseup', this.mouseUp);
            this.target.removeEventListener('contextmenu', this.contextMenu);
            this.target = null;
        }
    }

    handleMouseDown(e){
        let actionName = null;
        
        if(e.button === 0)
            actionName = 'left';
        else if(e.button === 2){
            actionName = 'right';
            e.preventDefault();
        }

        if(actionName){
            this.controller._recordeActivityFromPlugin(actionName);
            this.controller._activateAction(actionName);
        }

        if (document.activeElement !== this.target) {
            this.target.focus();
        }
    }

    handleMouseUp(e){
        let actionName = null;

        if(e.button === 0)
            actionName = 'left';
        else if(e.button === 2){
            actionName = 'right';
            e.preventDefault();
        }

        if(actionName){
            this.controller._unrecordeActivityFromPlugin(actionName);
            this.controller._deactivateAction(actionName);
        }
    }
    handleContextMenu(e){
        e.preventDefault();
    }
    
    
}



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
        this.plugins = new Set();
        
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.activePlugins = new Set();

        this.bindActions(actionsToBind);
        
        this.attach(this.target);
        
        window.addEventListener('blur', () => {
            this.focused = false;
        });
        
        window.addEventListener('focus', () => {
            this.focused = true;
        });
    }
    
    use(plugin){
        if(!this.plugins.has(plugin)){
            this.plugins.add(plugin);
            plugin.init(this);

            if(this.target)
                plugin.attach(this.target);
        }
    }
    turnMouseOn(){
        if(this.plugins.size>0){
            this.turnMouseOff();
        }
        const mousePlugin = new mouseController();
        this.use(mousePlugin);
    }

    turnMouseOff(){
        for(const plugin of this.plugins){
            if (typeof plugin.detach === 'function'){
                plugin.detach();
            }
        }

        this.plugins.clear();
        this.activePlugins.clear();
    }

    _activateAction(actionName){
        if(!this.focused || !this.enabled) return;

        if (this.activeActions.has(actionName)) return;

        this.activeActions.add(actionName);

        const event = new CustomEvent(inputController.ACTION_ACTIVATED, {
                detail: { act: actionName }
            });
        this.target.dispatchEvent(event);
    }

    _recordeActivityFromPlugin(actionName){
        this.activePlugins.add(actionName);
    }
    _unrecordeActivityFromPlugin(actionName){
        this.activePlugins.delete(actionName);
    }

    _deactivateAction(actionName){
        if(!this.focused || !this.enabled) return;

        if (!this.activeActions.has(actionName)) return;

        let name = this.actions.get(actionName);
        if(!name) return;

        let hasAnotherKeyForAction = name.keys.some(key=> this.keysActive.has(key));
        if(hasAnotherKeyForAction) return;

        let stillActive = this.activePlugins.has(actionName);
        if(stillActive) return;
        
        this.activeActions.delete(actionName);

        const event = new CustomEvent(inputController.ACTION_DEACTIVATED, {
                detail: { act: actionName } 
            });
        this.target.dispatchEvent(event);
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
                const stillActive = this.activePlugins.has(actionName);
                
                if (!otherKeysStillPressed && !stillActive) {
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

        for(const plugin of this.plugins){
            if (typeof plugin.attach === 'function'){
                plugin.attach(this.target);
            }
        }
    }
    
    detach(dontEnable = false) {
        if (this.target) {
            this.target.removeEventListener('keydown', this.onKeyDown);
            this.target.removeEventListener('keyup', this.onKeyUp);
        }

         for(const plugin of this.plugins) {
            if (typeof plugin.detach === 'function'){
                plugin.detach();
            }
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