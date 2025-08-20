
class Plugin{
    constructor(){
        this.controller = null;
        this.target = null;
    }
    init(controller){
        this.controller = controller; 
    }

    attach(target){}

    detach(){}

    getActionName(event){}

    getKeyCode(e){}
}

class MousePlugin extends Plugin{

    constructor(){
        super();
        this.mouseDown = this.handleMouseDown.bind(this);
        this.mouseUp = this.handleMouseUp.bind(this);
        this.contextMenu = this.handleContextMenu.bind(this);
    }
    attach(target){
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

    getActionNameByKey(keyCodeStr) {
        // keyCodeStr: например, "Mouse_2"
        const match = /^MousePlugin_(\d+)$/.exec(keyCodeStr);
        if (!match) return null;
        const button = Number(match[1]);

        if (button === 0) return 'left';
        if (button === 2) return 'right';
        return null;
    }

    getActionName(e) {
        if (e.button === 0) return 'left';
        if (e.button === 2) return 'right';
        return null;
    }

    getKeyCode(e){
        return `Mouse_${e.button}`;
    }


    handleContextMenu(e){
        e.preventDefault();
    }
    
    handleMouseDown(e){

        let actionName = this.getActionName(e);
        if(actionName){
            e.preventDefault();

            this.controller._recordNewAction(this, actionName, e.button, true);

        }

        if (document.activeElement !== this.target) {
            this.target.focus();
        }
    }

    handleMouseUp(e){
        let actionName = this.getActionName(e);
        if(actionName){
            e.preventDefault();

            this.controller._recordNewAction(this, actionName, e.button, false);
        }

    }


}

class KeyBoardPlugin extends Plugin{
    constructor(){
        super();
        this.onKeyDown = this.handleOnKeyDown.bind(this);
        this.onKeyUp = this.handleOnKeyUp.bind(this);
    }
    attach(target){
        this.target = target;
        this.target.addEventListener('keydown', this.onKeyDown);
        this.target.addEventListener('keyup', this.onKeyUp);
    }

    detach(){
        if(this.target){
            this.target.removeEventListener('keydown', this.onKeyDown);
            this.target.removeEventListener('keyup', this.onKeyUp);
            this.target = null;
        }
    }

    getActionName(e){
        return this.controller._getActionByCode(e.keyCode);
    }

    getKeyCode(e){
        return e.keyCode;
    }

    handleOnKeyDown(e){
        let actionName = this.getActionName(e);

         // Убедимся, что элемент в фокусе
        if (document.activeElement !== this.controller.target) {
            this.controller.target.focus();
        }


        if(actionName){
            if(actionName == 'space'){
                document.getElementById('element').className = 'element color-g';
            }
            this.controller._recordNewAction(this, actionName, e.keyCode, true);
        }
    }
    handleOnKeyUp(e){
        let actionName = this.getActionName(e);
        if(actionName){

            if(actionName == 'space'){
                document.getElementById('element').className = 'element';
            }
            this.controller._recordNewAction(this, actionName, e.keyCode, false);
        }
    }
}


class InputController {
    static ACTION_ACTIVATED = 'input-controller:action-activated';
    static ACTION_DEACTIVATED = 'input-controller:action-deactivated';
    
    constructor(actionsToBind = null, target = null) {
        this.focused = document.hasFocus();
        this.enabled = true;

        
        this.actions = new Map();     
        this.actionsKeys = new Map();       
        this.activeActions = new Set();
        this.plugins = new Set();
        this.activeInputs = new Set();
        this.pluginInstance = new Map();

        if (actionsToBind) {
            this.bindActions(actionsToBind);
        }
        
        this.use(KeyBoardPlugin);
        
        if (target) {
            this.attach(target);
        }
        
        this.onWindowBlur = this.onWindowBlur.bind(this);
        this.onWindowFocus = this.onWindowFocus.bind(this);
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

    
    _recordNewAction(plugin, actionName, keyCode, isPressed){
        if(!this.focused || !this.enabled) return;
        
        let action = this.actions.get(actionName);
        if( !action || !action.enabled) return;
        /* console.log(this.activeInputs) */
        
        let inputKey =  `${plugin.constructor.name}_${keyCode}`;
        
        if(isPressed){
            this.activeInputs.add(inputKey);

            if(!this.activeActions.has(actionName)){
                this.activeActions.add(actionName);
                const event = new CustomEvent(InputController.ACTION_ACTIVATED, {
                    detail: { act: actionName }
                });
                this.target.dispatchEvent(event);
            }
        }
        else{
            this.activeInputs.delete(inputKey);
            /* console.log(this.activeInputs) */
            
            let isStillAlive = this._isStillAlive(actionName);
            /* console.log(isStillAlive) */
            

            if(!isStillAlive && this.activeActions.has(actionName)){
                this.activeActions.delete(actionName);
                const event = new CustomEvent(InputController.ACTION_DEACTIVATED, {
                    detail: { act: actionName }
                });
                this.target.dispatchEvent(event);
            }
            
        }
    }
    _getActionByCode(keyCode) {
        for (let [action, config] of this.actions){
            let keys = config.keys;

            if(keys && keys.includes(keyCode))
                return action;
        }
        return null;
    }
    
    _isStillAlive(actionName){
        
        let action = this.actions.get(actionName);
        if(!action) return;
        
        let keys = action.keys.some(key=>{
            return this.activeInputs.has(`KeyBoardPlugin_${key}`);
        } );
        
        if (keys) {
            return true;
        }

        for (const inputKey of this.activeInputs) {

            for (const plugin of this.plugins) {
                const pluginName = plugin.constructor.name;
                if (inputKey.startsWith(`${pluginName}_`)) {

                    const actionForInput = plugin.getActionNameByKey?.(inputKey);
                    if (actionForInput === actionName) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    use(Plugin){
        if(this.pluginInstance.has(Plugin)) return;

        let plugin = new Plugin();
        plugin.init(this);
        this.plugins.add(plugin);
        this.pluginInstance.set(Plugin, plugin);
        
        if(this.target)
            plugin.attach(this.target);
    }

    remove(Plugin){
        let plugin = this.pluginInstance.get(Plugin);

        if(plugin){
            plugin.detach();
            this.pluginInstance.delete(Plugin);
            this.plugins.delete(plugin);
        }
    }

    attach(target, dontEnable = false) {
        if (this.target) 
            this.detach(true);
        
        this.target = target;

        for(const plugin of this.plugins){
            plugin.attach(this.target); 
        }
    
        if (!dontEnable) {
            this.enabled = true;


            for (const [actionName, actionConfig] of this.actions) {
                this.enableAction(actionName);
            }

        }

    }
    
    detach(dontEnable = false) {

         for(const plugin of this.plugins) {
            plugin.detach();
        }
        
        this.activeInputs.clear();
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
                const event = new CustomEvent(InputController.ACTION_DEACTIVATED, {
                    detail: { act: actionName }
                });
                this.target.dispatchEvent(event);
            }
        }
    }
    
    
    isKeyPressed(key) {
        return this.activeInputs.has(`Keyboard_${key}`);
    }
    
    isActionActive(actionName) {
        return this.activeActions.has(actionName);
    }






    /* _activateAction(actionName){
        if(!this.focused || !this.enabled) return;

        if (this.activeActions.has(actionName)) return;

        this.activeActions.add(actionName);

        const event = new CustomEvent(InputController.ACTION_ACTIVATED, {
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

        const event = new CustomEvent(InputController.ACTION_DEACTIVATED, {
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

        const action = this.actions.get(actionName);
        if (!action || !action.enabled) return;

        const inputKey = `${plugin.constructor.name}_${keyCode}`;

        if (isPressed) {
            this.activeInputs.add(inputKey);

            if (!this.activeActions.has(actionName)) {
                this.activeActions.add(actionName);
                
                if (!wasActive) {
                    const event = new CustomEvent(InputController.ACTION_ACTIVATED, {
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
                    
                    const event = new CustomEvent(InputController.ACTION_DEACTIVATED, {
                        detail: { act: actionName }
                    });
                    this.target.dispatchEvent(event);
                }
            }
        }
    } */
    
}

